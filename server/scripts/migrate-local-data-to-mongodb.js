import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MongoClient } from 'mongodb';
import { COLLECTION_NAMES, initializeDatabaseSchema, normalizeMobile } from '../db.js';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const sourcePath = path.resolve(scriptDirectory, '../data/local-db.json');

function requireConfiguration() {
  const missing = ['MONGODB_URI', 'MONGODB_DB_NAME'].filter((name) => !process.env[name]?.trim());
  if (missing.length) {
    throw new Error(`Required server environment variables are missing: ${missing.join(', ')}.`);
  }
}

function validateSource(data) {
  for (const name of COLLECTION_NAMES) {
    if (!Array.isArray(data[name])) {
      throw new Error(`Migration source must contain a "${name}" array.`);
    }
    const ids = new Set();
    for (const record of data[name]) {
      if (!record || typeof record.id !== 'string' || !record.id.trim()) {
        throw new Error(`Every "${name}" record must have a non-empty string id.`);
      }
      if (ids.has(record.id)) throw new Error(`Migration source has a duplicate id in "${name}".`);
      ids.add(record.id);
    }
  }

  for (const name of ['users', 'students']) {
    const emails = new Set();
    const mobiles = new Set();
    for (const record of data[name]) {
      if (record.email) {
        const email = String(record.email).trim().toLowerCase();
        if (emails.has(email)) throw new Error(`Migration source has duplicate email addresses in "${name}".`);
        emails.add(email);
      }
      const mobile = normalizeMobile(record.mobile ?? record.phone);
      if (mobile.length === 10) {
        if (mobiles.has(mobile)) throw new Error(`Migration source has duplicate normalized mobile numbers in "${name}".`);
        mobiles.add(mobile);
      }
    }
  }

  const invalidPasswordHashes = data.users.filter(
    (user) => typeof user.passwordHash !== 'string' || !/^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(user.passwordHash)
  );
  if (invalidPasswordHashes.length) {
    throw new Error('Migration source contains users without a valid bcrypt password hash. Migration stopped to prevent storing plaintext or unsupported passwords.');
  }

  const userIds = new Set(data.users.map((user) => user.id));
  const studentUserIds = new Set();
  for (const student of data.students) {
    if (student.userId && !userIds.has(student.userId)) {
      throw new Error(`Student "${student.id}" references a user that is missing from the migration source.`);
    }
    if (student.userId && studentUserIds.has(student.userId)) {
      throw new Error('Migration source has multiple student profiles for one user.');
    }
    if (student.userId) studentUserIds.add(student.userId);
  }
}

async function readMigrationSource() {
  let contents;
  try {
    contents = await fs.readFile(sourcePath, 'utf8');
  } catch {
    throw new Error('Could not read server/data/local-db.json. Keep the local database backup in place until migration is verified.');
  }
  try {
    const data = JSON.parse(contents);
    validateSource(data);
    return data;
  } catch (error) {
    if (error instanceof SyntaxError) throw new Error('server/data/local-db.json contains invalid JSON.');
    throw error;
  }
}

async function migrate() {
  const source = await readMigrationSource();
  if (process.argv.includes('--dry-run')) {
    console.log('Migration source validation passed. No database connection was opened.');
    for (const name of COLLECTION_NAMES) console.log(`${name}: ${source[name].length} records ready to migrate`);
    return;
  }

  requireConfiguration();
  const client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10_000 });

  try {
    await client.connect();
    const database = client.db(process.env.MONGODB_DB_NAME);
    await initializeDatabaseSchema(database);

    const session = client.startSession();
    const summary = {};
    try {
      await session.withTransaction(async () => {
        for (const name of COLLECTION_NAMES) {
          const collection = database.collection(name);
          const lastPositioned = await collection.find({}, { session, projection: { _position: 1 } })
            .sort({ _position: -1 })
            .limit(1)
            .next();
          const nextPosition = (lastPositioned?._position ?? -1) + 1;
          const records = source[name];
          if (records.length === 0) {
            summary[name] = { inserted: 0, alreadyPresent: 0 };
            continue;
          }

          const operations = records.map((record, index) => {
            const migratedRecord = {
              ...record,
              _version: Number.isInteger(record._version) ? record._version : 0,
              _position: Number.isInteger(record._position) ? record._position : nextPosition + index,
            };
            if (name === 'users' || name === 'students') {
              const mobile = normalizeMobile(record.mobile ?? record.phone);
              if (mobile.length === 10) migratedRecord.mobileNormalized = mobile;
            }
            return {
              updateOne: {
                filter: { id: record.id },
                update: { $setOnInsert: migratedRecord },
                upsert: true,
              },
            };
          });

          const result = await collection.bulkWrite(operations, { ordered: true, session });
          summary[name] = {
            inserted: result.upsertedCount,
            alreadyPresent: records.length - result.upsertedCount,
          };
        }
      });
    } finally {
      await session.endSession();
    }

    console.log(`Migration completed into MongoDB database "${process.env.MONGODB_DB_NAME}".`);
    for (const [name, counts] of Object.entries(summary)) {
      console.log(`${name}: inserted ${counts.inserted}, already present ${counts.alreadyPresent}`);
    }
    console.log('The local JSON file was not changed or deleted.');
  } catch (error) {
    if (error?.code === 11000) {
      throw new Error('Migration stopped because existing MongoDB records conflict with a unique id, email, mobile number, or student user link. No records were deleted; resolve the conflict before retrying.');
    }
    throw error;
  } finally {
    await client.close().catch(() => {});
  }
}

migrate().catch((error) => {
  console.error(`Migration failed: ${error.message}`);
  process.exitCode = 1;
});

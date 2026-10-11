import { MongoClient } from 'mongodb';

export const COLLECTION_NAMES = [
  'users',
  'students',
  'courses',
  'enrollments',
  'payments',
  'liveSessions',
  'materials',
  'tests',
  'results',
  'enquiries',
  'announcements',
];

let client;
let database;
let connectionPromise;
const snapshots = new WeakMap();

class MongoWriteConflictError extends Error {
  constructor() {
    super('This record changed in another request. Reload and try again.');
    this.code = 'WRITE_CONFLICT';
  }
}

export function normalizeMobile(value) {
  const digits = String(value ?? '').replace(/\D/g, '');
  return digits.length > 10 ? digits.slice(-10) : digits;
}

function withoutMongoFields(document) {
  return Object.fromEntries(
    Object.entries(document).filter(([field]) =>
      !['_id', '_version', '_position', 'mobileNormalized'].includes(field) &&
      !field.toLowerCase().startsWith('refund')
    )
  );
}

function persistenceDocument(collectionName, record, version, position, existingMobile = undefined) {
  const document = { ...record, _version: version, _position: position };
  if (collectionName === 'users' || collectionName === 'students') {
    const mobile = normalizeMobile(record.mobile ?? record.phone);
    if (mobile.length === 10) document.mobileNormalized = mobile;
    else if (existingMobile) document.mobileNormalized = existingMobile;
  }
  return document;
}

function serialize(value) {
  return JSON.stringify(value);
}

function getDatabase() {
  if (!database) {
    const error = new Error('MongoDB is not connected. The API requires MongoDB Atlas and will not fall back to local JSON storage.');
    error.code = 'MONGODB_UNAVAILABLE';
    throw error;
  }
  return database;
}

export function getMongoClient() {
  if (!client) throw new Error('MongoDB is not connected.');
  return client;
}

export function getMongoDatabase() {
  return getDatabase();
}

export async function pingDatabase() {
  await getDatabase().command({ ping: 1 }, { maxTimeMS: 5_000 });
}

function mongoConnectionDiagnostic(error) {
  const pending = [error];
  const visited = new Set();
  const codes = new Set();
  const names = new Set();

  while (pending.length && visited.size < 30) {
    const current = pending.shift();
    if (typeof current === 'string') {
      const tlsCode = current.match(/ERR_SSL_[A-Z0-9_]+/);
      if (tlsCode) codes.add(tlsCode[0]);
      continue;
    }
    if (!current || typeof current !== 'object' || visited.has(current)) continue;
    visited.add(current);
    if (current.code !== undefined) codes.add(String(current.code));
    if (current.name) names.add(String(current.name));
    pending.push(current.cause, current.reason, current.error);
    const servers = current.reason?.servers;
    if (servers && typeof servers.values === 'function') {
      for (const server of servers.values()) pending.push(server?.description?.error);
    }
  }

  const code = [...codes].find((value) => value.startsWith('ERR_SSL_'));
  if (code) {
    return {
      code: 'MONGODB_TLS_HANDSHAKE_FAILED',
      message: `MongoDB TLS negotiation failed before authentication (${code}). Keep certificate validation enabled; check Atlas cluster availability, DNS, the backend's outbound IP allowlist, and outbound TCP 27017.`,
    };
  }
  if (codes.has('ENOTFOUND') || codes.has('EAI_AGAIN')) {
    return {
      code: 'MONGODB_DNS_FAILED',
      message: 'MongoDB DNS/SRV lookup failed. Check the Atlas connection string, DNS resolver, and cluster availability.',
    };
  }
  if (codes.has('ECONNREFUSED') || codes.has('ETIMEDOUT') || codes.has('ECONNRESET')) {
    return {
      code: 'MONGODB_NETWORK_FAILED',
      message: 'MongoDB network connection failed before authentication. Check the backend outbound IP allowlist and outbound TCP 27017.',
    };
  }
  if (codes.has('18') || names.has('MongoServerError') && [...codes].includes('8000')) {
    return {
      code: 'MONGODB_AUTHENTICATION_FAILED',
      message: 'MongoDB authentication failed after the connection was established. Check the database username, password URL-encoding, and database-user permissions.',
    };
  }
  if (names.has('MongoParseError')) {
    return {
      code: 'MONGODB_URI_INVALID',
      message: 'MongoDB rejected the connection-string format. Check the mongodb+srv URI structure and percent-encode reserved characters in credentials.',
    };
  }
  return {
    code: 'MONGODB_CONNECTION_FAILED',
    message: 'MongoDB connection or initialization failed. Check the Atlas cluster, DNS, network allowlist, database credentials, permissions, and transaction support.',
  };
}

export async function initializeDatabaseSchema(db) {
  for (const collectionName of COLLECTION_NAMES) {
    const collection = db.collection(collectionName);
    await collection.createIndex({ id: 1 }, { unique: true, name: 'id_unique' });
    await collection.updateMany({ _version: { $exists: false } }, { $set: { _version: 0 } });

    const unorderedRecords = await collection
      .find({ _position: { $exists: false } })
      .sort({ _id: 1 })
      .project({ id: 1 })
      .toArray();
    if (unorderedRecords.length) {
      const lastPositioned = await collection.find({ _position: { $exists: true } })
        .sort({ _position: -1 })
        .limit(1)
        .next();
      const nextPosition = (lastPositioned?._position ?? -1) + 1;
      await collection.bulkWrite(unorderedRecords.map((record, index) => ({
        updateOne: { filter: { id: record.id }, update: { $set: { _position: nextPosition + index } } },
      })));
    }

    if (collectionName === 'users' || collectionName === 'students') {
      const records = await collection
        .find({})
        .project({ id: 1, mobile: 1, phone: 1, mobileNormalized: 1 })
        .toArray();
      const mobileUpdates = records.flatMap((record) => {
        const mobile = normalizeMobile(record.mobile ?? record.phone);
        return mobile.length === 10 && record.mobileNormalized !== mobile
          ? [{ updateOne: { filter: { id: record.id }, update: { $set: { mobileNormalized: mobile } } } }]
          : [];
      });
      if (mobileUpdates.length) await collection.bulkWrite(mobileUpdates, { ordered: true });
    }

    const invalidIds = await collection.find({
      $or: [{ id: { $exists: false } }, { id: { $not: { $type: 'string' } } }, { id: '' }],
    }).limit(1).toArray();
    if (invalidIds.length) {
      throw new Error(`MongoDB collection "${collectionName}" contains records without stable string IDs.`);
    }
  }

  await db.collection('users').createIndex(
    { email: 1 },
    {
      unique: true,
      collation: { locale: 'en', strength: 2 },
      partialFilterExpression: { email: { $type: 'string' } },
      name: 'email_unique_case_insensitive',
    }
  );
  await db.collection('users').createIndex(
    { mobileNormalized: 1 },
    { unique: true, partialFilterExpression: { mobileNormalized: { $type: 'string' } }, name: 'mobile_unique' }
  );
  await db.collection('students').createIndex(
    { mobileNormalized: 1 },
    { unique: true, partialFilterExpression: { mobileNormalized: { $type: 'string' } }, name: 'student_mobile_unique' }
  );
  await db.collection('students').createIndex(
    { userId: 1 },
    { unique: true, sparse: true, name: 'student_user_unique' }
  );
  await db.collection('emailNotifications').createIndex(
    { id: 1 },
    { unique: true, name: 'email_notification_id_unique' }
  );
  await db.collection('emailNotifications').createIndex(
    { status: 1, nextAttemptAt: 1, createdAt: 1 },
    { name: 'email_notification_queue' }
  );
  await db.collection('studentMobileOtpChallenges').createIndex(
    { challengeId: 1 },
    { unique: true, sparse: true, name: 'student_mobile_otp_challenge_unique' }
  );
  await db.collection('studentMobileOtpChallenges').createIndex(
    { expiresAt: 1 },
    { expireAfterSeconds: 0, name: 'student_mobile_otp_expiry' }
  );
  await db.collection('adminPasswordResetTokens').createIndex(
    { tokenHash: 1 },
    { unique: true, name: 'admin_password_reset_token_hash_unique' }
  );
  await db.collection('adminPasswordResetTokens').createIndex(
    { expiresAt: 1 },
    { expireAfterSeconds: 0, name: 'admin_password_reset_expiry' }
  );
}

export async function connectDatabase() {
  if (database) return database;
  if (connectionPromise) return connectionPromise;

  const missing = ['MONGODB_URI', 'MONGODB_DB_NAME'].filter((name) => !process.env[name]?.trim());
  if (missing.length) {
    const error = new Error(`Required server environment variables are missing: ${missing.join(', ')}. Configure them in .env or the server process environment.`);
    error.code = 'MONGODB_CONFIGURATION_MISSING';
    throw error;
  }

  connectionPromise = (async () => {
    const nextClient = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10_000 });
    try {
      await nextClient.connect();
      const nextDatabase = nextClient.db(process.env.MONGODB_DB_NAME);
      const topology = await nextDatabase.admin().command({ hello: 1 });
      if (!topology.setName && topology.msg !== 'isdbgrid') {
        throw new Error('MongoDB must run as a replica set or sharded cluster; standalone MongoDB cannot support account-creation transactions.');
      }
      await initializeDatabaseSchema(nextDatabase);
      await nextDatabase.command({ ping: 1 }, { maxTimeMS: 5_000 });
      client = nextClient;
      database = nextDatabase;
      return database;
    } catch (error) {
      await nextClient.close().catch(() => {});
      if (error?.code === 11000) {
        throw new Error('MongoDB startup failed: existing records contain duplicate IDs, emails, or mobile numbers. Resolve duplicates without deleting records, then restart.');
      }
      if (error?.message?.startsWith('MongoDB collection "') || error?.message?.startsWith('MongoDB must run as a replica set')) {
        throw error;
      }
      const diagnostic = mongoConnectionDiagnostic(error);
      const startupError = new Error(`${diagnostic.message} Diagnostic: ${diagnostic.code}. No connection string or credential values were logged.`, { cause: error });
      startupError.code = diagnostic.code;
      throw startupError;
    } finally {
      connectionPromise = undefined;
    }
  })();
  return connectionPromise;
}

export async function closeDatabase() {
  if (client) await client.close();
  client = undefined;
  database = undefined;
  connectionPromise = undefined;
}

export async function getDb() {
  const db = getDatabase();
  const entries = await Promise.all(COLLECTION_NAMES.map(async (name) => {
    const docs = await db.collection(name).find({}).sort({ _position: 1, _id: 1 }).toArray();
    return [name, docs.map(withoutMongoFields), new Map(docs.map((doc) => [
      doc.id,
      {
        version: doc._version ?? 0,
        position: doc._position ?? 0,
        mobileNormalized: doc.mobileNormalized,
        value: serialize(withoutMongoFields(doc)),
      },
    ]))];
  }));

  const state = Object.fromEntries(entries.map(([name, records]) => [name, records]));
  snapshots.set(state, new Map(entries.map(([name, records, baseline]) => [
    name,
    { records: baseline, order: records.map((record) => record.id) },
  ])));
  return state;
}

export async function saveDb(updatedData, { notifications = [] } = {}) {
  const db = getDatabase();
  const previous = snapshots.get(updatedData);
  if (!previous) {
    throw new Error('Refusing to persist an untracked database snapshot. Load data using getDb() before editing it.');
  }

  const changes = [];
  for (const name of COLLECTION_NAMES) {
    const records = updatedData[name];
    if (!Array.isArray(records)) throw new Error(`Refusing to persist invalid "${name}" records.`);
    const baseline = previous.get(name).records;
    const seen = new Set();
    for (let position = 0; position < records.length; position += 1) {
      const record = records[position];
      if (!record || typeof record.id !== 'string' || !record.id || seen.has(record.id)) {
        throw new Error(`Refusing to persist invalid or duplicate IDs in "${name}".`);
      }
      seen.add(record.id);
      const original = baseline.get(record.id);
      if (!original) changes.push({ operation: 'insert', name, record, position });
      else if (serialize(record) !== original.value || original.position !== position) {
        changes.push({ operation: 'replace', name, record, version: original.version, position });
      }
    }
    for (const [id, original] of baseline) {
      if (!seen.has(id)) changes.push({ operation: 'delete', name, id, version: original.version });
    }
  }
  if (!Array.isArray(notifications)) throw new Error('Refusing to persist invalid email notifications.');
  if (!changes.length && notifications.length === 0) return;

  const session = client.startSession();
  try {
    await session.withTransaction(async () => {
      for (const change of changes) {
        const collection = db.collection(change.name);
        if (change.operation === 'insert') {
          await collection.insertOne(
            persistenceDocument(change.name, change.record, 0, change.position),
            { session }
          );
        } else if (change.operation === 'replace') {
          const result = await collection.replaceOne(
            { id: change.record.id, _version: change.version },
            persistenceDocument(
              change.name,
              change.record,
              change.version + 1,
              change.position,
              previous.get(change.name).records.get(change.record.id).mobileNormalized
            ),
            { session }
          );
          if (result.matchedCount !== 1) throw new MongoWriteConflictError();
        } else {
          const result = await collection.deleteOne({ id: change.id, _version: change.version }, { session });
          if (result.deletedCount !== 1) throw new MongoWriteConflictError();
        }
      }
      for (const notification of notifications) {
        if (!notification || typeof notification.id !== 'string' || !notification.id ||
            typeof notification.idempotencyKey !== 'string' || !notification.idempotencyKey) {
          throw new Error('Refusing to persist an email notification without a stable ID.');
        }
        await db.collection('emailNotifications').updateOne(
          { id: notification.id },
          { $setOnInsert: notification },
          { upsert: true, session }
        );
      }
    });
  } finally {
    await session.endSession();
  }
}

export async function findUserByCredentials(identifier) {
  const db = getDatabase();
  const clean = String(identifier ?? '').trim();
  const mobile = normalizeMobile(clean);
  const user = await db.collection('users').findOne(
    {
      $or: [
        { email: clean },
        { phone: clean },
        { mobileNormalized: mobile },
        { id: clean },
      ],
    },
    { collation: { locale: 'en', strength: 2 } }
  );
  return user ? withoutMongoFields(user) : undefined;
}

export async function findUserById(id) {
  const user = await getDatabase().collection('users').findOne({ id }, { projection: { passwordHash: 0 } });
  return user ? withoutMongoFields(user) : undefined;
}

export async function findStudentByUserId(userId) {
  const student = await getDatabase().collection('students').findOne({ userId });
  return student ? withoutMongoFields(student) : undefined;
}

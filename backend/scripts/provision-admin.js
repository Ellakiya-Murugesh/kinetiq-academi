import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { closeDatabase, connectDatabase, getMongoClient } from '../db.js';

const ADMIN_BOOTSTRAP_GUARD_KEY = 'initial-admin';
const projectEnvPath = fileURLToPath(new URL('../../.env', import.meta.url));

function loadProjectEnvironment() {
  try {
    process.loadEnvFile(projectEnvPath);
  } catch (error) {
    if (error?.code === 'ENOENT') return;
    throw new Error('Unable to load the project-root .env file. Check its syntax and file permissions.');
  }
}

function assertDatabaseTarget() {
  const databaseName = process.env.MONGODB_DB_NAME?.trim();
  if (!databaseName) {
    throw new Error('Refusing to provision: MONGODB_DB_NAME must be configured.');
  }

  const uri = process.env.MONGODB_URI || '';
  if (!uri) {
    throw new Error('Refusing to provision: MONGODB_URI must be configured.');
  }
}

function getAdminInput() {
  const name = String(process.env.ADMIN_BOOTSTRAP_NAME || 'Academic Director').trim();
  const email = String(process.env.ADMIN_BOOTSTRAP_EMAIL || '').trim().toLowerCase();
  const password = String(process.env.ADMIN_BOOTSTRAP_PASSWORD || '');

  if (!name || name.length > 120) {
    throw new Error('Set ADMIN_BOOTSTRAP_NAME to the administrator name (up to 120 characters).');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Set ADMIN_BOOTSTRAP_EMAIL to a valid email address.');
  }
  const passwordBytes = Buffer.byteLength(password, 'utf8');
  if (passwordBytes < 8 || passwordBytes > 72) {
    throw new Error('ADMIN_BOOTSTRAP_PASSWORD must be between 8 and 72 bytes.');
  }

  return { name, email, password };
}

export async function createInitialAdminRecord({ database, session, newUser }) {
  const users = database.collection('users');
  const guards = database.collection('adminBootstrapGuards');

  await guards.insertOne(
    { bootstrapKey: ADMIN_BOOTSTRAP_GUARD_KEY, createdAt: new Date().toISOString() },
    { session }
  );

  const adminExists = await users.findOne(
    { role: 'ADMIN' },
    { session, projection: { _id: 1 } }
  );
  if (adminExists) {
    throw new Error('An administrator already exists in the database. No records were changed.');
  }

  const existingUser = await users.findOne(
    { email: newUser.email },
    { session, collation: { locale: 'en', strength: 2 }, projection: { _id: 1 } }
  );
  if (existingUser) {
    throw new Error('An account already exists for this email. No records were changed.');
  }

  const lastPositionedUser = await users.find({}, { session, projection: { _position: 1 } })
    .sort({ _position: -1 })
    .limit(1)
    .next();
  newUser._position = (lastPositionedUser?._position ?? -1) + 1;
  await users.insertOne(newUser, { session });
}

export function safeProvisioningError(error) {
  const hasTransientTransactionLabel =
    error?.hasErrorLabel?.('TransientTransactionError') ||
    error?.errorLabels?.includes?.('TransientTransactionError');

  if (error?.code === 11000) {
    return 'A unique database guard or account record already exists. No additional administrator was provisioned.';
  }
  if (error?.code === 112 || hasTransientTransactionLabel) {
    return 'A concurrent provisioning transaction conflicted. No additional administrator was provisioned.';
  }
  if (error?.message && !error.message.includes('password') && !error.message.includes('mongodb+srv')) {
    return error.message;
  }
  return 'Provisioning failed due to a database or configuration error. No connection details or credentials were logged.';
}

async function provisionAdmin() {
  loadProjectEnvironment();
  assertDatabaseTarget();
  const { name, email, password } = getAdminInput();
  const database = await connectDatabase();

  const existingAdmin = await database.collection('users').findOne(
    { role: 'ADMIN' },
    { projection: { _id: 1 } }
  );
  if (!existingAdmin) {
    await database.collection('adminBootstrapGuards').deleteMany({ bootstrapKey: ADMIN_BOOTSTRAP_GUARD_KEY });
  }

  const session = getMongoClient().startSession();

  try {
    await database.collection('adminBootstrapGuards').createIndex(
      { bootstrapKey: 1 },
      { unique: true, name: 'admin_bootstrap_guard_key_unique' }
    );
    const passwordHash = await bcrypt.hash(password, 12);
    await session.withTransaction(async () => {
      await createInitialAdminRecord({
        database,
        session,
        newUser: {
          id: `usr-admin-${randomUUID()}`,
          name,
          email,
          passwordHash,
          role: 'ADMIN',
          status: 'ACTIVE',
          sessionVersion: 0,
          createdAt: new Date().toISOString(),
          _version: 0,
        },
      });
    });

    console.info(`Administrator account created successfully for ${email}.`);
  } finally {
    await session.endSession();
    await closeDatabase();
  }
}

const invokedScript = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : '';
if (import.meta.url === invokedScript) {
  provisionAdmin().catch((error) => {
    console.error(`Administrator provisioning failed: ${safeProvisioningError(error)}`);
    process.exitCode = 1;
  });
}


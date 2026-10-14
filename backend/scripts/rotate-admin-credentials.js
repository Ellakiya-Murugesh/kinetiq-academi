import bcrypt from 'bcryptjs';
import { MongoClient } from 'mongodb';
import { resolve } from 'node:path';
import { createInterface } from 'node:readline';
import { pathToFileURL } from 'node:url';
import { fileURLToPath } from 'node:url';

const ROTATION_CONFIRMATION = 'ROTATE EXISTING PRODUCTION ADMIN';
const TEST_DATABASE_NAME = 'kinetiqacademy_test';
const projectEnvPath = fileURLToPath(new URL('../../.env', import.meta.url));
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateRotationTarget(env) {
  const databaseName = String(env.MONGODB_DB_NAME || '').trim();
  const confirmedDatabase = String(env.ADMIN_CREDENTIAL_ROTATION_CONFIRM_DATABASE || '').trim();
  if (!databaseName || databaseName === TEST_DATABASE_NAME || confirmedDatabase !== databaseName) {
    throw new Error('Refusing credential rotation: confirm the exact non-test production database name.');
  }

  let uriHost;
  try {
    const uri = new URL(env.MONGODB_URI || '');
    if (!['mongodb:', 'mongodb+srv:'].includes(uri.protocol)) {
      throw new Error('invalid protocol');
    }
    uriHost = uri.hostname.toLowerCase();
  } catch {
    throw new Error('Refusing credential rotation: MONGODB_URI must be configured with a valid MongoDB URI.');
  }
  const confirmedHost = String(env.ADMIN_CREDENTIAL_ROTATION_CONFIRM_CLUSTER_HOST || '').trim().toLowerCase();
  if (!uriHost || !confirmedHost || uriHost !== confirmedHost) {
    throw new Error('Refusing credential rotation: confirm the exact production cluster host from MONGODB_URI.');
  }
  if (env.ADMIN_CREDENTIAL_ROTATION_CONFIRM !== ROTATION_CONFIRMATION) {
    throw new Error('Refusing credential rotation: set the explicit production rotation confirmation.');
  }

  return { databaseName, uriHost };
}

export function validateRotationInput(env) {
  const currentEmail = String(env.ADMIN_CREDENTIAL_ROTATION_CURRENT_EMAIL || '').trim().toLowerCase();
  const newEmail = String(env.ADMIN_CREDENTIAL_ROTATION_NEW_EMAIL || '').trim().toLowerCase();
  const password = String(env.ADMIN_CREDENTIAL_ROTATION_PASSWORD || '');

  if (!emailPattern.test(currentEmail) || currentEmail.length > 254) {
    throw new Error('Set ADMIN_CREDENTIAL_ROTATION_CURRENT_EMAIL to the existing administrator email.');
  }
  if (!emailPattern.test(newEmail) || newEmail.length > 254) {
    throw new Error('Set ADMIN_CREDENTIAL_ROTATION_NEW_EMAIL to a valid new administrator email.');
  }
  if (currentEmail === newEmail) {
    throw new Error('The new administrator email must differ from the current email.');
  }
  const passwordBytes = Buffer.byteLength(password, 'utf8');
  if (passwordBytes < 12 || passwordBytes > 72) {
    throw new Error('ADMIN_CREDENTIAL_ROTATION_PASSWORD must be between 12 and 72 UTF-8 bytes.');
  }

  return { currentEmail, newEmail, password };
}

function promptLine(prompt) {
  const terminal = createInterface({ input: process.stdin, output: process.stdout });
  return terminal.question(prompt).finally(() => terminal.close());
}

function promptHidden(prompt) {
  if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== 'function') {
    throw new Error('Run this command in an interactive terminal to enter the new password securely.');
  }

  return new Promise((resolvePrompt, rejectPrompt) => {
    const input = process.stdin;
    const passwordBytes = [];
    const onData = (chunk) => {
      for (const byte of chunk) {
        if (byte === 3) {
          input.off('data', onData);
          input.setRawMode(false);
          process.stdout.write('\n');
          rejectPrompt(new Error('Credential rotation cancelled.'));
          return;
        }
        if (byte === 13 || byte === 10) {
          input.off('data', onData);
          input.setRawMode(false);
          process.stdout.write('\n');
          resolvePrompt(Buffer.from(passwordBytes).toString('utf8'));
          return;
        }
        if (byte === 127 || byte === 8) {
          if (passwordBytes.length) {
            const removedByte = passwordBytes.pop();
            if ((removedByte & 0xc0) === 0x80) {
              while (passwordBytes.length && (passwordBytes.at(-1) & 0xc0) === 0x80) {
                passwordBytes.pop();
              }
              if (passwordBytes.length) passwordBytes.pop();
            }
          }
        } else if (byte >= 32) {
          passwordBytes.push(byte);
        }
      }
    };

    process.stdout.write(prompt);
    input.setRawMode(true);
    input.resume();
    input.on('data', onData);
  });
}

async function getRotationInput() {
  const currentEmail = await promptLine('Existing administrator email: ');
  const newEmail = await promptLine('New administrator email: ');
  const password = await promptHidden('New password (input hidden): ');
  const passwordConfirmation = await promptHidden('Confirm new password (input hidden): ');
  if (password !== passwordConfirmation) {
    throw new Error('The password entries did not match. No credentials were changed.');
  }
  return validateRotationInput({
    ADMIN_CREDENTIAL_ROTATION_CURRENT_EMAIL: currentEmail,
    ADMIN_CREDENTIAL_ROTATION_NEW_EMAIL: newEmail,
    ADMIN_CREDENTIAL_ROTATION_PASSWORD: password,
  });
}

export async function rotateExistingAdminCredentials({
  database,
  session,
  currentEmail,
  newEmail,
  passwordHash,
  now = () => new Date(),
}) {
  const users = database.collection('users');
  const admin = await users.findOne(
    { email: currentEmail, role: 'ADMIN', status: 'ACTIVE' },
    { session, collation: { locale: 'en', strength: 2 }, projection: { id: 1, _version: 1 } }
  );
  if (!admin) {
    throw new Error('No active administrator matches the supplied current email. No account was created.');
  }

  const existingNewEmail = await users.findOne(
    { email: newEmail },
    { session, collation: { locale: 'en', strength: 2 }, projection: { id: 1 } }
  );
  if (existingNewEmail) {
    throw new Error('The new email is already assigned to an account. No credentials were changed.');
  }

  const updated = await users.updateOne(
    {
      id: admin.id,
      role: 'ADMIN',
      status: 'ACTIVE',
      _version: admin._version,
    },
    {
      $set: { email: newEmail, passwordHash, updatedAt: now().toISOString() },
      $inc: { _version: 1, sessionVersion: 1 },
    },
    { session }
  );
  if (updated.matchedCount !== 1) {
    throw new Error('The administrator account changed during rotation. No credentials were changed.');
  }
}

function safeDiagnostic(error) {
  return String(error?.code || error?.name || 'ADMIN_ROTATION_ERROR')
    .replace(/[^A-Za-z0-9_-]/g, '')
    .slice(0, 48);
}

function loadProjectEnvironment() {
  try {
    process.loadEnvFile(projectEnvPath);
  } catch (error) {
    if (error?.code === 'ENOENT') return;
    throw new Error('Unable to load the project-root .env file. Check its syntax and file permissions.');
  }
}

async function runRotation() {
  validateRotationTarget(process.env);
  const { currentEmail, newEmail, password } = await getRotationInput();
  const client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10_000 });
  let session;

  try {
    await client.connect();
    const database = client.db(process.env.MONGODB_DB_NAME);
    const topology = await database.admin().command({ hello: 1 });
    if (!topology.setName && topology.msg !== 'isdbgrid') {
      throw new Error('MongoDB must be a replica set or sharded cluster to rotate administrator credentials safely.');
    }

    session = client.startSession();
    const passwordHash = await bcrypt.hash(password, 12);
    await session.withTransaction(async () => {
      await rotateExistingAdminCredentials({
        database,
        session,
        currentEmail,
        newEmail,
        passwordHash,
      });
    });
    console.info('Existing administrator credentials were rotated. Previous sessions are invalidated.');
  } catch (error) {
    const knownMessages = [
      'MongoDB must be a replica set',
      'No active administrator matches',
      'The new email is already assigned',
      'The administrator account changed during rotation',
    ];
    if (knownMessages.some((message) => error?.message?.startsWith(message))) {
      throw error;
    }
    if (error?.code === 11000) {
      throw new Error('The new email is already assigned to an account. No credentials were changed.');
    }
    if (error?.code === 112 || error?.hasErrorLabel?.('TransientTransactionError')) {
      throw new Error('A concurrent database update conflicted. No credentials were changed; verify the account and retry.');
    }
    throw new Error(`Administrator credential rotation failed (${safeDiagnostic(error)}). No credentials were logged.`);
  } finally {
    if (session) await session.endSession();
    await client.close();
    process.env.ADMIN_CREDENTIAL_ROTATION_PASSWORD = '';
  }
}

const invokedScript = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : '';
if (import.meta.url === invokedScript) {
  try {
    loadProjectEnvironment();
    await runRotation();
  } catch (error) {
    console.error(`Administrator credential rotation failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    process.env.ADMIN_CREDENTIAL_ROTATION_PASSWORD = '';
  }
}

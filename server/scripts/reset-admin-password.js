import bcrypt from 'bcryptjs';
import { closeDatabase, connectDatabase } from '../db.js';
import { fileURLToPath } from 'node:url';

const projectEnvPath = fileURLToPath(new URL('../../.env', import.meta.url));

function loadProjectEnvironment() {
  try {
    process.loadEnvFile(projectEnvPath);
  } catch (error) {
    if (error?.code === 'ENOENT') return;
    throw new Error('Unable to load the project-root .env file. Check its syntax and file permissions.');
  }
}

function getResetInput() {
  const email = String(process.env.ADMIN_RESET_EMAIL || '').trim().toLowerCase();
  const confirmation = String(process.env.ADMIN_RESET_CONFIRM || '').trim().toLowerCase();
  const password = String(process.env.ADMIN_RESET_PASSWORD || '');

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('ADMIN_RESET_EMAIL must be set to the existing administrator email address.');
  }
  if (confirmation !== email) {
    throw new Error('ADMIN_RESET_CONFIRM must match ADMIN_RESET_EMAIL to confirm the reset.');
  }
  const passwordBytes = Buffer.byteLength(password, 'utf8');
  if (passwordBytes < 12 || passwordBytes > 72) {
    throw new Error('ADMIN_RESET_PASSWORD must be between 12 and 72 bytes.');
  }
  if (String(process.env.ADMIN_RESET_TARGET_CONFIRM || '').trim() !== 'NON-PRODUCTION') {
    throw new Error('After verifying the local .env targets a non-production database, set ADMIN_RESET_TARGET_CONFIRM to NON-PRODUCTION.');
  }

  return { email, password };
}

async function resetAdminPassword() {
  const { email, password } = getResetInput();
  let database;
  try {
    database = await connectDatabase();
  } catch (error) {
    if (error?.code === 'MONGODB_UNAVAILABLE' || error?.code === 'MONGODB_CONFIGURATION_MISSING') {
      throw error;
    }
    const diagnostic = /^MONGODB_[A-Z0-9_]+$/.test(error?.code || '')
      ? ` (${error.code})`
      : '';
    throw new Error(`MongoDB connection failed${diagnostic}. Check MONGODB_URI, MONGODB_DB_NAME, Atlas availability, network access, and database-user permissions. No password or connection details were logged.`);
  }

  try {
    const users = database.collection('users');
    const passwordHash = await bcrypt.hash(password, 12);
    const result = await users.updateOne(
      { email, role: 'ADMIN', status: 'ACTIVE' },
      {
        $set: { passwordHash, updatedAt: new Date().toISOString() },
        $inc: { _version: 1, sessionVersion: 1 },
      },
      { collation: { locale: 'en', strength: 2 } }
    );

    if (result.matchedCount !== 1) {
      const error = new Error('No active administrator account matches ADMIN_RESET_EMAIL. No account was created or promoted.');
      error.code = 'NO_ACTIVE_ADMIN';
      throw error;
    }

    console.info('Password reset successfully for the matching existing administrator account.');
  } catch (error) {
    if (error?.code === 'MONGODB_UNAVAILABLE' || error?.code === 'MONGODB_CONFIGURATION_MISSING') {
      throw error;
    }
    if (error?.code === 'NO_ACTIVE_ADMIN') {
      throw error;
    }
    throw new Error('The administrator password update failed. Check MongoDB availability and permissions. No password or connection details were logged.');
  } finally {
    if (database) {
      try {
        await closeDatabase();
      } catch {
        console.error('Warning: the database connection could not be cleanly closed.');
      }
    }
  }
}

let environmentLoadFailed = false;
try {
  loadProjectEnvironment();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
  environmentLoadFailed = true;
}

if (!environmentLoadFailed) {
  resetAdminPassword().catch((error) => {
    console.error(`Administrator password reset failed: ${error.message}`);
    process.exitCode = 1;
  });
}

import assert from 'node:assert/strict';
import test from 'node:test';
import {
  rotateExistingAdminCredentials,
  validateRotationInput,
  validateRotationTarget,
} from '../scripts/rotate-admin-credentials.js';

const validEnvironment = {
  MONGODB_DB_NAME: 'kinetiqacademy',
  MONGODB_URI: 'mongodb+srv://user:password@production.example.mongodb.net/?retryWrites=true',
  ADMIN_CREDENTIAL_ROTATION_CONFIRM_DATABASE: 'kinetiqacademy',
  ADMIN_CREDENTIAL_ROTATION_CONFIRM_CLUSTER_HOST: 'production.example.mongodb.net',
  ADMIN_CREDENTIAL_ROTATION_CONFIRM: 'ROTATE EXISTING PRODUCTION ADMIN',
  ADMIN_CREDENTIAL_ROTATION_CURRENT_EMAIL: 'old-admin@example.com',
  ADMIN_CREDENTIAL_ROTATION_NEW_EMAIL: 'new-admin@example.com',
  ADMIN_CREDENTIAL_ROTATION_PASSWORD: 'long-enough-password',
};

test('production target requires exact database, cluster, explicit confirmation, and rejects test DB', () => {
  assert.deepEqual(validateRotationTarget(validEnvironment), {
    databaseName: 'kinetiqacademy',
    uriHost: 'production.example.mongodb.net',
  });

  for (const environment of [
    { ...validEnvironment, MONGODB_DB_NAME: 'kinetiqacademy_test' },
    { ...validEnvironment, ADMIN_CREDENTIAL_ROTATION_CONFIRM_DATABASE: 'another-database' },
    { ...validEnvironment, ADMIN_CREDENTIAL_ROTATION_CONFIRM_CLUSTER_HOST: 'another.example.mongodb.net' },
    { ...validEnvironment, ADMIN_CREDENTIAL_ROTATION_CONFIRM: '' },
  ]) {
    assert.throws(() => validateRotationTarget(environment), /Refusing credential rotation/);
  }
});

test('rotation input validates emails and password UTF-8 byte limits', () => {
  assert.deepEqual(validateRotationInput(validEnvironment), {
    currentEmail: 'old-admin@example.com',
    newEmail: 'new-admin@example.com',
    password: 'long-enough-password',
  });
  assert.throws(
    () => validateRotationInput({ ...validEnvironment, ADMIN_CREDENTIAL_ROTATION_NEW_EMAIL: 'invalid' }),
    /valid new administrator email/
  );
  assert.throws(
    () => validateRotationInput({ ...validEnvironment, ADMIN_CREDENTIAL_ROTATION_NEW_EMAIL: 'OLD-admin@example.com' }),
    /must differ/
  );
  assert.throws(
    () => validateRotationInput({ ...validEnvironment, ADMIN_CREDENTIAL_ROTATION_PASSWORD: 'short' }),
    /12 and 72 UTF-8 bytes/
  );
  assert.throws(
    () => validateRotationInput({ ...validEnvironment, ADMIN_CREDENTIAL_ROTATION_PASSWORD: 'é'.repeat(37) }),
    /12 and 72 UTF-8 bytes/
  );
});

function createFakeDatabase({ admin, conflictingAccount } = {}) {
  const state = { admin: admin ? { ...admin } : null, conflictingAccount };
  const users = {
    async findOne(filter, options) {
      if (filter.role === 'ADMIN') {
        assert.equal(options.collation.strength, 2);
        return state.admin && state.admin.email.toLowerCase() === filter.email.toLowerCase()
          ? { id: state.admin.id, _version: state.admin._version }
          : null;
      }
      if (state.conflictingAccount?.email.toLowerCase() === filter.email.toLowerCase()) {
        return { id: state.conflictingAccount.id };
      }
      return null;
    },
    async updateOne(filter, update) {
      if (
        !state.admin ||
        state.admin.id !== filter.id ||
        state.admin._version !== filter._version ||
        state.admin.status !== 'ACTIVE' ||
        state.admin.role !== 'ADMIN'
      ) {
        return { matchedCount: 0 };
      }
      Object.assign(state.admin, update.$set);
      for (const [field, amount] of Object.entries(update.$inc)) {
        state.admin[field] = (state.admin[field] ?? 0) + amount;
      }
      return { matchedCount: 1 };
    },
  };
  return { state, database: { collection: () => users } };
}

test('rotation updates only the matched active admin and invalidates old sessions', async () => {
  const { database, state } = createFakeDatabase({
    admin: {
      id: 'admin-id',
      email: 'old-admin@example.com',
      role: 'ADMIN',
      status: 'ACTIVE',
      _version: 3,
      sessionVersion: 2,
    },
  });
  const now = new Date('2026-10-12T00:00:00.000Z');

  await rotateExistingAdminCredentials({
    database,
    session: {},
    currentEmail: 'OLD-admin@example.com',
    newEmail: 'new-admin@example.com',
    passwordHash: 'hashed-password-only',
    now: () => now,
  });

  assert.equal(state.admin.email, 'new-admin@example.com');
  assert.equal(state.admin.passwordHash, 'hashed-password-only');
  assert.equal(state.admin.sessionVersion, 3);
  assert.equal(state.admin._version, 4);
  assert.equal(state.admin.updatedAt, now.toISOString());
});

test('rotation refuses a missing admin, an occupied email, or an optimistic write conflict', async () => {
  const missing = createFakeDatabase();
  await assert.rejects(
    rotateExistingAdminCredentials({
      database: missing.database,
      session: {},
      currentEmail: 'old-admin@example.com',
      newEmail: 'new-admin@example.com',
      passwordHash: 'hash',
    }),
    /No active administrator matches/
  );

  const occupied = createFakeDatabase({
    admin: { id: 'admin-id', email: 'old-admin@example.com', role: 'ADMIN', status: 'ACTIVE', _version: 1 },
    conflictingAccount: { id: 'student-id', email: 'new-admin@example.com' },
  });
  await assert.rejects(
    rotateExistingAdminCredentials({
      database: occupied.database,
      session: {},
      currentEmail: 'old-admin@example.com',
      newEmail: 'new-admin@example.com',
      passwordHash: 'hash',
    }),
    /already assigned/
  );

  const conflict = createFakeDatabase({
    admin: { id: 'admin-id', email: 'old-admin@example.com', role: 'ADMIN', status: 'ACTIVE', _version: 1 },
  });
  const originalCollection = conflict.database.collection;
  conflict.database.collection = () => ({
    ...originalCollection(),
    async updateOne() {
      return { matchedCount: 0 };
    },
  });
  await assert.rejects(
    rotateExistingAdminCredentials({
      database: conflict.database,
      session: {},
      currentEmail: 'old-admin@example.com',
      newEmail: 'new-admin@example.com',
      passwordHash: 'hash',
    }),
    /changed during rotation/
  );
});

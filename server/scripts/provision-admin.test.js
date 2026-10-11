import assert from 'node:assert/strict';
import test from 'node:test';
import { createInitialAdminRecord, safeProvisioningError } from './provision-admin.js';

class UniqueCollection {
  constructor({ uniqueField, documents = [] }) {
    this.uniqueField = uniqueField;
    this.documents = documents;
  }

  async insertOne(document) {
    const duplicate = this.documents.some(
      (existing) => existing[this.uniqueField] === document[this.uniqueField]
    );
    if (duplicate) {
      const error = new Error('duplicate key');
      error.code = 11000;
      throw error;
    }
    this.documents.push(document);
  }

  async findOne(filter) {
    return this.documents.find((document) =>
      Object.entries(filter).every(([key, value]) => document[key] === value)
    ) ?? null;
  }

  find(_filter, options) {
    return {
      sort: () => ({
        limit: () => ({
          next: async () => {
            const maxPosition = Math.max(
              -1,
              ...this.documents.map((document) => document._position ?? -1)
            );
            return maxPosition < 0 ? null : { _position: maxPosition };
          },
        }),
      }),
      options,
    };
  }
}

function createDatabase() {
  const collections = {
    users: new UniqueCollection({ uniqueField: 'email' }),
    adminBootstrapGuards: new UniqueCollection({ uniqueField: 'bootstrapKey' }),
  };
  return {
    collection: (name) => collections[name],
    collections,
  };
}

test('concurrent initial-admin attempts create at most one admin using the unique guard key', async () => {
  const database = createDatabase();
  const candidates = ['one', 'two'].map((suffix) => ({
    id: `usr-admin-${suffix}`,
    name: 'Test Admin',
    email: `${suffix}@example.test`,
    passwordHash: 'already-hashed-test-value',
    role: 'ADMIN',
    status: 'ACTIVE',
    _version: 0,
  }));

  const results = await Promise.allSettled(
    candidates.map((newUser) =>
      createInitialAdminRecord({ database, session: {}, newUser })
    )
  );

  assert.equal(results.filter((result) => result.status === 'fulfilled').length, 1);
  assert.equal(database.collections.adminBootstrapGuards.documents.length, 1);
  assert.equal(
    database.collections.users.documents.filter((user) => user.role === 'ADMIN').length,
    1
  );
  assert.equal(results.filter((result) => result.status === 'rejected').length, 1);
});

test('initial-admin provisioning still refuses an existing admin', async () => {
  const database = createDatabase();
  database.collections.users.documents.push({
    id: 'existing-admin',
    email: 'existing@example.test',
    role: 'ADMIN',
  });

  await assert.rejects(
    createInitialAdminRecord({
      database,
      session: {},
      newUser: { id: 'new-admin', email: 'new@example.test', role: 'ADMIN' },
    }),
    /An administrator already exists/
  );
});

test('initial-admin provisioning still refuses an existing account email', async () => {
  const database = createDatabase();
  database.collections.users.documents.push({
    id: 'existing-user',
    email: 'existing@example.test',
    role: 'STUDENT',
  });

  await assert.rejects(
    createInitialAdminRecord({
      database,
      session: {},
      newUser: { id: 'new-admin', email: 'existing@example.test', role: 'ADMIN' },
    }),
    /An account already exists/
  );
});

test('provisioning errors expose only safe diagnostics for duplicate and transaction conflicts', () => {
  const duplicateError = Object.assign(
    new Error('contains sensitive database details'),
    { code: 11000 }
  );
  const transactionError = Object.assign(
    new Error('contains sensitive transaction details'),
    { code: 112 }
  );

  for (const error of [duplicateError, transactionError]) {
    const message = safeProvisioningError(error);
    assert.equal(message.includes(error.message), false);
    assert.equal(message.includes('sensitive'), false);
  }
  assert.match(safeProvisioningError(duplicateError), /unique database guard/);
  assert.match(safeProvisioningError(transactionError), /transaction conflicted/);
});

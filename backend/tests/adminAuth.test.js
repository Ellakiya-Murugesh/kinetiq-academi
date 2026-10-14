import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { createServer } from 'node:http';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createAdminAuthRouter } from '../routes/adminAuth.js';
import { JWT_SECRET } from '../middleware/auth.js';
import { issueSession } from '../routes/auth.js';

const initialPassword = 'Current-Admin-Password-42';
const resetPassword = 'Replacement-Admin-Password-78';
const resetToken = 'a'.repeat(43);

function matches(user, query) {
  return Object.entries(query).every(([key, expected]) => {
    if (key === 'expiresAt' && expected?.$gt) return user.expiresAt > expected.$gt;
    return user[key] === expected;
  });
}
function createFakeDatabase(users, resetRecords = new Map()) {
  const usersCollection = {
    async findOne(query) {
      return users.find((user) => {
        if (query.email !== undefined) {
          return user.email.toLowerCase() === query.email.toLowerCase() &&
            (!query.role || user.role === query.role) &&
            (!query.status || user.status === query.status);
        }
        return matches(user, query);
      }) ?? null;
    },
    find() {
      return {
        sort() {
          return this;
        },
        limit() {
          return this;
        },
        async next() {
          return [...users].sort((left, right) => (right._position ?? -1) - (left._position ?? -1))[0] ?? null;
        },
      };
    },
    async insertOne(user) {
      if (users.some((entry) => entry.email.toLowerCase() === user.email.toLowerCase())) {
        const error = new Error('duplicate');
        error.code = 11000;
        throw error;
      }
      users.push(user);
      return { acknowledged: true };
    },
    async updateOne(query, update) {
      const user = users.find((entry) => matches(entry, query));
      if (!user) return { matchedCount: 0 };
      Object.assign(user, update.$set);
      for (const [key, increment] of Object.entries(update.$inc ?? {})) {
        user[key] = (user[key] ?? 0) + increment;
      }
      return { matchedCount: 1 };
    },
  };

  const resetCollection = {
    async replaceOne(filter, document) {
      resetRecords.set(filter._id, document);
      return { acknowledged: true };
    },
    async findOne(query) {
      return [...resetRecords.values()].find((record) => matches(record, query)) ?? null;
    },
    async deleteOne(query) {
      const record = [...resetRecords.entries()].find(([, item]) => matches(item, query));
      if (!record) return { deletedCount: 0 };
      resetRecords.delete(record[0]);
      return { deletedCount: 1 };
    },
  };

  return {
    collection(name) {
      if (name === 'users') return usersCollection;
      if (name === 'adminPasswordResetTokens') return resetCollection;
      throw new Error(`Unexpected collection ${name}`);
    },
  };
}

async function createHarness({
  admins = [],
  otherUsers = [],
  requireAdmin = true,
  now = () => new Date('2026-01-01T00:00:00.000Z'),
  sendResetEmail = async () => {},
} = {}) {
  const adminHash = await bcrypt.hash(initialPassword, 4);
  const users = [
    ...admins,
    {
      id: 'admin-existing',
      name: 'Existing Administrator',
      email: 'admin@example.test',
      passwordHash: adminHash,
      role: 'ADMIN',
      status: 'ACTIVE',
      sessionVersion: 0,
      _version: 0,
      _position: 0,
    },
    ...otherUsers,
  ];
  const resetRecords = new Map();
  const database = createFakeDatabase(users, resetRecords);
  const resetEmails = [];
  const router = createAdminAuthRouter({
    getDatabase: () => database,
    getClient: () => ({
      startSession: () => ({
        withTransaction: async (callback) => callback(),
        endSession: async () => {},
      }),
    }),
    requireAdminMiddleware: requireAdmin
      ? (req, res, next) => {
        if (req.get('Authorization') !== 'Bearer test-admin') {
          return res.status(401).json({ message: 'Authentication required.' });
        }
        req.user = { id: 'admin-existing', role: 'ADMIN' };
        return next();
      }
      : (_req, _res, next) => next(),
    sendResetEmail: async (message) => {
      resetEmails.push(message);
      await sendResetEmail(message);
    },
    findCredentials: async (identifier) =>
      users.find((user) => user.email.toLowerCase() === identifier.toLowerCase()) ?? null,
    createSession: async (user) => ({
      token: 'test-session',
      user: { id: user.id, email: user.email, role: user.role },
    }),
    comparePassword: bcrypt.compare,
    hashPassword: (password) => bcrypt.hash(password, 4),
    makeToken: () => resetToken,
    makeId: () => 'admin-created',
    now,
  });
  const app = express();
  app.use(express.json());
  app.use('/api/admin-auth', router);
  const server = createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}/api/admin-auth`;

  return {
    users,
    resetRecords,
    resetEmails,
    async request(path, body, authenticated = false) {
      const response = await fetch(`${baseUrl}${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authenticated ? { Authorization: 'Bearer test-admin' } : {}),
        },
        body: JSON.stringify(body),
      });
      return { status: response.status, body: await response.json() };
    },
    close: () => new Promise((resolve, reject) =>
      server.close((error) => error ? reject(error) : resolve())
    ),
  };
}

test('admin login accepts a valid administrator and rejects invalid or non-admin credentials', async () => {
  const harness = await createHarness({
    otherUsers: [{
      id: 'student-1',
      email: 'student@example.test',
      passwordHash: await bcrypt.hash(initialPassword, 4),
      role: 'STUDENT',
      status: 'ACTIVE',
    }],
  });
  try {
    const valid = await harness.request('/login', { identifier: 'ADMIN@example.test', password: initialPassword });
    assert.equal(valid.status, 200);
    assert.equal(valid.body.user.role, 'ADMIN');
    assert.equal(valid.body.token, 'test-session');

    const wrongPassword = await harness.request('/login', { identifier: 'admin@example.test', password: 'incorrect-password' });
    assert.equal(wrongPassword.status, 401);
    assert.match(wrongPassword.body.message, /Invalid administrator email or password/);

    const student = await harness.request('/login', { identifier: 'student@example.test', password: initialPassword });
    assert.equal(student.status, 401);
    assert.match(student.body.message, /Invalid administrator email or password/);
  } finally {
    await harness.close();
  }
});

test('shared session issuer includes the version used to revoke sessions after password reset', async () => {
  const session = await issueSession({
    id: 'admin-versioned',
    name: 'Versioned Admin',
    email: 'admin@example.test',
    role: 'ADMIN',
    sessionVersion: 3,
  });
  const claims = jwt.verify(session.token, JWT_SECRET, {
    issuer: 'kinetiq-academy',
    audience: 'kinetiq-app',
  });
  assert.equal(claims.role, 'ADMIN');
  assert.equal(claims.sessionVersion, 3);
});

test('admin creation requires an existing admin, approval password, valid data, and unique email', async () => {
  const student = {
    id: 'student-preserved',
    name: 'Existing Student',
    email: 'student@example.test',
    passwordHash: await bcrypt.hash('Existing-Student-Password-42', 4),
    role: 'STUDENT',
    status: 'ACTIVE',
    sessionVersion: 0,
    _version: 0,
    _position: 1,
  };
  const studentBefore = { ...student };
  const harness = await createHarness({ otherUsers: [student] });
  try {
    const unauthenticated = await harness.request('/register', {
      name: 'New Admin',
      email: 'new@example.test',
      password: resetPassword,
      confirmPassword: resetPassword,
      approverPassword: initialPassword,
    });
    assert.equal(unauthenticated.status, 401);
    assert.equal(harness.users.length, 2);

    const invalidPassword = await harness.request('/register', {
      name: 'New Admin',
      email: 'new@example.test',
      password: 'short',
      confirmPassword: 'short',
      approverPassword: initialPassword,
    }, true);
    assert.equal(invalidPassword.status, 400);
    assert.equal(harness.users.length, 2);

    const wrongApprover = await harness.request('/register', {
      name: 'New Admin',
      email: 'new@example.test',
      password: resetPassword,
      confirmPassword: resetPassword,
      approverPassword: 'not-the-admin-password',
    }, true);
    assert.equal(wrongApprover.status, 403);
    assert.equal(harness.users.length, 2);

    const created = await harness.request('/register', {
      name: 'New Admin',
      email: 'new@example.test',
      password: resetPassword,
      confirmPassword: resetPassword,
      approverPassword: initialPassword,
      role: 'STUDENT',
    }, true);
    assert.equal(created.status, 201);
    assert.equal(created.body.user.role, 'ADMIN');
    const createdAdmin = harness.users.find((user) => user.email === 'new@example.test');
    assert.equal(createdAdmin.role, 'ADMIN');
    assert.equal(createdAdmin.status, 'ACTIVE');
    assert.equal(await bcrypt.compare(resetPassword, createdAdmin.passwordHash), true);
    assert.equal('confirmPassword' in createdAdmin, false);
    assert.equal('approverPassword' in createdAdmin, false);
    assert.equal(
      JSON.stringify(harness.users.find((user) => user.id === student.id)),
      JSON.stringify(studentBefore)
    );

    const newAdminLogin = await harness.request('/login', {
      identifier: 'new@example.test',
      password: resetPassword,
    });
    assert.equal(newAdminLogin.status, 200);
    assert.equal(newAdminLogin.body.user.role, 'ADMIN');

    const duplicate = await harness.request('/register', {
      name: 'Duplicate',
      email: 'NEW@example.test',
      password: resetPassword,
      confirmPassword: resetPassword,
      approverPassword: initialPassword,
    }, true);
    assert.equal(duplicate.status, 409);
    assert.equal(harness.users.length, 3);
  } finally {
    await harness.close();
  }
});

test('forgot password returns an enumeration-safe response and stores only a token hash', async () => {
  const harness = await createHarness();
  try {
    const found = await harness.request('/forgot-password', { email: 'admin@example.test' });
    const unknown = await harness.request('/forgot-password', { email: 'unknown@example.test' });
    assert.equal(found.status, 202);
    assert.deepEqual(found.body, unknown.body);
    assert.equal(harness.resetEmails.length, 1);
    assert.match(harness.resetEmails[0].resetUrl, /\/admin\/reset-password\?token=/);
    assert.equal(harness.resetRecords.size, 1);
    const storedRecord = [...harness.resetRecords.values()][0];
    assert.equal(storedRecord.tokenHash.length, 64);
    assert.equal(JSON.stringify(storedRecord).includes(resetToken), false);
    assert.equal(JSON.stringify(storedRecord).includes(harness.resetEmails[0].resetUrl), false);
  } finally {
    await harness.close();
  }
});

test('forgot password keeps the same response and removes the token if configured email delivery fails', async () => {
  const harness = await createHarness({
    sendResetEmail: async () => {
      const error = new Error('smtp secrets must not be logged');
      error.code = 'SMTP_NOT_CONFIGURED';
      throw error;
    },
  });
  try {
    const found = await harness.request('/forgot-password', { email: 'admin@example.test' });
    const unknown = await harness.request('/forgot-password', { email: 'unknown@example.test' });
    assert.equal(found.status, 202);
    assert.deepEqual(found.body, unknown.body);
    assert.equal(harness.resetRecords.size, 0);
  } finally {
    await harness.close();
  }
});

test('expired and reused reset tokens are rejected; a valid token changes password and revokes sessions', async () => {
  let currentTime = new Date('2026-01-01T00:00:00.000Z');
  const harness = await createHarness({ now: () => currentTime });
  try {
    await harness.request('/forgot-password', { email: 'admin@example.test' });
    currentTime = new Date('2026-01-01T00:31:00.000Z');
    const expired = await harness.request('/reset-password', {
      token: resetToken,
      password: resetPassword,
      confirmPassword: resetPassword,
    });
    assert.equal(expired.status, 400);
    assert.equal(harness.users[0].sessionVersion, 0);

    currentTime = new Date('2026-01-01T00:00:00.000Z');
    await harness.request('/forgot-password', { email: 'admin@example.test' });
    const changed = await harness.request('/reset-password', {
      token: resetToken,
      password: resetPassword,
      confirmPassword: resetPassword,
    });
    assert.equal(changed.status, 200);
    assert.equal(harness.users[0].sessionVersion, 1);
    assert.equal(await bcrypt.compare(resetPassword, harness.users[0].passwordHash), true);

    const reused = await harness.request('/reset-password', {
      token: resetToken,
      password: 'Another-New-Password-90',
      confirmPassword: 'Another-New-Password-90',
    });
    assert.equal(reused.status, 400);
    assert.equal(harness.users[0].sessionVersion, 1);
  } finally {
    await harness.close();
  }
});

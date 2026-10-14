import assert from 'node:assert/strict';
import test from 'node:test';
import express from 'express';
import { createServer } from 'node:http';
import authRoutes, { createLoginHandler, registrationConflictExists } from '../routes/auth.js';

test('student registration checks duplicate identities in both users and student records', () => {
  const db = {
    users: [{ email: 'existing@example.test', phone: '+919876543210' }],
    students: [{ email: 'orphan@example.test', mobile: '9123456789' }],
  };

  assert.equal(registrationConflictExists(db, 'EXISTING@example.test', '0000000000'), true);
  assert.equal(registrationConflictExists(db, 'new@example.test', '9876543210'), true);
  assert.equal(registrationConflictExists(db, 'new@example.test', '9123456789'), true);
  assert.equal(registrationConflictExists(db, 'new@example.test', '9000000000'), false);
});

test('student login has no OTP endpoints while the shared OTP route remains restricted to admins', async () => {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  const server = createServer(app);

  try {
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const address = server.address();
    const baseUrl = `http://127.0.0.1:${address.port}/api/auth`;
    const removedEndpoint = await fetch(`${baseUrl}/student/mobile-otp/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '9876543210' }),
    });
    const sharedEndpoint = await fetch(`${baseUrl}/otp/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '9876543210', role: 'STUDENT' }),
    });

    assert.equal(removedEndpoint.status, 404);
    assert.equal(sharedEndpoint.status, 403);
  } finally {
    await new Promise((resolve, reject) =>
      server.close((error) => error ? reject(error) : resolve())
    );
  }
});

test('login returns a sanitized 503 when the MongoDB connection times out', async () => {
  const databaseError = Object.assign(
    new Error('sensitive database connection details'),
    {
      name: 'MongoServerSelectionError',
      cause: Object.assign(
        new Error('sensitive network details'),
        { name: 'MongoNetworkTimeoutError', code: 'ETIMEDOUT' }
      ),
    }
  );
  const app = express();
  app.use(express.json());
  app.post('/login', createLoginHandler({
    findCredentials: async () => {
      throw databaseError;
    },
  }));
  const server = createServer(app);
  const loggedErrors = [];
  const originalConsoleError = console.error;
  console.error = (...args) => loggedErrors.push(args.join(' '));

  try {
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const address = server.address();
    const response = await fetch(`http://127.0.0.1:${address.port}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'student@example.test', password: 'not-a-real-password' }),
    });
    const body = await response.json();

    assert.equal(response.status, 503);
    assert.match(body.message, /temporarily unavailable/);
    assert.equal(JSON.stringify(body).includes('sensitive'), false);
    assert.deepEqual(loggedErrors, ['Login failed (MONGODB_NETWORK_UNAVAILABLE).']);
  } finally {
    console.error = originalConsoleError;
    await new Promise((resolve, reject) =>
      server.close((error) => error ? reject(error) : resolve())
    );
  }
});

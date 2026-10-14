import assert from 'node:assert/strict';
import test from 'node:test';
import express from 'express';
import { createServer } from 'node:http';
import { createLoginHandler } from '../routes/auth.js';

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

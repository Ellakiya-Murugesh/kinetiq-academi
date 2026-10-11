import assert from 'node:assert/strict';
import test from 'node:test';
import express from 'express';
import { createStudentMobileOtpRouter, registrationConflictExists } from '../routes/auth.js';
import {
  createMsg91OtpProvider,
  createStudentMobileOtpService,
} from './studentMobileOtp.js';

const user = {
  id: 'student-1',
  name: 'Test Student',
  phone: '+919876543210',
  role: 'STUDENT',
  status: 'ACTIVE',
};

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

class MemoryCollection {
  documents = new Map();

  matches(document, filter) {
    if (!document) return false;
    for (const [key, expected] of Object.entries(filter)) {
      if (key === '$or') {
        if (!expected.some((condition) => this.matches(document, condition))) return false;
      } else if (expected && typeof expected === 'object' && !(expected instanceof Date)) {
        if ('$lte' in expected && !(document[key] <= expected.$lte)) return false;
        if ('$gt' in expected && !(document[key] > expected.$gt)) return false;
        if ('$lt' in expected && !(document[key] < expected.$lt)) return false;
        if ('$exists' in expected && (key in document) !== expected.$exists) return false;
      } else if (document[key] !== expected) {
        return false;
      }
    }
    return true;
  }

  copy(document) {
    return document && { ...document };
  }

  async findOneAndUpdate(filter, update, options = {}) {
    const existing = this.documents.get(filter._id);
    if (!this.matches(existing, filter)) {
      if (!options.upsert) return null;
      if (existing) {
        const error = new Error('Duplicate key');
        error.code = 11000;
        throw error;
      }
    }

    const next = existing || { _id: filter._id };
    if (!existing) Object.assign(next, update.$setOnInsert || {});
    Object.assign(next, update.$set || {});
    for (const key of Object.keys(update.$unset || {})) delete next[key];
    for (const [key, amount] of Object.entries(update.$inc || {})) next[key] = (next[key] || 0) + amount;
    this.documents.set(filter._id, next);
    return this.copy(next);
  }

  async findOne(filter) {
    const document = this.documents.get(filter._id);
    return this.matches(document, filter) ? this.copy(document) : null;
  }

  async updateOne(filter, update) {
    const document = this.documents.get(filter._id);
    if (!this.matches(document, filter)) return { modifiedCount: 0 };
    Object.assign(document, update.$set || {});
    for (const key of Object.keys(update.$unset || {})) delete document[key];
    for (const [key, amount] of Object.entries(update.$inc || {})) document[key] = (document[key] || 0) + amount;
    return { modifiedCount: 1 };
  }
}

function createService(options = {}) {
  let currentTime = 1_000_000;
  const collection = options.collection || new MemoryCollection();
  const provider = options.provider || {
    sendOtp: async ({ phone }) => {
      if (options.deliveryError) throw options.deliveryError;
      assert.equal(phone, '9876543210');
    },
    verifyOtp: async ({ phone, code }) => {
      assert.equal(phone, '9876543210');
      if (options.verifyError) throw options.verifyError;
      return code === '123456';
    },
  };
  const service = createStudentMobileOtpService({
    provider,
    collection,
    now: () => currentTime,
  });
  return {
    service,
    collection,
    advanceTime(milliseconds) {
      currentTime += milliseconds;
    },
  };
}

async function startRouter({ findStudent, service = createService().service, createSession } = {}) {
  const app = express();
  app.use(express.json());
  app.use('/api/auth/student/mobile-otp', createStudentMobileOtpRouter({
    service,
    findStudent: findStudent || (async (phone) => phone === '9876543210' ? user : undefined),
    createSession: createSession || (async (authenticatedUser) => ({
      token: 'session-token',
      user: { id: authenticatedUser.id, role: authenticatedUser.role },
    })),
  }));
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  return {
    baseUrl: `http://127.0.0.1:${server.address().port}/api/auth/student/mobile-otp`,
    close: () => new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    }),
  };
}

function msg91Response({ status = 200, body = { type: 'success', message: 'success' } } = {}) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

test('MSG91 sender uses the documented authkey header, endpoint and request fields', async () => {
  let sent;
  const provider = createMsg91OtpProvider({
    environment: () => ({ MSG91_AUTH_KEY: 'test-auth-key', MSG91_TEMPLATE_ID: 'template-123' }),
    fetchImplementation: async (url, options) => {
      sent = { url: new URL(url), options };
      return msg91Response({
        body: { type: 'success', request_id: 'mock-request-id' },
      });
    },
  });
  await provider.sendOtp({ phone: user.phone });
  assert.equal(sent.url.origin + sent.url.pathname, 'https://control.msg91.com/api/v5/otp');
  assert.equal(sent.url.searchParams.get('template_id'), 'template-123');
  assert.equal(sent.url.searchParams.get('mobile'), '919876543210');
  assert.equal(sent.url.searchParams.get('otp_length'), '6');
  assert.equal(sent.url.searchParams.get('otp_expiry'), '5');
  assert.equal(sent.url.searchParams.has('otp'), false);
  assert.equal(sent.options.method, 'POST');
  assert.equal(sent.options.headers.authkey, 'test-auth-key');
  assert.deepEqual(JSON.parse(sent.options.body), {});
});

test('MSG91 verifier uses the provider-managed OTP verification endpoint', async () => {
  let verified;
  const provider = createMsg91OtpProvider({
    environment: () => ({ MSG91_AUTH_KEY: 'test-auth-key', MSG91_TEMPLATE_ID: 'template-123' }),
    fetchImplementation: async (url, options) => {
      verified = { url: new URL(url), options };
      return msg91Response();
    },
  });
  assert.equal(await provider.verifyOtp({ phone: user.phone, code: '123456' }), true);
  assert.equal(verified.url.origin + verified.url.pathname, 'https://control.msg91.com/api/v5/otp/verify');
  assert.equal(verified.url.searchParams.get('mobile'), '919876543210');
  assert.equal(verified.url.searchParams.get('otp'), '123456');
  assert.equal(verified.options.method, 'GET');
  assert.equal(verified.options.headers.authkey, 'test-auth-key');
});

test('MSG91 handles its documented HTTP 200 invalid-code response as an incorrect OTP', async () => {
  const provider = createMsg91OtpProvider({
    environment: () => ({ MSG91_AUTH_KEY: 'key', MSG91_TEMPLATE_ID: 'template' }),
    fetchImplementation: async () => msg91Response({
      body: { type: 'error', message: 'OTP not match' },
    }),
  });
  assert.equal(await provider.verifyOtp({ phone: user.phone, code: '000000' }), false);
});

test('MSG91 preserves its documented expired-code response', async () => {
  const provider = createMsg91OtpProvider({
    environment: () => ({ MSG91_AUTH_KEY: 'key', MSG91_TEMPLATE_ID: 'template' }),
    fetchImplementation: async () => msg91Response({
      body: { type: 'error', message: 'OTP expired' },
    }),
  });
  await assert.rejects(
    () => provider.verifyOtp({ phone: user.phone, code: '123456' }),
    { code: 'MSG91_OTP_EXPIRED' }
  );
});

test('MSG91 configuration errors, auth failures, rejections, malformed responses and network failures are explicit', async () => {
  const missing = createMsg91OtpProvider({ environment: () => ({}) });
  await assert.rejects(() => missing.sendOtp({ phone: user.phone }), { code: 'MSG91_NOT_CONFIGURED' });

  const rejected = createMsg91OtpProvider({
    environment: () => ({ MSG91_AUTH_KEY: 'key', MSG91_TEMPLATE_ID: 'template' }),
    fetchImplementation: async () => msg91Response({
      status: 401,
      body: { type: 'error', message: 'Invalid authkey' },
    }),
  });
  await assert.rejects(() => rejected.sendOtp({ phone: user.phone }), { code: 'MSG91_AUTH_FAILED' });

  const providerRejected = createMsg91OtpProvider({
    environment: () => ({ MSG91_AUTH_KEY: 'key', MSG91_TEMPLATE_ID: 'template' }),
    fetchImplementation: async () => msg91Response({
      status: 400,
      body: { type: 'error', message: 'Invalid template' },
    }),
  });
  await assert.rejects(() => providerRejected.sendOtp({ phone: user.phone }), { code: 'MSG91_REJECTED' });

  const malformed = createMsg91OtpProvider({
    environment: () => ({ MSG91_AUTH_KEY: 'key', MSG91_TEMPLATE_ID: 'template' }),
    fetchImplementation: async () => ({ ok: true, status: 200, json: async () => 'invalid' }),
  });
  await assert.rejects(() => malformed.sendOtp({ phone: user.phone }), { code: 'MSG91_MALFORMED_RESPONSE' });

  const network = createMsg91OtpProvider({
    environment: () => ({ MSG91_AUTH_KEY: 'key', MSG91_TEMPLATE_ID: 'template' }),
    fetchImplementation: async () => { throw new Error('private network diagnostics'); },
  });
  await assert.rejects(() => network.sendOtp({ phone: user.phone }), { code: 'MSG91_UNAVAILABLE' });
});

test('creates an opaque challenge and uses the registered destination without storing or returning an OTP', async () => {
  const context = createService();
  const result = await context.service.request(user);
  assert.equal(result.status, 'sent');
  assert.match(result.challengeId, /^[A-Za-z0-9_-]{43}$/);
  assert.equal('code' in result, false);
  const stored = context.collection.documents.get(user.id);
  assert.equal(stored.phone, '9876543210');
  assert.equal('code' in stored, false);
  assert.equal('otpHash' in stored, false);
});

test('validates through MSG91 once and refuses challenge reuse', async () => {
  const context = createService();
  const requested = await context.service.request(user);
  assert.equal((await context.service.verify(user, user.phone, requested.challengeId, '123456')).status, 'verified');
  assert.equal(
    (await context.service.verify(user, user.phone, requested.challengeId, '123456')).status,
    'invalid'
  );
});

test('enforces resend cooldown across service instances', async () => {
  const context = createService();
  await context.service.request(user);
  const secondService = createStudentMobileOtpService({
    provider: { sendOtp: async () => assert.fail('cooldown must block SMS delivery'), verifyOtp: async () => false },
    collection: context.collection,
    now: () => 1_000_001,
  });
  assert.deepEqual(await secondService.request(user), { status: 'cooldown', retryAfterSeconds: 60 });
});

test('allows only one successful concurrent verification', async () => {
  const context = createService();
  const requested = await context.service.request(user);
  const results = await Promise.all([
    context.service.verify(user, user.phone, requested.challengeId, '123456'),
    context.service.verify(user, user.phone, requested.challengeId, '123456'),
  ]);
  assert.equal(results.filter((result) => result.status === 'verified').length, 1);
});

test('rejects a different account or phone for a challenge', async () => {
  const context = createService();
  const requested = await context.service.request(user);
  assert.equal(
    (await context.service.verify({ ...user, id: 'another-student' }, user.phone, requested.challengeId, '123456')).status,
    'invalid'
  );
  assert.equal(
    (await context.service.verify(user, '9876500000', requested.challengeId, '123456')).status,
    'invalid'
  );
});

test('expires challenges after five minutes', async () => {
  const context = createService();
  const requested = await context.service.request(user);
  context.advanceTime(5 * 60 * 1000);
  assert.equal(
    (await context.service.verify(user, user.phone, requested.challengeId, '123456')).status,
    'expired'
  );
});

test('invalidates the local challenge when MSG91 reports its OTP expired', async () => {
  const context = createService({
    provider: {
      sendOtp: async () => {},
      verifyOtp: async () => {
        const error = new Error('Provider response is intentionally not exposed.');
        error.code = 'MSG91_OTP_EXPIRED';
        throw error;
      },
    },
  });
  const requested = await context.service.request(user);
  assert.equal(
    (await context.service.verify(user, user.phone, requested.challengeId, '123456')).status,
    'expired'
  );
  assert.equal(context.collection.documents.get(user.id).active, false);
});

test('limits incorrect attempts and blocks retries across newly requested challenges', async () => {
  const context = createService();
  const requested = await context.service.request(user);
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const result = await context.service.verify(user, user.phone, requested.challengeId, '000000');
    assert.equal(result.status, attempt === 4 ? 'too-many-attempts' : 'incorrect');
  }
  assert.equal(
    (await context.service.verify(user, user.phone, requested.challengeId, '123456')).status,
    'invalid'
  );
  context.advanceTime(60_000);
  assert.equal((await context.service.request(user)).status, 'locked');
  context.advanceTime(5 * 60 * 1000);
  assert.equal((await context.service.request(user)).status, 'sent');
});

test('invalidates a challenge after a confirmed delivery failure while retaining cooldown', async () => {
  const context = createService({
    deliveryError: Object.assign(new Error('private provider detail'), { code: 'MSG91_UNAVAILABLE' }),
  });
  assert.deepEqual(await context.service.request(user), { status: 'delivery-failed', code: 'MSG91_UNAVAILABLE' });
  assert.equal(context.collection.documents.get(user.id).active, false);
  assert.deepEqual(await context.service.request(user), { status: 'cooldown', retryAfterSeconds: 60 });
});

test('returns a stable student session and does not leak OTP or provider information', async () => {
  const context = createService();
  const server = await startRouter({ service: context.service });
  try {
    const request = await fetch(`${server.baseUrl}/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: user.phone }),
    });
    const challenge = await request.json();
    assert.equal(request.status, 200);
    assert.equal('code' in challenge, false);
    const wrong = await fetch(`${server.baseUrl}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: user.phone, challengeId: challenge.challengeId, code: '000000' }),
    });
    assert.equal(wrong.status, 401);
    assert.match((await wrong.json()).message, /incorrect/i);
    const valid = await fetch(`${server.baseUrl}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: user.phone, challengeId: challenge.challengeId, code: '123456' }),
    });
    assert.deepEqual(await valid.json(), {
      token: 'session-token',
      user: { id: user.id, role: 'STUDENT' },
    });
  } finally {
    await server.close();
  }
});

test('keeps unknown accounts neutral and rejects non-student accounts without delivery', async () => {
  let delivered = false;
  const context = createService({
    provider: {
      sendOtp: async () => { delivered = true; },
      verifyOtp: async () => false,
    },
  });
  const server = await startRouter({
    service: context.service,
    findStudent: async () => ({ ...user, role: 'ADMIN' }),
  });
  try {
    const response = await fetch(`${server.baseUrl}/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: user.phone }),
    });
    assert.equal(response.status, 200);
    assert.equal(delivered, false);
    const payload = await response.json();
    assert.equal('code' in payload, false);
  } finally {
    await server.close();
  }
});

test('request route returns safe configuration and rate-limit responses', async () => {
  const context = createService({
    deliveryError: Object.assign(new Error('private MSG91 diagnostics'), { code: 'MSG91_NOT_CONFIGURED' }),
  });
  const server = await startRouter({ service: context.service });
  try {
    const send = () => fetch(`${server.baseUrl}/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: user.phone }),
    });
    const missingConfig = await send();
    assert.equal(missingConfig.status, 503);
    const message = (await missingConfig.json()).message;
    assert.match(message, /MSG91.*not configured/i);
    assert.equal(message.includes('private MSG91 diagnostics'), false);
  } finally {
    await server.close();
  }
});

test('student OTP request endpoint enforces its IP rate limit', async () => {
  const server = await startRouter({
    service: createService().service,
    findStudent: async () => undefined,
  });
  try {
    const send = () => fetch(`${server.baseUrl}/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '+919876500000' }),
    });
    for (let attempt = 0; attempt < 5; attempt += 1) assert.equal((await send()).status, 200);
    const limited = await send();
    assert.equal(limited.status, 429);
  } finally {
    await server.close();
  }
});

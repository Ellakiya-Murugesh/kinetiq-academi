import assert from 'node:assert/strict';
import { once } from 'node:events';
import express from 'express';
import { after, before, describe, it } from 'node:test';
import authRoutes from '../routes/auth.js';
import studentRoutes from '../routes/student.js';
import { createCorsMiddleware } from '../cors.js';

const productionOrigin = 'https://gentle-caramel-c38a2b.netlify.app';
const previewOrigin = 'https://deploy-preview-123--gentle-caramel-c38a2b.netlify.app';
const untrustedOrigin = 'https://another-site.netlify.app';

describe('API CORS', () => {
  let server;
  let baseUrl;

  before(async () => {
    const app = express();
    app.use(createCorsMiddleware({
      NODE_ENV: 'production',
      FRONTEND_URL: productionOrigin,
      APP_ORIGIN: untrustedOrigin,
      CORS_ALLOWED_ORIGINS: previewOrigin,
    }));
    app.use(express.json());
    app.use('/api/auth', authRoutes);
    app.use('/api/student', studentRoutes);
    app.use((error, _req, res, _next) => {
      res.status(400).json({ message: 'Invalid request.' });
    });

    server = app.listen(0, '127.0.0.1');
    await once(server, 'listening');
    baseUrl = `http://127.0.0.1:${server.address().port}`;
  });

  after(async () => {
    if (!server) return;
    server.close();
    await once(server, 'close');
  });

  it('allows the exact production Netlify origin', async () => {
    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'OPTIONS',
      headers: {
        Origin: productionOrigin,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type',
      },
    });

    assert.equal(response.status, 204);
    assert.equal(response.headers.get('access-control-allow-origin'), productionOrigin);
    assert.match(response.headers.get('access-control-allow-methods') || '', /\bPOST\b/);
    assert.match(response.headers.get('access-control-allow-headers') || '', /content-type/i);
    assert.equal(response.headers.get('access-control-allow-credentials'), null);
  });

  it('allows the explicitly configured exact Netlify deploy-preview origin', async () => {
    const response = await fetch(`${baseUrl}/api/student/dashboard`, {
      method: 'OPTIONS',
      headers: {
        Origin: previewOrigin,
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'authorization',
      },
    });

    assert.equal(response.status, 204);
    assert.equal(response.headers.get('access-control-allow-origin'), previewOrigin);
    assert.match(response.headers.get('access-control-allow-headers') || '', /authorization/i);
  });

  it('does not grant CORS access to unrelated origins', async () => {
    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'OPTIONS',
      headers: {
        Origin: untrustedOrigin,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type',
      },
    });

    assert.notEqual(response.headers.get('access-control-allow-origin'), untrustedOrigin);
    assert.equal(response.headers.get('access-control-allow-credentials'), null);
  });

  it('applies CORS headers to the real registration endpoint response', async () => {
    const response = await fetch(`${baseUrl}/api/auth/register/otp/request`, {
      method: 'POST',
      headers: {
        Origin: productionOrigin,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    assert.equal(response.status, 400);
    assert.equal(response.headers.get('access-control-allow-origin'), productionOrigin);
    assert.match((await response.json()).message, /valid email/i);
  });

  it('applies CORS headers to the real login endpoint response', async () => {
    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        Origin: previewOrigin,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    assert.equal(response.status, 400);
    assert.equal(response.headers.get('access-control-allow-origin'), previewOrigin);
  });

  it('allows browser requests to reach authenticated APIs without granting credentials', async () => {
    const response = await fetch(`${baseUrl}/api/student/dashboard`, {
      headers: {
        Origin: productionOrigin,
        Authorization: 'Bearer invalid-test-token',
      },
    });

    assert.equal(response.status, 401);
    assert.equal(response.headers.get('access-control-allow-origin'), productionOrigin);
    assert.equal(response.headers.get('access-control-allow-credentials'), null);
  });

  it('keeps CORS headers on downstream JSON parsing errors', async () => {
    const response = await fetch(`${baseUrl}/api/auth/register/otp/request`, {
      method: 'POST',
      headers: {
        Origin: productionOrigin,
        'Content-Type': 'application/json',
      },
      body: '{',
    });

    assert.equal(response.status, 400);
    assert.equal(response.headers.get('access-control-allow-origin'), productionOrigin);
  });
});

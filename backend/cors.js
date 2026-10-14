import cors from 'cors';

const PRODUCTION_NETLIFY_ORIGIN = 'https://gentle-caramel-c38a2b.netlify.app';
const CORS_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'];
const CORS_HEADERS = ['Authorization', 'Content-Type'];

function parseOrigin(value) {
  try {
    const parsed = new URL(value);
    return ['http:', 'https:'].includes(parsed.protocol) ? parsed.origin : null;
  } catch {
    return null;
  }
}

function configuredOrigins(env, key) {
  return String(env[key] || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => {
      const origin = parseOrigin(value);
      if (!origin) {
        throw new Error(`${key} must contain comma-separated HTTP(S) origins.`);
      }
      return origin;
    });
}

export function createCorsMiddleware(env = process.env) {
  const isProduction = env.NODE_ENV === 'production' || env.RENDER === 'true';
  const allowedOrigins = new Set([
    PRODUCTION_NETLIFY_ORIGIN,
    ...configuredOrigins(env, 'FRONTEND_URL'),
    ...configuredOrigins(env, 'CORS_ALLOWED_ORIGINS'),
    ...(isProduction
      ? []
      : [
        ...configuredOrigins(env, 'APP_ORIGIN'),
        'http://localhost:5173',
        'http://127.0.0.1:5173',
      ]),
  ]);

  return cors({
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }

      const normalizedOrigin = parseOrigin(origin);
      const isAllowed = Boolean(
        normalizedOrigin && (
          allowedOrigins.has(normalizedOrigin) ||
          /^https:\/\/[a-z0-9-]+--gentle-caramel-c38a2b\.netlify\.app$/i.test(normalizedOrigin)
        )
      );
      callback(null, isAllowed ? normalizedOrigin : false);
    },
    allowedHeaders: CORS_HEADERS,
    methods: CORS_METHODS,
    optionsSuccessStatus: 204,
  });
}

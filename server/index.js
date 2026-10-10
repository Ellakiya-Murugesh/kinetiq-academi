import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import studentRoutes from './routes/student.js';
import { BRAND_NAME } from '../shared/brand.js';
import { closeDatabase, connectDatabase, pingDatabase } from './db.js';
import { startEmailNotificationWorker, stopEmailNotificationWorker } from './services/emailNotifications.js';

const app = express();
const PORT = process.env.PORT || 5000;
const DATABASE_RETRY_INITIAL_MS = 5_000;
const DATABASE_RETRY_MAX_MS = 30_000;
const isProduction = process.env.NODE_ENV === 'production';
const HOST = process.env.HOST || (isProduction ? '0.0.0.0' : '127.0.0.1');
const configuredOrigins = [
  'https://gentle-caramel-c38a2b.netlify.app',
  ...(process.env.APP_ORIGIN || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
];
const developmentOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:4173', 'http://127.0.0.1:4173'];

function isAllowedOrigin(origin, request) {
  if (!origin) return true;
  if (configuredOrigins.includes(origin) || (!isProduction && developmentOrigins.includes(origin))) return true;
  try {
    const source = new URL(origin);
    const host = request.headers.host;
    return source.host === host && source.protocol === (isProduction ? 'https:' : 'http:');
  } catch {
    return false;
  }
}

app.use(cors({
  origin(origin, callback) {
    callback(null, isAllowedOrigin(origin, { headers: {} }));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Kinetiq-Request'],
}));
app.use(express.json({ limit: '1mb' }));

app.use('/api', (req, res, next) => {
  const isWrite = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);
  if (isWrite && req.headers.cookie && req.headers['x-kinetiq-request'] !== '1') {
    return res.status(403).json({ message: 'Request verification failed. Refresh the page and try again.' });
  }
  if (req.headers.origin && !isAllowedOrigin(req.headers.origin, req)) {
    return res.status(403).json({ message: 'This application origin is not allowed.' });
  }
  return next();
});

app.use('/api', (req, res, next) => {
  console.info(`[API ${req.method}]`);
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/student', studentRoutes);

app.get(['/health', '/api/health'], async (req, res) => {
  try {
    await pingDatabase();
    databaseReady = true;
    databaseFailureCode = null;
    return res.json({ status: 'ok', service: `${BRAND_NAME} API Server`, database: 'connected', timestamp: new Date().toISOString() });
  } catch (error) {
    if (databaseReady) {
      databaseFailureCode = String(error?.code || 'MONGODB_PING_FAILED')
        .replace(/[^A-Za-z0-9_-]/g, '').slice(0, 48);
    }
    databaseReady = false;
    return res.status(503).json({
      status: 'degraded',
      service: `${BRAND_NAME} API Server`,
      database: 'unavailable',
      diagnostic: databaseFailureCode || 'MONGODB_PING_FAILED',
      timestamp: new Date().toISOString(),
    });
  }
});

app.use((err, req, res, next) => {
  if (err?.code === 'WRITE_CONFLICT' || err?.code === 11000) {
    return res.status(409).json({
      success: false,
      message: 'This record has changed or already exists. Reload the page and try again.',
    });
  }
  if (err?.code === 'MONGODB_UNAVAILABLE') {
    return res.status(503).json({
      success: false,
      message: 'The account service is unavailable because its database connection is offline. Please try again after service is restored or contact Kinetiq Academi support.',
    });
  }
  console.error('Unhandled API request error:', err?.name || 'Error', err?.code || 'NO_CODE');
  return res.status(500).json({ success: false, message: 'An internal server error occurred.' });
});

let server;
let retryTimer;
let databaseRetryDelayMs = DATABASE_RETRY_INITIAL_MS;
let databaseReady = false;
let databaseFailureCode = 'MONGODB_NOT_CONNECTED';

async function connectWithRetry() {
  try {
    await connectDatabase();
    databaseReady = true;
    databaseFailureCode = null;
    databaseRetryDelayMs = DATABASE_RETRY_INITIAL_MS;
    startEmailNotificationWorker();
    console.log(`🚀 ${BRAND_NAME} API backend is ready on port ${PORT}. MongoDB persistence is active.`);
  } catch (error) {
    databaseReady = false;
    databaseFailureCode = String(error?.code || 'MONGODB_CONNECTION_FAILED')
      .replace(/[^A-Za-z0-9_-]/g, '').slice(0, 48);
    console.error(error.message || 'MongoDB startup failed.');
    retryTimer = setTimeout(connectWithRetry, databaseRetryDelayMs);
    databaseRetryDelayMs = Math.min(databaseRetryDelayMs * 2, DATABASE_RETRY_MAX_MS);
    retryTimer.unref?.();
  }
}

server = app.listen(PORT, HOST, () => {
  console.log(`🚀 ${BRAND_NAME} API listening on port ${PORT}; checking MongoDB Atlas.`);
  void connectWithRetry();
});

async function shutdown() {
  if (retryTimer) clearTimeout(retryTimer);
  stopEmailNotificationWorker();
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await closeDatabase().catch(() => {});
}

process.once('SIGINT', () => shutdown().finally(() => process.exit()));
process.once('SIGTERM', () => shutdown().finally(() => process.exit()));

export default app;

import express from 'express';
import authRoutes from './routes/auth.js';
import adminAuthRoutes from './routes/adminAuth.js';
import adminRoutes from './routes/admin.js';
import studentRoutes from './routes/student.js';
import { createCorsMiddleware } from './cors.js';
import { BRAND_NAME } from '../shared/brand.js';
import { closeDatabase, connectDatabase, pingDatabase } from './db.js';

const app = express();
const PORT = process.env.PORT || 5000;
app.set('trust proxy', 1);

app.use(createCorsMiddleware());
app.use(express.json());

app.use('/api', (req, res, next) => {
  console.log(`[API ${req.method}] ${req.url}`);
  next();
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin-auth', adminAuthRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/student', studentRoutes);

app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: `${BRAND_NAME} API Server`,
    health: '/api/health',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

app.get('/health', (req, res) => {
  res.redirect(301, '/api/health');
});

app.get('/api/health', async (req, res) => {
  try {
    await pingDatabase();
    res.json({ status: 'ok', service: `${BRAND_NAME} API Server`, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('API health check failed:', error.message);
    res.status(503).json({
      status: 'unavailable',
      service: `${BRAND_NAME} API Server`,
      message: 'The API database connection is unavailable.',
    });
  }
});

app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    message: 'An internal server error occurred.',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

async function startServer() {
  try {
    await connectDatabase();
  } catch (error) {
    console.error(`API startup failed: ${error.message}`);
    process.exitCode = 1;
    return;
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`${BRAND_NAME} API backend listening on port ${PORT}.`);
  });
  server.on('error', (error) => {
    console.error(`API listener failed: ${error.message}`);
    process.exitCode = 1;
  });

  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.once(signal, () => {
      server.close(() => {
        void closeDatabase().finally(() => process.exit(0));
      });
    });
  }
}

void startServer();

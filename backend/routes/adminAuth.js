import bcrypt from 'bcryptjs';
import express from 'express';
import rateLimit from 'express-rate-limit';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { getMongoClient, getMongoDatabase, findUserByCredentials } from '../db.js';
import { requireAdmin } from '../middleware/auth.js';
import { issueSession } from './auth.js';
import { sendAdminPasswordResetEmail } from '../services/emailNotifications.js';

const RESET_TOKEN_TTL_MS = 30 * 60 * 1000;
const RESET_RESPONSE = {
  message: 'If an active administrator account matches that email, password reset instructions will be sent.',
};
const INVALID_RESET_MESSAGE = 'This password reset link is invalid or has expired. Request a new link and try again.';
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(value) {
  return String(value ?? '').trim().toLowerCase();
}

function isValidPassword(value) {
  const bytes = Buffer.byteLength(String(value ?? ''), 'utf8');
  return bytes >= 8 && bytes <= 72;
}

function safeDiagnostic(error) {
  return String(error?.code || error?.name || 'ADMIN_AUTH_ERROR')
    .replace(/[^A-Za-z0-9_-]/g, '')
    .slice(0, 48);
}

function getWebsiteUrl() {
  const configured = process.env.FRONTEND_URL || process.env.APP_ORIGIN;
  const base = configured || (process.env.NODE_ENV === 'production' ? '' : 'http://127.0.0.1:5173');
  let website;
  try {
    website = new URL(base);
  } catch {
    throw new Error('The website URL is not configured for password recovery.');
  }
  if (process.env.NODE_ENV === 'production' && website.protocol !== 'https:') {
    throw new Error('Password recovery requires an HTTPS website URL in production.');
  }
  return website.origin;
}

function createLimiter(limit, windowMs, message) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => res.status(429).json({ message }),
  });
}

export function createAdminAuthRouter({
  getDatabase = getMongoDatabase,
  getClient = getMongoClient,
  requireAdminMiddleware = requireAdmin,
  sendResetEmail = sendAdminPasswordResetEmail,
  findCredentials = findUserByCredentials,
  createSession = issueSession,
  comparePassword = bcrypt.compare,
  hashPassword = (password) => bcrypt.hash(password, 12),
  makeToken = () => randomBytes(32).toString('base64url'),
  makeId = () => `usr-admin-${randomUUID()}`,
  now = () => new Date(),
} = {}) {
  const router = express.Router();

  router.post('/login', createLimiter(10, 15 * 60 * 1000, 'Too many sign-in attempts. Please wait and try again.'), async (req, res) => {
    try {
      const identifier = normalizeEmail(req.body?.identifier);
      const password = String(req.body?.password ?? '');
      if (!emailPattern.test(identifier) || !password) {
        return res.status(401).json({ message: 'Invalid administrator email or password.' });
      }

      const user = await findCredentials(identifier);
      if (!user || user.role !== 'ADMIN' || user.status !== 'ACTIVE') {
        return res.status(401).json({ message: 'Invalid administrator email or password.' });
      }
      if (!await comparePassword(password, user.passwordHash)) {
        return res.status(401).json({ message: 'Invalid administrator email or password.' });
      }

      return res.json(await createSession(user));
    } catch (error) {
      console.error(`Admin sign-in failed (${safeDiagnostic(error)}).`);
      return res.status(503).json({ message: 'Administrator sign-in is temporarily unavailable. Please try again.' });
    }
  });

  router.post('/register', requireAdminMiddleware, async (req, res) => {
    const name = String(req.body?.name ?? '').trim();
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password ?? '');
    const confirmPassword = String(req.body?.confirmPassword ?? '');
    const approverPassword = String(req.body?.approverPassword ?? '');

    if (!name || name.length > 120) {
      return res.status(400).json({ message: 'Enter an administrator name of 1–120 characters.' });
    }
    if (!emailPattern.test(email) || email.length > 254) {
      return res.status(400).json({ message: 'Enter a valid administrator email address.' });
    }
    if (!isValidPassword(password)) {
      return res.status(400).json({ message: 'Choose a password between 8 and 72 UTF-8 bytes.' });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'The password and confirmation do not match.' });
    }
    if (!approverPassword) {
      return res.status(400).json({ message: 'Enter your current administrator password to approve this account.' });
    }

    try {
      const database = getDatabase();
      const users = database.collection('users');
      const approver = await users.findOne(
        { id: req.user.id, role: 'ADMIN', status: 'ACTIVE' },
        { projection: { passwordHash: 1 } }
      );
      if (!approver || !await comparePassword(approverPassword, approver.passwordHash)) {
        return res.status(403).json({ message: 'Your current administrator password could not be verified.' });
      }

      const existing = await users.findOne(
        { email },
        { collation: { locale: 'en', strength: 2 }, projection: { id: 1 } }
      );
      if (existing) return res.status(409).json({ message: 'An account with that email already exists.' });

      const lastUser = await users.find({}, { projection: { _position: 1 } })
        .sort({ _position: -1 })
        .limit(1)
        .next();
      const account = {
        id: makeId(),
        name,
        email,
        passwordHash: await hashPassword(password),
        role: 'ADMIN',
        status: 'ACTIVE',
        sessionVersion: 0,
        createdAt: now().toISOString(),
        _version: 0,
        _position: (lastUser?._position ?? -1) + 1,
      };
      await users.insertOne(account);
      return res.status(201).json({
        message: 'Administrator account created successfully.',
        user: { id: account.id, name: account.name, email: account.email, role: account.role },
      });
    } catch (error) {
      if (error?.code === 11000) {
        return res.status(409).json({ message: 'An account with that email already exists.' });
      }
      console.error(`Admin account creation failed (${safeDiagnostic(error)}).`);
      return res.status(503).json({ message: 'Administrator account creation is temporarily unavailable.' });
    }
  });

  router.post('/forgot-password', createLimiter(5, 60 * 60 * 1000, 'Too many reset requests. Please wait before trying again.'), async (req, res) => {
    const email = normalizeEmail(req.body?.email);
    if (!emailPattern.test(email) || email.length > 254) {
      return res.status(400).json({ message: 'Enter a valid email address.' });
    }

    let resetTokens;
    let issuedToken;
    let user;
    try {
      const database = getDatabase();
      user = await database.collection('users').findOne(
        { email, role: 'ADMIN', status: 'ACTIVE' },
        { collation: { locale: 'en', strength: 2 }, projection: { id: 1, name: 1, email: 1 } }
      );
      if (user) {
        resetTokens = database.collection('adminPasswordResetTokens');
        issuedToken = makeToken();
        const tokenHash = createHash('sha256').update(issuedToken).digest('hex');
        const expiresAt = new Date(now().getTime() + RESET_TOKEN_TTL_MS);
        await resetTokens.replaceOne(
          { _id: user.id },
          { _id: user.id, userId: user.id, tokenHash, expiresAt },
          { upsert: true }
        );

        try {
          const resetUrl = new URL('/admin/reset-password', getWebsiteUrl());
          resetUrl.searchParams.set('token', issuedToken);
          await sendResetEmail({ email: user.email, name: user.name, resetUrl: resetUrl.toString() });
        } catch (error) {
          try {
            await resetTokens.deleteOne({ _id: user.id, tokenHash });
          } catch (cleanupError) {
            console.warn(`Admin password reset token cleanup failed (${safeDiagnostic(cleanupError)}).`);
          }
          console.warn(`Admin password reset email delivery failed (${safeDiagnostic(error)}).`);
        }
      }
      return res.status(202).json(RESET_RESPONSE);
    } catch (error) {
      console.error(`Admin password reset request failed (${safeDiagnostic(error)}).`);
      return res.status(503).json({ message: 'Password recovery is temporarily unavailable. Please try again later.' });
    } finally {
      issuedToken = undefined;
    }
  });

  router.post('/reset-password', createLimiter(10, 15 * 60 * 1000, 'Too many reset attempts. Please wait before trying again.'), async (req, res) => {
    const token = String(req.body?.token ?? '');
    const password = String(req.body?.password ?? '');
    const confirmPassword = String(req.body?.confirmPassword ?? '');
    if (!/^[A-Za-z0-9_-]{43}$/.test(token)) {
      return res.status(400).json({ message: INVALID_RESET_MESSAGE });
    }
    if (!isValidPassword(password)) {
      return res.status(400).json({ message: 'Choose a password between 8 and 72 UTF-8 bytes.' });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'The password and confirmation do not match.' });
    }

    const tokenHash = createHash('sha256').update(token).digest('hex');
    let session;
    try {
      const passwordHash = await hashPassword(password);
      session = getClient().startSession();
      await session.withTransaction(async () => {
        const database = getDatabase();
        const resetTokens = database.collection('adminPasswordResetTokens');
        const users = database.collection('users');
        const currentTime = now();
        const resetRecord = await resetTokens.findOne(
          { tokenHash, expiresAt: { $gt: currentTime } },
          { session }
        );
        if (!resetRecord) {
          const error = new Error(INVALID_RESET_MESSAGE);
          error.code = 'INVALID_ADMIN_RESET_TOKEN';
          throw error;
        }

        const updated = await users.updateOne(
          { id: resetRecord.userId, role: 'ADMIN', status: 'ACTIVE' },
          {
            $set: { passwordHash, updatedAt: currentTime.toISOString() },
            $inc: { _version: 1, sessionVersion: 1 },
          },
          { session }
        );
        if (updated.matchedCount !== 1) {
          const error = new Error(INVALID_RESET_MESSAGE);
          error.code = 'INVALID_ADMIN_RESET_TOKEN';
          throw error;
        }

        const consumed = await resetTokens.deleteOne(
          { _id: resetRecord.userId, tokenHash, expiresAt: { $gt: currentTime } },
          { session }
        );
        if (consumed.deletedCount !== 1) {
          const error = new Error(INVALID_RESET_MESSAGE);
          error.code = 'INVALID_ADMIN_RESET_TOKEN';
          throw error;
        }
      });
      return res.json({ message: 'Administrator password reset successfully. Sign in with your new password.' });
    } catch (error) {
      if (error?.code === 'INVALID_ADMIN_RESET_TOKEN') {
        return res.status(400).json({ message: INVALID_RESET_MESSAGE });
      }
      console.error(`Admin password reset failed (${safeDiagnostic(error)}).`);
      return res.status(503).json({ message: 'Password reset is temporarily unavailable. Please request a new link later.' });
    } finally {
      if (session) await session.endSession();
    }
  });

  return router;
}

export default createAdminAuthRouter();

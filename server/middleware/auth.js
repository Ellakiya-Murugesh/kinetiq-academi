import jwt from 'jsonwebtoken';
import { randomBytes } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { findStudentByUserId, findUserById } from '../db.js';

if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is required in production. Configure it in the server process environment.');
}

function getDevelopmentSecret() {
  const secretPath = fileURLToPath(new URL('../data/.jwt-secret', import.meta.url));
  try {
    return readFileSync(secretPath, 'utf8').trim();
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }

  const secret = randomBytes(48).toString('hex');
  try {
    writeFileSync(secretPath, secret, { encoding: 'utf8', flag: 'wx', mode: 0o600 });
    return secret;
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
    return readFileSync(secretPath, 'utf8').trim();
  }
}

export const JWT_SECRET = process.env.JWT_SECRET || getDevelopmentSecret();
export const SESSION_COOKIE = process.env.NODE_ENV === 'production' ? '__Host-kinetiq_session' : 'kinetiq_session';
const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export function issueSessionCookie(res, user) {
  const token = jwt.sign(
    { id: user.id, role: user.role, sessionVersion: user.sessionVersion ?? 0 },
    JWT_SECRET,
    { expiresIn: '7d', issuer: 'kinetiq-academy', audience: 'kinetiq-app' }
  );
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_MS,
  });
}

export function clearSessionCookie(res) {
  res.clearCookie(SESSION_COOKIE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/',
  });
}

function readSessionToken(req) {
  const cookies = String(req.headers.cookie || '')
    .split(';')
    .map((part) => part.trim().split('='))
    .filter(([name]) => name === SESSION_COOKIE);
  if (cookies.length > 0) return decodeURIComponent(cookies[0].slice(1).join('='));

  const authorization = req.headers.authorization || '';
  return authorization.startsWith('Bearer ') ? authorization.slice(7) : null;
}

export async function authenticateToken(req, res, next) {
  let token;
  let decoded;
  try {
    token = readSessionToken(req);
    if (!token) return res.status(401).json({ message: 'Authentication required. Please log in.' });
    decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'kinetiq-academy',
      audience: 'kinetiq-app',
    });
  } catch {
    return res.status(401).json({ message: 'Session expired or invalid. Please log in again.' });
  }

  let user;
  try {
    user = await findUserById(decoded.id);
  } catch (error) {
    const diagnostic = error?.code || error?.name || 'unknown database error';
    console.error(`Session account lookup failed (${diagnostic}).`);
    return res.status(503).json({ message: 'Account services are temporarily unavailable. Please try again shortly.' });
  }
  if (
    !user ||
    user.status !== 'ACTIVE' ||
    user.role !== decoded.role ||
    (user.sessionVersion ?? 0) !== (decoded.sessionVersion ?? 0)
  ) {
    return res.status(403).json({ message: 'User account not found or deactivated.' });
  }
  req.user = user;
  return next();
}

export async function requireAdmin(req, res, next) {
  await authenticateToken(req, res, () => {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied. Administrator privileges required.' });
    }
    return next();
  });
}

export async function requireStudent(req, res, next) {
  return authenticateToken(req, res, async () => {
    if (req.user.role !== 'STUDENT') {
      return res.status(403).json({ message: 'Access denied. Student privileges required.' });
    }
    let student;
    try {
      student = await findStudentByUserId(req.user.id);
    } catch (error) {
      const diagnostic = error?.code || error?.name || 'unknown database error';
      console.error(`Student account lookup failed (${diagnostic}).`);
      return res.status(503).json({ message: 'Student services are temporarily unavailable. Please try again shortly.' });
    }
    if (!student) return res.status(404).json({ message: 'Student profile not found.' });
    req.student = student;
    return next();
  });
}

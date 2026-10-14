import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomBytes, randomInt, randomUUID, timingSafeEqual } from 'crypto';
import rateLimit from 'express-rate-limit';
import {
  findStudentByUserId,
  findUserByCredentials,
  findUserById,
  getDb,
  getMongoDatabase,
  saveDb,
} from '../db.js';
import { JWT_SECRET, authenticateToken } from '../middleware/auth.js';
import { ensureGateCourse, getGateCourse } from '../utils/gateEnrollment.js';

const router = express.Router();
const otpChallenges = new Map();
const registrationChallenges = new Map();
const OTP_TTL_MS = 5 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;
const REGISTRATION_COURSE_CODES = new Set([
  'GATE-CY',
  'GATE-PH',
  'GATE-ME',
  'GATE-CSE',
  'GATE-ECE',
]);

function getLoginDiagnostic(error) {
  const pending = [error];
  const visited = new Set();
  const codes = new Set();
  const names = new Set();

  while (pending.length && visited.size < 20) {
    const current = pending.shift();
    if (!current || typeof current !== 'object' || visited.has(current)) continue;
    visited.add(current);
    if (current.code !== undefined) codes.add(String(current.code));
    if (current.name) names.add(String(current.name));
    pending.push(current.cause);
    const servers = current.reason?.servers;
    if (servers && typeof servers.values === 'function') {
      for (const server of servers.values()) pending.push(server?.description?.error);
    }
  }

  if (codes.has('ETIMEDOUT') || codes.has('ECONNRESET') || codes.has('ECONNREFUSED') ||
      names.has('MongoNetworkTimeoutError')) {
    return 'MONGODB_NETWORK_UNAVAILABLE';
  }
  if (codes.has('ENOTFOUND') || codes.has('EAI_AGAIN')) return 'MONGODB_DNS_UNAVAILABLE';
  if (codes.has('18') || codes.has('8000')) return 'MONGODB_AUTHENTICATION_FAILED';
  if ([...codes].some((code) => /^MONGODB_[A-Z0-9_]+$/.test(code))) {
    return [...codes].find((code) => /^MONGODB_[A-Z0-9_]+$/.test(code));
  }
  return 'AUTH_SERVICE_UNAVAILABLE';
}

export function createLoginHandler({
  findCredentials = findUserByCredentials,
  comparePassword = bcrypt.compare,
  createSession = issueSession,
} = {}) {
  return async (req, res) => {
    try {
    const { identifier, password, role } = req.body ?? {};

      if (!identifier || !password) {
        return res.status(400).json({
          message: 'Please provide an email, phone, or account ID and password.',
        });
      }

      const user = await findCredentials(identifier);

      if (!user) {
        return res.status(401).json({
          message: 'Invalid credentials. No account found matching this email, phone, or ID.',
        });
      }

      if (user.status !== 'ACTIVE') {
        return res.status(403).json({
          message: 'Your account is currently inactive or suspended. Please contact admissions support.',
        });
      }

      if (role && role.toUpperCase() !== user.role) {
        return res.status(403).json({
          message: `Unauthorized portal. This account does not possess ${role.toUpperCase()} privileges.`,
        });
      }

      const isPasswordValid = await comparePassword(password, user.passwordHash).catch(() => false);

      if (!isPasswordValid) {
        return res.status(401).json({
          message: 'Invalid password. Please check your spelling and try again.',
        });
      }

      return res.json(await createSession(user));
    } catch (error) {
      const diagnostic = getLoginDiagnostic(error);
      console.error(`Login failed (${diagnostic}).`);
      return res.status(503).json({
        message: 'Sign-in is temporarily unavailable because account services cannot be reached. Please try again shortly.',
      });
    }
  };
}

function normalizePhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  return digits.length > 10 ? digits.slice(-10) : digits;
}

function canExposeDevelopmentCode() {
  return process.env.NODE_ENV !== 'production' && process.env.RENDER !== 'true';
}

function isValidIndianMobile(value) {
  const digits = String(value ?? '').replace(/\D/g, '');
  const nationalNumber = digits.length === 12 && digits.startsWith('91')
    ? digits.slice(2)
    : digits;
  return /^[6-9]\d{9}$/.test(nationalNumber);
}

export async function issueSession(user) {
  const token = jwt.sign(
    {
      id: user.id,
      role: user.role,
      email: user.email,
      name: user.name,
      sessionVersion: user.sessionVersion ?? 0,
    },
    JWT_SECRET,
    { expiresIn: '7d', issuer: 'kinetiq-academy', audience: 'kinetiq-app' }
  );
  const studentProfile = user.role === 'STUDENT' ? await findStudentByUserId(user.id) : null;
  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      studentId: studentProfile ? studentProfile.id : null,
    },
    studentProfile,
    message: 'Login successful.',
  };
}

const mobileOtpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => res.status(429).json({ message: 'Too many OTP requests. Please wait before trying again.' }),
});

export function registrationConflictExists(db, email, phone) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const normalizedPhone = normalizePhone(phone);
  const matchesIdentity = (record) =>
    String(record.email || '').trim().toLowerCase() === normalizedEmail ||
    normalizePhone(record.phone ?? record.mobile) === normalizedPhone;

  return db.users.some(matchesIdentity) || db.students.some(matchesIdentity);
}

function respondRegistrationDatabaseUnavailable(res, error) {
  if (error?.code === 11000) {
    const fields = Object.keys(error.keyPattern || {})
      .filter((field) => /^[A-Za-z][A-Za-z0-9_]*$/.test(field))
      .join(', ');
    console.warn(`GATE registration encountered a duplicate database key${fields ? ` (${fields})` : ''}.`);
    return res.status(409).json({
      message: 'These account details conflict with an existing record. Sign in if you already have an account, or contact support.',
    });
  }

  const diagnostic = error?.code || error?.name || 'unknown database error';
  console.error(`GATE registration database operation failed (${diagnostic}).`);
  return res.status(503).json({
    message: 'Student registration is temporarily unavailable because its database is not configured or connected. Please try again later.',
  });
}

async function loadRegistrationDb(res) {
  try {
    return await getDb();
  } catch (error) {
    respondRegistrationDatabaseUnavailable(res, error);
    return null;
  }
}

router.post('/otp/request', mobileOtpLimiter, async (req, res) => {
  const phone = normalizePhone(req.body.phone);
  const requestedRole = String(req.body.role || '').toUpperCase();
  if (requestedRole !== 'ADMIN') {
    return res.status(403).json({ message: 'Mobile OTP login is available only for the team portal.' });
  }
  if (phone.length !== 10) {
    return res.status(400).json({ message: 'Enter a valid 10-digit registered mobile number.' });
  }
  if (process.env.NODE_ENV === 'production' && !process.env.OTP_DELIVERY_URL) {
    return res.status(503).json({ message: 'OTP delivery is not configured. Configure OTP_DELIVERY_URL to enable SMS or WhatsApp delivery.' });
  }

  let db;
  try {
    db = await getDb();
  } catch {
    return res.status(503).json({ message: 'Login is temporarily unavailable. Please try again later.' });
  }
  const user = db.users.find((candidate) =>
    normalizePhone(candidate.phone) === phone &&
    candidate.status === 'ACTIVE' &&
    (!requestedRole || candidate.role === requestedRole)
  );
  if (!user) {
    return res.status(404).json({ message: 'No active account matches this mobile number and selected role.' });
  }

  const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
  if (process.env.OTP_DELIVERY_URL) {
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (process.env.OTP_DELIVERY_TOKEN) {
        headers.Authorization = `Bearer ${process.env.OTP_DELIVERY_TOKEN}`;
      }
      const deliveryResponse = await fetch(process.env.OTP_DELIVERY_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({ phone: user.phone, code, name: user.name }),
        signal: AbortSignal.timeout(8000),
      });
      if (!deliveryResponse.ok) {
        return res.status(502).json({ message: 'The OTP delivery provider could not send the code. Please try again.' });
      }
    } catch (error) {
      console.error('OTP delivery request failed:', error);
      return res.status(502).json({ message: 'The OTP delivery provider is unavailable. Please try again.' });
    }
  }

  otpChallenges.set(`${user.id}:${phone}`, {
    code,
    expiresAt: Date.now() + OTP_TTL_MS,
    attempts: 0,
  });

  res.json({
    message: `A verification code was requested for the registered number ending in ${phone.slice(-4)}.`,
    expiresInSeconds: OTP_TTL_MS / 1000,
    ...(canExposeDevelopmentCode() && !process.env.OTP_DELIVERY_URL
      ? { developmentCode: code }
      : {}),
  });
});

router.post('/otp/verify', mobileOtpLimiter, async (req, res) => {
  const phone = normalizePhone(req.body.phone);
  const code = String(req.body.code || '');
  const requestedRole = String(req.body.role || '').toUpperCase();
  if (requestedRole !== 'ADMIN') {
    return res.status(403).json({ message: 'Mobile OTP login is available only for the team portal.' });
  }
  const db = await getDb();
  const user = db.users.find((candidate) =>
    normalizePhone(candidate.phone) === phone &&
    candidate.status === 'ACTIVE' &&
    (!requestedRole || candidate.role === requestedRole)
  );
  if (!user) return res.status(401).json({ message: 'Invalid verification code or account.' });

  const key = `${user.id}:${phone}`;
  const challenge = otpChallenges.get(key);
  if (!challenge || challenge.expiresAt <= Date.now()) {
    otpChallenges.delete(key);
    return res.status(401).json({ message: 'Verification code expired. Request a new code.' });
  }
  if (challenge.attempts >= MAX_OTP_ATTEMPTS) {
    otpChallenges.delete(key);
    return res.status(429).json({ message: 'Too many incorrect attempts. Request a new code.' });
  }

  challenge.attempts += 1;
  const supplied = Buffer.from(code.padEnd(6, ' ').slice(0, 6));
  const expected = Buffer.from(challenge.code);
  if (!/^\d{6}$/.test(code) || !timingSafeEqual(supplied, expected)) {
    if (challenge.attempts >= MAX_OTP_ATTEMPTS) otpChallenges.delete(key);
    return res.status(401).json({ message: 'Incorrect verification code.' });
  }

  otpChallenges.delete(key);
  res.json(await issueSession(user));
});

router.post('/register/otp/request', async (req, res) => {
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const phone = normalizePhone(req.body.phone);
  const password = String(req.body.password || '');
  const courseCode = String(req.body.courseCode || '').trim();

  if (!name || !email || phone.length !== 10 || password.length < 8) {
    return res.status(400).json({ message: 'Provide your name, valid email, 10-digit mobile number, and a password of at least 8 characters.' });
  }

  const course = getGateCourse(courseCode);
  if (!course || !REGISTRATION_COURSE_CODES.has(course.code)) {
    return res.status(400).json({ message: 'Choose one of the available GATE courses to continue.' });
  }

  const db = await loadRegistrationDb(res);
  if (!db) return;
  const duplicate = registrationConflictExists(db, email, phone);
  if (duplicate) {
    return res.status(409).json({ message: 'An account already uses this email or mobile number. Sign in instead.' });
  }

  if (process.env.NODE_ENV === 'production' && !process.env.OTP_DELIVERY_URL) {
    return res.status(503).json({ message: 'OTP delivery is not configured. Configure OTP_DELIVERY_URL to enable SMS or WhatsApp delivery.' });
  }

  const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
  if (process.env.OTP_DELIVERY_URL) {
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (process.env.OTP_DELIVERY_TOKEN) headers.Authorization = `Bearer ${process.env.OTP_DELIVERY_TOKEN}`;
      const deliveryResponse = await fetch(process.env.OTP_DELIVERY_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({ phone: req.body.phone, code, name }),
        signal: AbortSignal.timeout(8000),
      });
      if (!deliveryResponse.ok) {
        return res.status(502).json({ message: 'The OTP delivery provider could not send the code. Please try again.' });
      }
    } catch (error) {
      console.error('Registration OTP delivery failed:', error);
      return res.status(502).json({ message: 'The OTP delivery provider is unavailable. Please try again.' });
    }
  }

  const passwordHash = await bcrypt.hash(password, 10);
  registrationChallenges.set(phone, {
    code,
    expiresAt: Date.now() + OTP_TTL_MS,
    attempts: 0,
    registration: {
      name,
      email,
      phone: String(req.body.phone).trim(),
      passwordHash,
      courseCode: course.code,
      courseId: course.id,
      exam: course.exam,
      subject: course.subject,
      courseName: course.courseName,
    },
  });

  res.json({
    message: 'If the account is eligible, a verification code has been sent.',
    expiresInSeconds: OTP_TTL_MS / 1000,
    ...(canExposeDevelopmentCode() && !process.env.OTP_DELIVERY_URL
      ? { developmentCode: code }
      : {}),
  });
});

router.post('/register/otp/verify', async (req, res) => {
  const phone = normalizePhone(req.body.phone);
  const code = String(req.body.code || '');
  const challenge = registrationChallenges.get(phone);

  if (!challenge || challenge.expiresAt <= Date.now()) {
    registrationChallenges.delete(phone);
    return res.status(401).json({ message: 'Verification code expired. Request a new code.' });
  }
  if (challenge.attempts >= MAX_OTP_ATTEMPTS) {
    registrationChallenges.delete(phone);
    return res.status(429).json({ message: 'Too many incorrect attempts. Request a new code.' });
  }

  challenge.attempts += 1;
  const supplied = Buffer.from(code.padEnd(6, ' ').slice(0, 6));
  const expected = Buffer.from(challenge.code);
  if (!/^\d{6}$/.test(code) || !timingSafeEqual(supplied, expected)) {
    if (challenge.attempts >= MAX_OTP_ATTEMPTS) registrationChallenges.delete(phone);
    return res.status(401).json({ message: 'Incorrect verification code.' });
  }

  const course = getGateCourse(challenge.registration.courseCode);
  if (
    !course ||
    !REGISTRATION_COURSE_CODES.has(course.code) ||
    course.id !== challenge.registration.courseId
  ) {
    registrationChallenges.delete(phone);
    return res.status(400).json({ message: 'The selected GATE course is no longer available. Please register again.' });
  }

  const db = await loadRegistrationDb(res);
  if (!db) {
    challenge.attempts -= 1;
    return;
  }
  const duplicate = registrationConflictExists(db, challenge.registration.email, phone);
  if (duplicate) {
    registrationChallenges.delete(phone);
    return res.status(409).json({ message: 'An account was created with this email or phone. Please sign in.' });
  }

  const registrationId = randomUUID();
  const userId = `usr-student-${registrationId}`;
  const studentId = `std-${registrationId}`;
  const today = new Date().toISOString().split('T')[0];
  ensureGateCourse(db, course);
  const newUser = {
    id: userId,
    email: challenge.registration.email,
    phone: challenge.registration.phone,
    passwordHash: challenge.registration.passwordHash,
    name: challenge.registration.name,
    role: 'STUDENT',
    createdAt: new Date().toISOString(),
    status: 'ACTIVE',
  };
  const newStudent = {
    id: studentId,
    userId,
    name: newUser.name,
    email: newUser.email,
    phone: newUser.phone,
    exam: challenge.registration.exam,
    subject: challenge.registration.subject,
    courseId: course.id,
    courseCode: course.code,
    courseName: course.courseName,
    enrollmentDate: today,
    paymentStatus: 'Pending',
    accountStatus: 'Active',
    progress: 0,
    classesAttended: 0,
    totalClasses: 0,
    materialsAccessed: 0,
    testsCompleted: 0,
    averageScore: 0,
    refundEligible: false,
    refundStatus: 'Not Eligible Yet',
  };

  db.users.push(newUser);
  db.students.push(newStudent);
  try {
    await saveDb(db);
  } catch (error) {
    challenge.attempts -= 1;
    if (error?.code === 11000) registrationChallenges.delete(phone);
    return respondRegistrationDatabaseUnavailable(res, error);
  }
  registrationChallenges.delete(phone);

  res.status(201).json({
    message: 'Mobile number verified. Registration is complete; please sign in.',
    user: { id: userId, name: newUser.name, email: newUser.email, phone: newUser.phone, role: newUser.role },
  });
});

router.post('/login', createLoginHandler());

router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out successfully.' });
});

router.get('/me', authenticateToken, async (req, res) => {
  const user = req.user;
  const studentProfile = user.role === 'STUDENT' ? await findStudentByUserId(user.id) : null;

  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      studentId: studentProfile ? studentProfile.id : null,
    },
    studentProfile,
  });
});

export default router;

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
import {
  createMsg91OtpProvider,
  createStudentMobileOtpService,
  normalizePhone as normalizeMobileOtpPhone,
} from '../services/studentMobileOtp.js';

const router = express.Router();
const otpChallenges = new Map();
const registrationChallenges = new Map();
const OTP_TTL_MS = 5 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;
const STUDENT_MOBILE_OTP_MESSAGE =
  'If an eligible student account matches, a verification code has been sent to its registered mobile number.';
const REGISTRATION_COURSE_CODES = new Set([
  'GATE-CY',
  'GATE-PH',
  'GATE-ME',
  'GATE-CSE',
  'GATE-ECE',
]);

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

const studentMobileOtpService = createStudentMobileOtpService({
  provider: createMsg91OtpProvider(),
  getCollection: () => getMongoDatabase().collection('studentMobileOtpChallenges'),
});

export function createStudentMobileOtpRouter({
  service = studentMobileOtpService,
  findStudent = (phone) => getMongoDatabase().collection('users').findOne({
    mobileNormalized: phone,
    status: 'ACTIVE',
    role: 'STUDENT',
  }),
  createSession = issueSession,
} = {}) {
  const studentOtpRouter = express.Router();
  const requestLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => res.status(429).json({
      message: 'Too many OTP requests. Please wait before trying again.',
    }),
  });
  const verifyLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => res.status(429).json({
      message: 'Too many verification attempts. Please wait before trying again.',
    }),
  });

  studentOtpRouter.post('/request', requestLimiter, async (req, res) => {
    const submittedPhone = String(req.body?.phone ?? '').trim();
    if (!isValidIndianMobile(submittedPhone)) {
      return res.status(400).json({ message: 'Enter a valid 10-digit Indian mobile number.' });
    }

    const phone = normalizeMobileOtpPhone(submittedPhone);
    let user;
    try {
      user = await findStudent(phone);
    } catch (error) {
      const diagnostic = error?.code || error?.name || 'unknown database error';
      console.error(`Student mobile OTP account lookup failed (${diagnostic}).`);
      return res.status(503).json({ message: 'Login is temporarily unavailable. Please try again later.' });
    }

    if (!user || user.role !== 'STUDENT' || user.status !== 'ACTIVE') {
      return res.json({
        message: STUDENT_MOBILE_OTP_MESSAGE,
        challengeId: randomBytes(32).toString('base64url'),
        expiresInSeconds: OTP_TTL_MS / 1000,
        resendAfterSeconds: 60,
      });
    }

    const result = await service.request(user);
    if (result.status === 'cooldown') {
      return res.status(429).json({
        message: `Please wait ${result.retryAfterSeconds} seconds before requesting another OTP.`,
        retryAfterSeconds: result.retryAfterSeconds,
      });
    }
    if (result.status === 'locked') {
      return res.status(429).json({
        message: 'Too many incorrect codes were entered. Please wait before requesting another OTP.',
        retryAfterSeconds: result.retryAfterSeconds,
      });
    }
    if (result.status === 'delivery-failed') {
      const messages = {
        MSG91_NOT_CONFIGURED: {
          status: 503,
          message: 'MSG91 SMS is not configured. Set MSG91_AUTH_KEY and MSG91_TEMPLATE_ID in the backend environment.',
        },
        MSG91_AUTH_FAILED: {
          status: 503,
          message: 'MSG91 authentication failed. Check the MSG91 auth key configured for this backend.',
        },
        MSG91_RATE_LIMITED: {
          status: 503,
          message: 'MSG91 is temporarily rate-limiting requests. Please try again later.',
        },
        MSG91_UNAVAILABLE: {
          status: 502,
          message: 'MSG91 is temporarily unavailable. Please try again later.',
        },
        MSG91_INVALID_MOBILE: {
          status: 502,
          message: 'The registered mobile number could not be submitted to MSG91.',
        },
        MSG91_MALFORMED_RESPONSE: {
          status: 502,
          message: 'MSG91 returned an unexpected response. Please try again later.',
        },
        MSG91_REJECTED: {
          status: 502,
          message: 'MSG91 rejected the OTP request. Check the active template and account configuration.',
        },
      };
      const failure = messages[result.code] || messages.MSG91_UNAVAILABLE;
      return res.status(failure.status).json({ message: failure.message });
    }

    return res.json({
      message: STUDENT_MOBILE_OTP_MESSAGE,
      challengeId: result.challengeId,
      expiresInSeconds: OTP_TTL_MS / 1000,
      resendAfterSeconds: 60,
    });
  });

  studentOtpRouter.post('/verify', verifyLimiter, async (req, res) => {
    const phoneInput = String(req.body?.phone ?? '').trim();
    const challengeId = String(req.body?.challengeId ?? '');
    const code = String(req.body?.code ?? '');
    if (
      !isValidIndianMobile(phoneInput) ||
      !/^[A-Za-z0-9_-]{43}$/.test(challengeId) ||
      code.length === 0 ||
      code.length > 32
    ) {
      return res.status(400).json({ message: 'Enter a valid mobile number and six-digit verification code.' });
    }

    const phone = normalizeMobileOtpPhone(phoneInput);
    let user;
    try {
      user = await findStudent(phone);
    } catch (error) {
      const diagnostic = error?.code || error?.name || 'unknown database error';
      console.error(`Student mobile OTP verification lookup failed (${diagnostic}).`);
      return res.status(503).json({ message: 'Login is temporarily unavailable. Please try again later.' });
    }
    if (!user || user.role !== 'STUDENT' || user.status !== 'ACTIVE') {
      return res.status(401).json({ message: 'Invalid verification code or account.' });
    }

    const result = await service.verify(user, phone, challengeId, code);
    if (result.status === 'verified') return res.json(await createSession(result.user));
    if (result.status === 'expired') {
      return res.status(401).json({ message: 'Verification code expired. Request a new code.' });
    }
    if (result.status === 'too-many-attempts') {
      return res.status(429).json({ message: 'Too many incorrect attempts. Request a new code.' });
    }
    if (result.status === 'incorrect') {
      return res.status(401).json({ message: 'Incorrect verification code.' });
    }
    if (result.status === 'provider-failed') {
      const authFailure = result.code === 'MSG91_AUTH_FAILED' || result.code === 'MSG91_NOT_CONFIGURED';
      return res.status(authFailure ? 503 : 502).json({
        message: authFailure
          ? 'MSG91 verification is not configured correctly. Check the backend MSG91 credentials.'
          : 'MSG91 verification is temporarily unavailable. Please try again later.',
      });
    }
    return res.status(401).json({ message: 'Invalid verification code or account.' });
  });

  return studentOtpRouter;
}

router.use('/student/mobile-otp', createStudentMobileOtpRouter());

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

router.post('/login', async (req, res) => {
  try {
    const { identifier, password, role } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        message: 'Please provide an email, phone, or account ID and password.',
      });
    }

      const user = await findUserByCredentials(identifier);

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

      // Role check if explicitly requested
      if (role && role.toUpperCase() !== user.role) {
        return res.status(403).json({
          message: `Unauthorized portal. This account does not possess ${role.toUpperCase()} privileges.`,
        });
      }

      const isPasswordValid = await bcrypt.compare(password, user.passwordHash).catch(() => false);

    if (!isPasswordValid) {
      return res.status(401).json({
        message: 'Invalid password. Please check your spelling and try again.',
      });
    }

    res.json(await issueSession(user));
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error during authentication.' });
  }
});

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

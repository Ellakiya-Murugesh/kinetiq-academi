import express from 'express';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import {
  findStudentByUserId,
  findUserByCredentials,
  getMongoClient,
  getMongoDatabase,
  normalizeMobile,
} from '../db.js';
import {
  authenticateToken,
  clearSessionCookie,
  issueSessionCookie,
} from '../middleware/auth.js';
import { createEmailNotification } from '../services/emailNotifications.js';

const router = express.Router();

function publicStudentProfile(student) {
  if (!student) return null;
  const profile = Object.fromEntries(
    Object.entries(student).filter(([field]) => !field.startsWith('_') && field !== 'mobileNormalized')
  );
  const required = [
    student.name,
    student.email,
    student.dateOfBirth,
    student.gender,
    student.address,
    student.qualification,
    student.college,
    student.gatePaper ?? student.subject,
    student.gateAttemptYear,
  ];
  return {
    ...profile,
    profileCompleted: Boolean(required.every((value) => String(value ?? '').trim())),
  };
}

async function nextPosition(db, collectionName, session) {
  const last = await db.collection(collectionName)
    .find({}, { session })
    .sort({ _position: -1 })
    .limit(1)
    .next();
  return (last?._position ?? -1) + 1;
}

function sessionResponse(res, user, student) {
  issueSessionCookie(res, user);
  return {
    user: sessionResponseFields(user, student),
    studentProfile: publicStudentProfile(student),
    message: 'Login successful.',
  };
}

function sessionResponseFields(user, student) {
  return {
    id: user.id,
    name: user.name || '',
    email: user.email || '',
    phone: user.phone || user.mobile || '',
    role: user.role,
    studentId: student?.id ?? null,
    profileCompleted: user.role === 'STUDENT' ? Boolean(publicStudentProfile(student)?.profileCompleted) : true,
  };
}

function validateSignup(body) {
  const name = String(body?.fullName ?? '').trim();
  const email = String(body?.email ?? '').trim().toLowerCase();
  const mobile = normalizeMobile(body?.mobile);
  const password = String(body?.password ?? '');
  const confirmPassword = String(body?.confirmPassword ?? '');

  if (!name || name.length > 120) return { error: 'Enter your full name (up to 120 characters).' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'Enter a valid email address.' };
  if (!/^[6-9]\d{9}$/.test(mobile)) return { error: 'Enter a valid 10-digit Indian mobile number.' };
  if (Buffer.byteLength(password, 'utf8') < 8 || Buffer.byteLength(password, 'utf8') > 72) {
    return { error: 'Password must be between 8 and 72 bytes.' };
  }
  if (password !== confirmPassword) return { error: 'The passwords do not match.' };
  return { name, email, mobile, password };
}

async function emailExists(db, email, session) {
  const escapedEmail = email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return Boolean(await db.collection('users').findOne(
    { email: { $regex: `^${escapedEmail}$`, $options: 'i' } },
    { session, projection: { id: 1 } }
  ));
}

router.post('/signup', async (req, res) => {
  const signup = validateSignup(req.body);
  if (signup.error) return res.status(400).json({ success: false, message: signup.error });

  const passwordHash = await bcrypt.hash(signup.password, 12);
  const now = new Date().toISOString();
  const userId = `usr-student-${randomUUID()}`;
  const studentId = `std-${randomUUID()}`;

  const db = getMongoDatabase();
  const client = getMongoClient();
  const session = client.startSession();
  try {
    await session.withTransaction(async () => {
      const [duplicateEmail, duplicateUserMobile, duplicateStudentMobile] = await Promise.all([
        emailExists(db, signup.email, session),
        db.collection('users').findOne({ mobileNormalized: signup.mobile }, { session, projection: { id: 1 } }),
        db.collection('students').findOne({ mobileNormalized: signup.mobile }, { session, projection: { id: 1 } }),
      ]);
      if (duplicateEmail) {
        const error = new Error('An account already exists for that email address. Please sign in.');
        error.status = 409;
        throw error;
      }
      if (duplicateUserMobile || duplicateStudentMobile) {
        const error = new Error(
          'A student record already exists for that mobile number. Sign in if you already have an account, or contact Kinetiq Academi support to link your existing student record.'
        );
        error.status = 409;
        throw error;
      }

      const userPosition = await nextPosition(db, 'users', session);
      const studentPosition = await nextPosition(db, 'students', session);
      const user = {
        id: userId,
        name: signup.name,
        email: signup.email,
        phone: signup.mobile,
        mobile: signup.mobile,
        mobileNormalized: signup.mobile,
        passwordHash,
        role: 'STUDENT',
        status: 'ACTIVE',
        createdAt: now,
        _version: 0,
        _position: userPosition,
      };
      const student = {
        id: studentId,
        userId,
        name: signup.name,
        email: signup.email,
        phone: signup.mobile,
        mobile: signup.mobile,
        mobileNormalized: signup.mobile,
        dateOfBirth: '',
        gender: '',
        address: '',
        qualification: '',
        college: '',
        gatePaper: '',
        gateAttemptYear: '',
        exam: 'GATE',
        subject: '',
        profileCompleted: false,
        createdAt: now,
        updatedAt: now,
        courseId: null,
        courseName: 'Not enrolled',
        enrollmentDate: now.slice(0, 10),
        paymentStatus: 'Pending',
        accountStatus: 'Active',
        progress: 0,
        classesAttended: 0,
        totalClasses: 0,
        materialsAccessed: 0,
        testsCompleted: 0,
        averageScore: 0,
        _version: 0,
        _position: studentPosition,
      };
      await db.collection('users').insertOne(user, { session });
      await db.collection('students').insertOne(student, { session });
      const notification = createEmailNotification({
        type: 'registration',
        idempotencyKey: `registration:${student.id}`,
        student,
        status: 'Registration Successful',
      });
      if (notification) {
        await db.collection('emailNotifications').updateOne(
          { id: notification.id },
          { $setOnInsert: notification },
          { upsert: true, session }
        );
      }
    });
  } catch (error) {
    if (error.status === 409) {
      return res.status(409).json({
        success: false,
        message: error.message,
      });
    }
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'An account or student record already exists with those details. Sign in if you already have an account, or contact Kinetiq Academi support for help.',
      });
    }
    throw error;
  } finally {
    await session.endSession();
  }

  return res.status(201).json({
    success: true,
    message: 'Account created successfully. Please sign in to continue.',
  });
});

router.post('/login', async (req, res) => {
  const identifier = String(req.body?.identifier ?? '').trim();
  const password = String(req.body?.password ?? '');
  const role = String(req.body?.role ?? 'STUDENT').toUpperCase();
  if (!['ADMIN', 'STUDENT'].includes(role)) {
    return res.status(400).json({ message: 'Invalid account type.' });
  }
  if (!identifier || !password) {
    return res.status(400).json({ message: 'Enter your email and password.' });
  }
  if (role === 'STUDENT' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)) {
    return res.status(400).json({ message: 'Enter a valid email address.' });
  }

  const user = await findUserByCredentials(identifier);
  if (!user || user.role !== role || user.status !== 'ACTIVE') {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }
  const validPassword = await bcrypt.compare(password, user.passwordHash || '').catch(() => false);
  if (!validPassword) return res.status(401).json({ message: 'Invalid email or password.' });

  const student = role === 'STUDENT' ? await findStudentByUserId(user.id) : null;
  if (role === 'STUDENT' && !student) {
    return res.status(403).json({ message: 'Student account is unavailable. Contact academy support.' });
  }
  return res.json(sessionResponse(res, user, student));
});

router.post('/logout', (req, res) => {
  clearSessionCookie(res);
  return res.json({ message: 'Logged out successfully.' });
});

router.get('/me', authenticateToken, async (req, res) => {
  const student = req.user.role === 'STUDENT' ? await findStudentByUserId(req.user.id) : null;
  return res.json({
    user: sessionResponseFields(req.user, student),
    studentProfile: publicStudentProfile(student),
  });
});

export default router;

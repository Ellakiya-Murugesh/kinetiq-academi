import express from 'express';
import { randomUUID } from 'node:crypto';
import { getDb, saveDb } from '../db.js';
import { createEmailNotification } from '../services/emailNotifications.js';
import {
  GATE_COURSE_CATALOG_ID,
  GATE_COURSE_FEE,
  ensureGateCourse,
  getGateCourse,
} from '../utils/gateEnrollment.js';

const AVAILABLE_COURSE_CODES = [
  'GATE-CY',
  'GATE-PH',
  'GATE-ME',
  'GATE-CSE',
  'GATE-ECE',
];
const ACTIVE_PAYMENT_STATUSES = new Set([
  'payment pending',
  'pending',
  'payment verification pending',
  'paid',
  'payment verified',
]);

function normalizeStatus(status) {
  return String(status || '').trim().toLowerCase();
}

function createId(prefix, makeId) {
  return `${prefix}-${makeId()}`;
}

function safePayment(payment) {
  return {
    id: payment.id,
    status: payment.status,
    courseId: payment.courseId,
    courseCode: payment.courseCode,
    courseName: payment.courseName,
    amount: payment.amount,
    paymentMethod: payment.paymentMethod,
    date: payment.date,
    paymentDate: payment.paymentDate,
    receiptNumber: payment.receiptNumber,
  };
}

export function createStudentEnrollmentRouter({
  loadDatabase = getDb,
  persistDatabase = saveDb,
  makeId = randomUUID,
  now = () => new Date(),
  makeNotification = createEmailNotification,
} = {}) {
  const router = express.Router();

  router.get('/enrollment/options', (req, res) => {
    const student = req.student;
    const courses = AVAILABLE_COURSE_CODES
      .map((code) => getGateCourse(code))
      .filter(Boolean)
      .map((course) => ({
        id: course.id,
        code: course.code,
        name: course.name,
        courseName: course.courseName,
        subject: course.subject,
        fee: course.fee,
        duration: course.duration,
      }));

    return res.json({
      courseId: GATE_COURSE_CATALOG_ID,
      title: 'GATE 100-Day Online Live Coaching Program',
      exam: 'GATE',
      fee: GATE_COURSE_FEE,
      duration: '100 Days Intensive',
      subjects: courses.map((course) => course.subject),
      courses,
      student: { name: student.name, id: student.id },
    });
  });

  router.post('/enrollments', async (req, res) => {
    const student = req.student;
    const courseCode = String(req.body?.courseCode || '').trim();
    if (req.body?.courseId !== GATE_COURSE_CATALOG_ID) {
      return res.status(400).json({ message: 'Choose a valid GATE course catalog.' });
    }

    const course = AVAILABLE_COURSE_CODES.includes(courseCode)
      ? getGateCourse(courseCode)
      : null;
    if (!course) {
      return res.status(400).json({ message: 'Choose one of the available GATE courses.' });
    }

    const db = await loadDatabase();
    const priorPayments = db.payments.filter((payment) =>
      payment.studentId === student.id &&
      (payment.courseCode === course.code || payment.courseId === course.id)
    );
    const existingPayment = priorPayments.find((payment) =>
      ACTIVE_PAYMENT_STATUSES.has(normalizeStatus(payment.status))
    );
    if (existingPayment) {
      return res.json({
        message: 'An enrollment payment already exists for this GATE course.',
        payment: { id: existingPayment.id },
      });
    }

    const anotherPendingPayment = db.payments.find((payment) =>
      payment.studentId === student.id &&
      ACTIVE_PAYMENT_STATUSES.has(normalizeStatus(payment.status)) &&
      payment.courseCode !== course.code &&
      payment.courseId !== course.id
    );
    if (anotherPendingPayment) {
      return res.status(409).json({
        message: 'Another course enrollment is already awaiting payment verification.',
      });
    }

    ensureGateCourse(db, course);
    const createdAt = now();
    const payment = {
      id: createId('pay', makeId),
      studentId: student.id,
      studentName: student.name,
      studentEmail: student.email,
      courseId: course.id,
      courseCode: course.code,
      courseName: course.courseName,
      exam: course.exam,
      subject: course.subject,
      amount: course.fee,
      paymentMethod: 'UPI',
      date: createdAt.toISOString(),
      status: 'Payment Pending',
    };
    const enrollment = {
      id: createId('enr', makeId),
      studentId: student.id,
      studentName: student.name,
      courseId: course.id,
      courseCode: course.code,
      courseName: course.courseName,
      exam: course.exam,
      subject: course.subject,
      courseFee: course.fee,
      enrollmentDate: createdAt.toISOString().slice(0, 10),
      paymentId: payment.id,
      paymentStatus: 'Payment Pending',
      courseStatus: 'Pending Payment',
    };
    db.payments.unshift(payment);
    db.enrollments.unshift(enrollment);

    const notification = makeNotification({
      type: 'course_enrollment',
      idempotencyKey: `course-enrollment:${enrollment.id}`,
      student,
      enrollment,
      payment,
      status: 'Enrollment Received',
    });
    await persistDatabase(db, { notifications: notification ? [notification] : [] });

    return res.status(201).json({
      message: 'Course enrollment created. Complete payment to request verification.',
      payment: { id: payment.id },
    });
  });

  router.get('/payments/:paymentId', async (req, res) => {
    const db = await loadDatabase();
    const payment = db.payments.find((record) =>
      record.id === req.params.paymentId && record.studentId === req.student.id
    );
    if (!payment) return res.status(404).json({ message: 'Payment not found.' });

    const enrollment = db.enrollments.find((record) =>
      record.paymentId === payment.id ||
      (record.studentId === req.student.id && record.courseId === payment.courseId)
    );
    return res.json({
      payment: safePayment(payment),
      enrollment: enrollment
        ? { enrollmentDate: enrollment.enrollmentDate, courseStatus: enrollment.courseStatus }
        : null,
      student: { name: req.student.name, registrationId: req.student.id },
    });
  });

  router.post('/payments/:paymentId/confirm', async (req, res) => {
    const db = await loadDatabase();
    const payment = db.payments.find((record) =>
      record.id === req.params.paymentId && record.studentId === req.student.id
    );
    if (!payment) return res.status(404).json({ message: 'Payment not found.' });

    const status = normalizeStatus(payment.status);
    if (status === 'payment verification pending') {
      return res.json({ message: 'This payment is already awaiting verification.' });
    }
    if (status === 'paid' || status === 'payment verified') {
      return res.status(409).json({ message: 'This payment has already been verified.' });
    }
    if (!['payment pending', 'pending', 'payment failed', 'failed'].includes(status)) {
      return res.status(409).json({ message: 'This payment cannot be submitted for verification.' });
    }

    payment.status = 'Payment Verification Pending';
    payment.paymentSubmittedAt = now().toISOString();
    payment.paymentSubmissionCount = (payment.paymentSubmissionCount || 0) + 1;
    const enrollment = db.enrollments.find((record) => record.paymentId === payment.id);
    if (enrollment) enrollment.paymentStatus = payment.status;

    const notification = makeNotification({
      type: 'payment_submitted',
      idempotencyKey: `payment-submitted:${payment.id}:${payment.paymentSubmissionCount}`,
      student: req.student,
      enrollment,
      payment,
      status: 'Verification Pending',
    });
    await persistDatabase(db, { notifications: notification ? [notification] : [] });

    return res.json({
      message: 'Payment confirmation submitted for manual verification.',
      payment: { id: payment.id, status: payment.status },
    });
  });

  return router;
}

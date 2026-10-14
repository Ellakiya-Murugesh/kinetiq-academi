import express from 'express';
import { randomUUID } from 'node:crypto';
import { getDb, saveDb } from '../db.js';
import { isSafeMaterialFileUrl } from './studentMaterials.js';
import { requireAdmin } from '../middleware/auth.js';
import { sendPdfDocument } from '../utils/pdf.js';
import { createEmailNotification } from '../services/emailNotifications.js';
import {
  AdminStudentProvisioningError,
  provisionAdminStudent,
} from '../services/adminStudentProvisioning.js';
import { BRAND_NAME } from '../../shared/brand.js';
import { getStudentCourseProgress } from './studentCourse.js';
import { normalizeCoursePayload, normalizeLiveSessionPayload } from '../utils/adminCatalog.js';
import { filterAdminStudents } from '../utils/adminStudentDirectory.js';
import { buildAdminDashboard } from '../utils/adminDashboard.js';

const router = express.Router();

// Allow public submission to enquiries endpoint without admin auth
router.post('/public-enquiry', async (req, res) => {
  const { name, phone, email, exam, subject, message } = req.body;
  if (!name || !phone) {
    return res.status(400).json({ message: 'Name and Phone number are required.' });
  }
  if (email && (
    typeof email !== 'string' ||
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  )) {
    return res.status(400).json({ message: 'Enter a valid email address.' });
  }

  const db = await getDb();
  const newEnquiry = {
    id: `enq-${Date.now()}`,
    name,
    phone,
    email: typeof email === 'string' ? email.trim().toLowerCase() : '',
    exam: exam || 'GATE',
    subject: subject || 'Chemistry',
    message: message || 'Guidance request submitted via website.',
    date: new Date().toISOString().split('T')[0],
    status: 'New',
  };

  db.enquiries.unshift(newEnquiry);
  await saveDb(db);
  res.status(201).json({ message: 'Enquiry submitted successfully.', enquiry: newEnquiry });
});

// All subsequent routes require ADMIN role verification
router.use(requireAdmin);

router.get('/database-report.pdf', async (req, res) => {
  const db = await getDb();
  const sections = Object.entries(db).filter(([, records]) => Array.isArray(records));
  const formatLabel = (value) => value.replace(/([A-Z])/g, ' $1').replace(/^./, (letter) => letter.toUpperCase());
  const reportSections = [{
    title: 'Record Summary',
    items: sections.map(([name, records]) => ({ text: `${formatLabel(name)}: ${records.length}` })),
  }];

  for (const [name, records] of sections) {
    const items = [];

    if (records.length === 0) {
      items.push({ text: 'No records.' });
      reportSections.push({ title: `${formatLabel(name)} (0)`, items });
      continue;
    }

    records.forEach((record, index) => {
      const heading = record.name || record.title || record.id || `Record ${index + 1}`;
      items.push({ text: `${index + 1}. ${heading}`, bold: true });

      for (const [field, value] of Object.entries(record)) {
        const safeValue = /password|token|secret|hash/i.test(field)
          ? '[REDACTED]'
          : value !== null && typeof value === 'object' ? JSON.stringify(value) : String(value ?? '-');
        items.push({ text: `${formatLabel(field)}: ${safeValue}`, indent: 12 });
      }
    });
    reportSections.push({ title: `${formatLabel(name)} (${records.length})`, items });
  }

  sendPdfDocument(res, {
    filename: `${BRAND_NAME.toLowerCase().replace(/\s+/g, '-')}-database-report.pdf`,
    title: `${BRAND_NAME} Database Report`,
    subtitle: `Generated ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`,
    sections: reportSections,
  });
});

/* ==================== 1. DASHBOARD & ANALYTICS ==================== */
router.get('/dashboard', async (req, res) => {
  const db = await getDb();
  res.json(buildAdminDashboard(db));
});

/* ==================== 2. STUDENTS ==================== */
router.get('/students', async (req, res) => {
  const db = await getDb();
  const result = filterAdminStudents(db, req.query);

  res.json(result.map((student) => {
    const courseId = student.courseId ||
      (Array.isArray(db.enrollments) ? db.enrollments : [])
        .find((enrollment) => enrollment.studentId === student.id)?.courseId;
    const course = (Array.isArray(db.courses) ? db.courses : [])
      .find((record) => record.id === courseId);
    return {
      ...student,
      progress: course ? getStudentCourseProgress(db, student, course).overallProgress : 0,
    };
  }));
});

router.get('/students/:id', async (req, res) => {
  const db = await getDb();
  const student = db.students.find((s) => s.id === req.params.id);

  if (!student) {
    return res.status(404).json({ message: 'Student profile not found.' });
  }

  const user = db.users.find((u) => u.id === student.userId);
  const enrollment = db.enrollments.find((e) => e.studentId === student.id);
  const payments = db.payments.filter((p) => p.studentId === student.id);
  const testResults = db.results.filter((r) => r.studentId === student.id);
  const refund = (db.refunds || []).find((r) => r.studentId === student.id);
  const courseId = student.courseId ||
    db.enrollments.find((record) => record.studentId === student.id)?.courseId;
  const course = db.courses.find((record) => record.id === courseId);
  const studentWithProgress = {
    ...student,
    progress: course ? getStudentCourseProgress(db, student, course).overallProgress : 0,
  };

  res.json({
    student: studentWithProgress,
    user,
    enrollment,
    payments,
    testResults,
    refund,
  });
});

router.post('/students', async (req, res) => {
  const db = await getDb();
  let newStudent;
  try {
    newStudent = await provisionAdminStudent(db, req.body);
  } catch (error) {
    if (error instanceof AdminStudentProvisioningError) {
      return res.status(error.status).json({ message: error.message });
    }
    throw error;
  }
  await saveDb(db);

  res.status(201).json(newStudent);
});

router.put('/students/:id', async (req, res) => {
  const db = await getDb();
  const index = db.students.findIndex((s) => s.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ message: 'Student not found.' });
  }

  db.students[index] = { ...db.students[index], ...req.body };
  await saveDb(db);
  res.json(db.students[index]);
});

router.delete('/students/:id', async (req, res) => {
  const db = await getDb();
  const student = db.students.find((s) => s.id === req.params.id);

  if (!student) {
    return res.status(404).json({ message: 'Student not found.' });
  }

  db.students = db.students.filter((s) => s.id !== req.params.id);
  db.users = db.users.filter((u) => u.id !== student.userId);
  await saveDb(db);
  res.json({ message: 'Student account deleted successfully.' });
});

/* ==================== 3. COURSES ==================== */
router.get('/courses', async (req, res) => {
  const db = await getDb();
  const enrollments = Array.isArray(db.enrollments) ? db.enrollments : [];
  const students = Array.isArray(db.students) ? db.students : [];
  res.json((Array.isArray(db.courses) ? db.courses : []).map((course) => ({
    ...course,
    enrolledCount: new Set([
      ...enrollments.filter((enrollment) => enrollment.courseId === course.id).map((record) => record.studentId),
      ...students.filter((student) => student.courseId === course.id).map((student) => student.id),
    ]).size,
    modules: Array.isArray(course.modules) ? course.modules : [],
  })));
});

router.post('/courses', async (req, res) => {
  const db = await getDb();
  const result = normalizeCoursePayload(req.body);
  if (result.error) return res.status(400).json({ message: result.error });
  const newCourse = {
    id: `crs-${randomUUID()}`,
    ...result.course,
    enrolledCount: 0,
  };

  db.courses.push(newCourse);
  await saveDb(db);
  res.status(201).json(newCourse);
});

router.put('/courses/:id', async (req, res) => {
  const db = await getDb();
  const idx = db.courses.findIndex((c) => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Course not found.' });

  const result = normalizeCoursePayload(req.body, db.courses[idx]);
  if (result.error) return res.status(400).json({ message: result.error });
  db.courses[idx] = { ...result.course, id: db.courses[idx].id };
  await saveDb(db);
  res.json(db.courses[idx]);
});

router.delete('/courses/:id', async (req, res) => {
  const db = await getDb();
  if (!db.courses.some((course) => course.id === req.params.id)) {
    return res.status(404).json({ message: 'Course not found.' });
  }
  const hasEnrollment = (Array.isArray(db.enrollments) ? db.enrollments : [])
    .some((enrollment) => enrollment.courseId === req.params.id);
  const hasStudent = (Array.isArray(db.students) ? db.students : [])
    .some((student) => student.courseId === req.params.id);
  if (hasEnrollment || hasStudent) {
    return res.status(409).json({ message: 'This course has student records and cannot be deleted. Unpublish it instead.' });
  }
  db.courses = db.courses.filter((c) => c.id !== req.params.id);
  await saveDb(db);
  res.json({ message: 'Course deleted successfully.' });
});

/* ==================== 4. ENROLLMENTS ==================== */
router.get('/enrollments', async (req, res) => {
  const db = await getDb();
  res.json(db.enrollments);
});

router.put('/enrollments/:id', async (req, res) => {
  const db = await getDb();
  const idx = db.enrollments.findIndex((e) => e.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Enrollment not found.' });

  db.enrollments[idx] = { ...db.enrollments[idx], ...req.body };
  await saveDb(db);
  res.json(db.enrollments[idx]);
});

/* ==================== 5. PAYMENTS ==================== */
router.get('/payments', async (req, res) => {
  const db = await getDb();
  res.json(db.payments);
});

router.get('/payments/:id/receipt.pdf', async (req, res) => {
  const db = await getDb();
  const payment = db.payments.find((record) => record.id === req.params.id);
  if (!payment) return res.status(404).json({ message: 'Payment not found.' });
  if (payment.status !== 'Paid') {
    return res.status(409).json({ message: 'A receipt is available only after payment is confirmed.' });
  }

  const receiptNumber = payment.receiptNumber || `REC-${payment.id.toUpperCase()}`;
  sendPdfDocument(res, {
    filename: `${receiptNumber}.pdf`,
    title: `${BRAND_NAME} Payment Receipt`,
    subtitle: `Receipt ${receiptNumber}`,
    sections: [{
      title: 'Payment Details',
      items: [
        { text: `Transaction ID: ${payment.transactionId}` },
        { text: `Student: ${payment.studentName}` },
        { text: `Course: ${payment.courseName}` },
        { text: `Amount Paid: INR ${Number(payment.amount).toLocaleString('en-IN')}` },
        { text: `Payment Method: ${payment.paymentMethod}` },
        { text: `Payment Date: ${payment.date}` },
        { text: 'Status: Paid' },
        { text: 'This is a computer-generated payment receipt.' },
      ],
    }],
  });
});

router.put('/payments/:id', async (req, res) => {
  const db = await getDb();
  const payment = db.payments.find((record) => record.id === req.params.id);
  if (!payment) return res.status(404).json({ message: 'Payment not found.' });

  const { status } = req.body;
  if (!['Paid', 'Pending', 'Failed', 'Refunded'].includes(status)) {
    return res.status(400).json({ message: 'Invalid payment status.' });
  }

  const wasVerified = ['Paid', 'Payment Verified'].includes(payment.status);
  payment.status = status;
  const notifications = [];

  if (status === 'Paid') {
    payment.receiptNumber = payment.receiptNumber || `REC-${payment.id.toUpperCase()}`;
    payment.receiptIssuedAt = payment.receiptIssuedAt || new Date().toISOString();
    payment.paymentDate = payment.paymentDate || new Date().toISOString();

    const student = db.students.find((record) => record.id === payment.studentId);
    if (student) {
      student.paymentStatus = 'Paid';
      const course = db.courses.find((record) => record.id === payment.courseId) ||
        db.courses.find((record) => record.id === student.courseId);
      const courseId = course?.id || payment.courseId || student.courseId;
      if (payment.courseCode) student.courseCode = payment.courseCode;
      if (payment.courseName) student.courseName = payment.courseName;
      if (payment.subject) student.subject = payment.subject;
      if (payment.exam) student.exam = payment.exam;
      if (courseId) student.courseId = courseId;
      let enrollment = db.enrollments.find((record) => record.paymentId === payment.id) ||
        db.enrollments.find((record) => record.studentId === student.id && record.courseId === courseId);
      const alreadyActive = enrollment?.courseStatus === 'Active' &&
        ['Paid', 'Payment Verified'].includes(enrollment.paymentStatus);

      if (!enrollment) {
        enrollment = {
          id: `enr-${Date.now()}-${payment.id}`,
          studentId: student.id,
          studentName: student.name,
          courseId,
          courseCode: payment.courseCode || student.courseCode,
          courseName: payment.courseName,
          exam: payment.exam || student.exam,
          subject: payment.subject || student.subject,
          enrollmentDate: new Date().toISOString().split('T')[0],
          paymentId: payment.id,
          paymentStatus: 'Paid',
          courseStatus: 'Active',
        };
        db.enrollments.push(enrollment);
      } else {
        enrollment.paymentStatus = 'Paid';
        enrollment.courseStatus = 'Active';
      }
      if (course && !alreadyActive) course.enrolledCount = (course.enrolledCount || 0) + 1;

      if (!wasVerified) {
        const notification = createEmailNotification({
          type: 'payment_verified',
          idempotencyKey: `payment-verified:${payment.id}`,
          student,
          enrollment,
          payment,
          status: 'Payment Verified',
        });
        if (notification) notifications.push(notification);
      }
    }
  } else if (status === 'Failed') {
    const enrollment = db.enrollments.find((record) => record.paymentId === payment.id);
    if (enrollment && enrollment.courseStatus !== 'Active') {
      enrollment.paymentStatus = 'Payment Failed';
      enrollment.courseStatus = 'Pending Payment';
    }
  }

  await saveDb(db, { notifications });
  res.json(payment);
});

/* ==================== 6. LIVE SESSIONS ==================== */
router.get('/live-sessions', async (req, res) => {
  const db = await getDb();
  res.json(Array.isArray(db.liveSessions) ? db.liveSessions : []);
});

router.post('/live-sessions', async (req, res) => {
  const db = await getDb();
  const result = normalizeLiveSessionPayload(req.body, Array.isArray(db.courses) ? db.courses : []);
  if (result.error) return res.status(400).json({ message: result.error });
  const newSession = {
    id: `ls-${randomUUID()}`,
    ...result.session,
  };

  db.liveSessions.push(newSession);
  await saveDb(db);
  res.status(201).json(newSession);
});

router.put('/live-sessions/:id', async (req, res) => {
  const db = await getDb();
  const idx = db.liveSessions.findIndex((s) => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Live session not found.' });

  const result = normalizeLiveSessionPayload(
    req.body,
    Array.isArray(db.courses) ? db.courses : [],
    db.liveSessions[idx],
  );
  if (result.error) return res.status(400).json({ message: result.error });
  db.liveSessions[idx] = { ...result.session, id: db.liveSessions[idx].id };
  await saveDb(db);
  res.json(db.liveSessions[idx]);
});

router.delete('/live-sessions/:id', async (req, res) => {
  const db = await getDb();
  db.liveSessions = db.liveSessions.filter((s) => s.id !== req.params.id);
  await saveDb(db);
  res.json({ message: 'Live session deleted.' });
});

/* ==================== 7. MATERIALS ==================== */
router.get('/materials', async (req, res) => {
  const db = await getDb();
  res.json(db.materials);
});

router.post('/materials', async (req, res) => {
  const db = await getDb();
  if (!isSafeMaterialFileUrl(req.body.fileUrl)) {
    return res.status(400).json({ message: 'Provide a valid HTTPS or site-relative study material file URL.' });
  }
  const newMaterial = {
    id: `mat-${Date.now()}`,
    title: req.body.title,
    exam: req.body.exam,
    subject: req.body.subject,
    category: req.body.category || 'Study Notes',
    description: req.body.description,
    fileUrl: req.body.fileUrl.trim(),
    fileSize: req.body.fileSize || '3.5 MB',
    pages: Number(req.body.pages) || 25,
    accessLevel: req.body.accessLevel || 'Enrolled Students Only',
    status: req.body.status || 'Published',
    createdAt: new Date().toISOString().split('T')[0],
  };

  db.materials.push(newMaterial);
  await saveDb(db);
  res.status(201).json(newMaterial);
});

router.put('/materials/:id', async (req, res) => {
  const db = await getDb();
  const idx = db.materials.findIndex((m) => m.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Material not found.' });
  if ('fileUrl' in req.body && !isSafeMaterialFileUrl(req.body.fileUrl)) {
    return res.status(400).json({ message: 'Provide a valid HTTPS or site-relative study material file URL.' });
  }

  db.materials[idx] = { ...db.materials[idx], ...req.body };
  await saveDb(db);
  res.json(db.materials[idx]);
});

router.delete('/materials/:id', async (req, res) => {
  const db = await getDb();
  db.materials = db.materials.filter((m) => m.id !== req.params.id);
  await saveDb(db);
  res.json({ message: 'Material deleted.' });
});

/* ==================== 8. TESTS ==================== */
router.get('/tests', async (req, res) => {
  const db = await getDb();
  res.json(db.tests);
});

router.post('/tests', async (req, res) => {
  const db = await getDb();
  const questions = req.body.questions;
  if (!req.body.name?.trim()) {
    return res.status(400).json({ message: 'Test title is required.' });
  }
  if (!Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({ message: 'Add at least one question before creating a test.' });
  }

  const invalidQuestion = questions.some((question) =>
    !String(question.text || '').trim() ||
    !Array.isArray(question.options) ||
    question.options.length !== 4 ||
    question.options.some((option) => !String(option).trim()) ||
    !Number.isInteger(Number(question.correctOption)) ||
    Number(question.correctOption) < 0 || Number(question.correctOption) > 3 ||
    Number(question.marks) <= 0
  );
  if (invalidQuestion) {
    return res.status(400).json({ message: 'Each question needs text, four options, a correct answer, and positive marks.' });
  }

  const normalizedQuestions = questions.map((question, index) => ({
    id: question.id || `q-${index + 1}`,
    text: String(question.text).trim(),
    options: question.options.map((option) => String(option).trim()),
    correctOption: Number(question.correctOption),
    marks: Number(question.marks),
    negativeMarks: Math.max(0, Number(question.negativeMarks) || 0),
    explanation: String(question.explanation || '').trim(),
  }));
  const newTest = {
    id: `tst-${Date.now()}`,
    name: req.body.name.trim(),
    exam: req.body.exam,
    subject: req.body.subject,
    duration: Number(req.body.duration) || 60,
    totalQuestions: normalizedQuestions.length,
    totalMarks: normalizedQuestions.reduce((total, question) => total + question.marks, 0),
    negativeMarking: Number(req.body.negativeMarking) || 0.33,
    startDate: req.body.startDate || new Date().toISOString().split('T')[0],
    endDate: req.body.endDate || '2026-11-30',
    status: req.body.status || 'Draft',
    questions: normalizedQuestions,
  };

  db.tests.push(newTest);
  await saveDb(db);
  res.status(201).json(newTest);
});

router.put('/tests/:id', async (req, res) => {
  const db = await getDb();
  const idx = db.tests.findIndex((t) => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Test not found.' });

  let updates = { ...req.body };
  if (Object.hasOwn(req.body, 'questions')) {
    const questions = req.body.questions;
    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ message: 'A test must contain at least one question.' });
    }
    const invalidQuestion = questions.some((question) =>
      !String(question.text || '').trim() ||
      !Array.isArray(question.options) ||
      question.options.length !== 4 ||
      question.options.some((option) => !String(option).trim()) ||
      !Number.isInteger(Number(question.correctOption)) ||
      Number(question.correctOption) < 0 || Number(question.correctOption) > 3 ||
      Number(question.marks) <= 0
    );
    if (invalidQuestion) {
      return res.status(400).json({ message: 'Each question needs text, four options, a correct answer, and positive marks.' });
    }
    updates.questions = questions.map((question, index) => ({
      id: question.id || `q-${index + 1}`,
      text: String(question.text).trim(),
      options: question.options.map((option) => String(option).trim()),
      correctOption: Number(question.correctOption),
      marks: Number(question.marks),
      negativeMarks: Math.max(0, Number(question.negativeMarks) || 0),
      explanation: String(question.explanation || '').trim(),
    }));
    updates.totalQuestions = updates.questions.length;
    updates.totalMarks = updates.questions.reduce((total, question) => total + question.marks, 0);
  }
  db.tests[idx] = { ...db.tests[idx], ...updates };
  await saveDb(db);
  res.json(db.tests[idx]);
});

router.delete('/tests/:id', async (req, res) => {
  const db = await getDb();
  db.tests = db.tests.filter((t) => t.id !== req.params.id);
  await saveDb(db);
  res.json({ message: 'Test deleted.' });
});

/* ==================== 9. RESULTS ==================== */
router.get('/results', async (req, res) => {
  const db = await getDb();
  res.json(db.results);
});

/* ==================== 10. REFUNDS ==================== */
router.get('/refunds', async (req, res) => {
  const db = await getDb();
  res.json(db.refunds || []);
});

router.put('/refunds/:id', async (req, res) => {
  const db = await getDb();
  const refunds = db.refunds || [];
  const idx = refunds.findIndex((r) => r.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Refund request not found.' });

  db.refunds[idx] = { ...db.refunds[idx], ...req.body };

  // Sync with student refundStatus
  const student = db.students.find((s) => s.id === db.refunds[idx].studentId);
  if (student) {
    student.refundStatus = req.body.status || student.refundStatus;
  }

  await saveDb(db);
  res.json(db.refunds[idx]);
});

/* ==================== 11. ENQUIRIES ==================== */
router.get('/enquiries', async (req, res) => {
  const db = await getDb();
  res.json(db.enquiries);
});

router.put('/enquiries/:id', async (req, res) => {
  const db = await getDb();
  const idx = db.enquiries.findIndex((e) => e.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Enquiry not found.' });

  db.enquiries[idx] = { ...db.enquiries[idx], ...req.body };
  await saveDb(db);
  res.json(db.enquiries[idx]);
});

/* ==================== 12. ANNOUNCEMENTS ==================== */
router.get('/announcements', async (req, res) => {
  const db = await getDb();
  res.json(db.announcements);
});

router.post('/announcements', async (req, res) => {
  const db = await getDb();
  const newAnc = {
    id: `anc-${Date.now()}`,
    title: req.body.title,
    message: req.body.message,
    audience: req.body.audience || 'All students',
    publishDate: new Date().toISOString().split('T')[0],
    status: 'Active',
  };

  db.announcements.unshift(newAnc);
  await saveDb(db);
  res.status(201).json(newAnc);
});

router.delete('/announcements/:id', async (req, res) => {
  const db = await getDb();
  db.announcements = db.announcements.filter((a) => a.id !== req.params.id);
  await saveDb(db);
  res.json({ message: 'Announcement deleted.' });
});

export default router;

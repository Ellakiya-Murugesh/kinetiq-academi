import express from 'express';
import { getDb, saveDb } from '../db.js';
import { isSafeMaterialFileUrl } from './studentMaterials.js';
import { requireAdmin } from '../middleware/auth.js';
import { sendPdfDocument } from '../utils/pdf.js';
import { BRAND_NAME } from '../../shared/brand.js';

const router = express.Router();

// Allow public submission to enquiries endpoint without admin auth
router.post('/public-enquiry', (req, res) => {
  const { name, phone, exam, subject, message } = req.body;
  if (!name || !phone) {
    return res.status(400).json({ message: 'Name and Phone number are required.' });
  }

  const db = getDb();
  const newEnquiry = {
    id: `enq-${Date.now()}`,
    name,
    phone,
    exam: exam || 'GATE',
    subject: subject || 'Chemistry',
    message: message || 'Guidance request submitted via website.',
    date: new Date().toISOString().split('T')[0],
    status: 'New',
  };

  db.enquiries.unshift(newEnquiry);
  saveDb(db);
  res.status(201).json({ message: 'Enquiry submitted successfully.', enquiry: newEnquiry });
});

// All subsequent routes require ADMIN role verification
router.use(requireAdmin);

router.get('/database-report.pdf', (req, res) => {
  const db = getDb();
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
router.get('/dashboard', (req, res) => {
  const months = ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];
  const monthlyEnrollments = [
    ...months.map((month) => ({ month, enrollments: 0 })),
  ];

  const monthlyRevenue = [
    ...months.map((month) => ({ month, revenue: 0 })),
  ];

  const examWise = [
    { name: 'GATE', count: 0 },
    { name: 'CSIR NET', count: 0 },
    { name: 'UGC NET', count: 0 },
  ];

  const subjectWise = [
    { name: 'Chemistry', count: 0 },
    { name: 'Physics', count: 0 },
  ];

  const courseProgress = [
    { name: 'On Track (>60%)', value: 0 },
    { name: 'Moderate (30-60%)', value: 0 },
    { name: 'Needs Attention (<30%)', value: 0 },
  ];

  res.json({
    stats: {
      totalStudents: 0,
      activeEnrollments: 0,
      totalRevenue: 0,
      pendingPayments: 0,
      refundRequests: 0,
      guidanceEnquiries: 0,
      upcomingLiveClasses: 0,
    },
    analytics: {
      monthlyEnrollments,
      monthlyRevenue,
      examWise,
      subjectWise,
      courseProgress,
    },
  });
});

/* ==================== 2. STUDENTS ==================== */
router.get('/students', (req, res) => {
  const db = getDb();
  let result = [...db.students];

  const { search, exam, subject, paymentStatus, accountStatus } = req.query;

  if (search) {
    const q = search.toLowerCase();
    result = result.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.phone.includes(q) ||
        s.id.toLowerCase().includes(q)
    );
  }

  if (exam && exam !== 'All') {
    result = result.filter((s) => s.exam === exam);
  }

  if (subject && subject !== 'All') {
    result = result.filter((s) => s.subject === subject);
  }

  if (paymentStatus && paymentStatus !== 'All') {
    result = result.filter((s) => s.paymentStatus === paymentStatus);
  }

  if (accountStatus && accountStatus !== 'All') {
    result = result.filter((s) => s.accountStatus === accountStatus);
  }

  res.json(result);
});

router.get('/students/:id', (req, res) => {
  const db = getDb();
  const student = db.students.find((s) => s.id === req.params.id);

  if (!student) {
    return res.status(404).json({ message: 'Student profile not found.' });
  }

  const user = db.users.find((u) => u.id === student.userId);
  const enrollment = db.enrollments.find((e) => e.studentId === student.id);
  const payments = db.payments.filter((p) => p.studentId === student.id);
  const testResults = db.results.filter((r) => r.studentId === student.id);
  const refund = db.refunds.find((r) => r.studentId === student.id);

  res.json({
    student,
    user,
    enrollment,
    payments,
    testResults,
    refund,
  });
});

router.post('/students', (req, res) => {
  const db = getDb();
  const { name, email, phone, exam, subject, courseId } = req.body;

  if (!name || !email || !phone) {
    return res.status(400).json({ message: 'Name, email and phone are required.' });
  }

  const newUserId = `usr-student-${Date.now()}`;
  const newStudentId = `std-${Math.floor(1000 + Math.random() * 9000)}`;

  const newUser = {
    id: newUserId,
    email,
    phone,
    passwordHash: '$2a$10$fVpA35rE1nK0bFj2ZtS0uOH8V8X.j4.9M8wzW8sT3A8s5yP1.1z7a', // Learner@2026
    name,
    role: 'STUDENT',
    createdAt: new Date().toISOString(),
    status: 'ACTIVE',
  };

  const newStudent = {
    id: newStudentId,
    userId: newUserId,
    name,
    email,
    phone,
    exam: exam || 'GATE',
    subject: subject || 'Chemistry',
    courseId: courseId || 'crs-gate-ch-100',
    courseName: `${exam || 'GATE'} ${subject || 'Chemistry'} — 100 Day Program`,
    enrollmentDate: new Date().toISOString().split('T')[0],
    paymentStatus: 'Paid',
    accountStatus: 'Active',
    progress: 0,
    classesAttended: 0,
    totalClasses: 40,
    materialsAccessed: 0,
    testsCompleted: 0,
    averageScore: 0,
    refundEligible: false,
    refundStatus: 'Not Eligible Yet',
  };

  db.users.push(newUser);
  db.students.unshift(newStudent);
  saveDb(db);

  res.status(201).json(newStudent);
});

router.put('/students/:id', (req, res) => {
  const db = getDb();
  const index = db.students.findIndex((s) => s.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ message: 'Student not found.' });
  }

  db.students[index] = { ...db.students[index], ...req.body };
  saveDb(db);
  res.json(db.students[index]);
});

router.delete('/students/:id', (req, res) => {
  const db = getDb();
  const student = db.students.find((s) => s.id === req.params.id);

  if (!student) {
    return res.status(404).json({ message: 'Student not found.' });
  }

  db.students = db.students.filter((s) => s.id !== req.params.id);
  db.users = db.users.filter((u) => u.id !== student.userId);
  saveDb(db);
  res.json({ message: 'Student account deleted successfully.' });
});

/* ==================== 3. COURSES ==================== */
router.get('/courses', (req, res) => {
  const db = getDb();
  res.json(db.courses);
});

router.post('/courses', (req, res) => {
  const db = getDb();
  const newCourse = {
    id: `crs-${Date.now()}`,
    name: req.body.name,
    exam: req.body.exam,
    subject: req.body.subject,
    description: req.body.description,
    duration: req.body.duration || '100 Days Intensive',
    startDate: req.body.startDate || '2026-11-01',
    fee: Number(req.body.fee) || 10000,
    refundAmount: Number(req.body.refundAmount) || 2000,
    status: req.body.status || 'Published',
    enrolledCount: 0,
  };

  db.courses.push(newCourse);
  saveDb(db);
  res.status(201).json(newCourse);
});

router.put('/courses/:id', (req, res) => {
  const db = getDb();
  const idx = db.courses.findIndex((c) => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Course not found.' });

  db.courses[idx] = { ...db.courses[idx], ...req.body };
  saveDb(db);
  res.json(db.courses[idx]);
});

router.delete('/courses/:id', (req, res) => {
  const db = getDb();
  db.courses = db.courses.filter((c) => c.id !== req.params.id);
  saveDb(db);
  res.json({ message: 'Course deleted successfully.' });
});

/* ==================== 4. ENROLLMENTS ==================== */
router.get('/enrollments', (req, res) => {
  const db = getDb();
  res.json(db.enrollments);
});

router.put('/enrollments/:id', (req, res) => {
  const db = getDb();
  const idx = db.enrollments.findIndex((e) => e.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Enrollment not found.' });

  db.enrollments[idx] = { ...db.enrollments[idx], ...req.body };
  saveDb(db);
  res.json(db.enrollments[idx]);
});

/* ==================== 5. PAYMENTS ==================== */
router.get('/payments', (req, res) => {
  const db = getDb();
  res.json(db.payments);
});

router.get('/payments/:id/receipt.pdf', (req, res) => {
  const db = getDb();
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

router.put('/payments/:id', (req, res) => {
  const db = getDb();
  const payment = db.payments.find((record) => record.id === req.params.id);
  if (!payment) return res.status(404).json({ message: 'Payment not found.' });

  const { status } = req.body;
  if (!['Paid', 'Pending', 'Failed', 'Refunded'].includes(status)) {
    return res.status(400).json({ message: 'Invalid payment status.' });
  }

  payment.status = status;

  if (status === 'Paid') {
    payment.receiptNumber = payment.receiptNumber || `REC-${payment.id.toUpperCase()}`;
    payment.receiptIssuedAt = payment.receiptIssuedAt || new Date().toISOString();

    const student = db.students.find((record) => record.id === payment.studentId);
    if (student) {
      student.paymentStatus = 'Paid';
      const course = db.courses.find((record) => record.id === student.courseId);
      const courseId = course?.id || student.courseId;
      let enrollment = db.enrollments.find(
        (record) => record.studentId === student.id && record.courseId === courseId
      );

      if (!enrollment) {
        enrollment = {
          id: `enr-${Date.now()}-${payment.id}`,
          studentId: student.id,
          studentName: student.name,
          courseId,
          courseName: payment.courseName,
          exam: student.exam,
          subject: student.subject,
          enrollmentDate: new Date().toISOString().split('T')[0],
          paymentStatus: 'Paid',
          courseStatus: 'Active',
        };
        db.enrollments.push(enrollment);
        if (course) course.enrolledCount = (course.enrolledCount || 0) + 1;
      } else {
        enrollment.paymentStatus = 'Paid';
        enrollment.courseStatus = 'Active';
      }
    }
  }

  saveDb(db);
  res.json(payment);
});

/* ==================== 6. LIVE SESSIONS ==================== */
router.get('/live-sessions', (req, res) => {
  const db = getDb();
  res.json(db.liveSessions);
});

router.post('/live-sessions', (req, res) => {
  const db = getDb();
  const newSession = {
    id: `ls-${Date.now()}`,
    title: req.body.title,
    exam: req.body.exam,
    subject: req.body.subject,
    faculty: req.body.faculty || '[FACULTY NAME]',
    date: req.body.date,
    startTime: req.body.startTime,
    endTime: req.body.endTime,
    meetingLink: req.body.meetingLink || '[LIVE CLASS LINK]',
    description: req.body.description,
    status: req.body.status || 'Published',
  };

  db.liveSessions.push(newSession);
  saveDb(db);
  res.status(201).json(newSession);
});

router.put('/live-sessions/:id', (req, res) => {
  const db = getDb();
  const idx = db.liveSessions.findIndex((s) => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Live session not found.' });

  db.liveSessions[idx] = { ...db.liveSessions[idx], ...req.body };
  saveDb(db);
  res.json(db.liveSessions[idx]);
});

router.delete('/live-sessions/:id', (req, res) => {
  const db = getDb();
  db.liveSessions = db.liveSessions.filter((s) => s.id !== req.params.id);
  saveDb(db);
  res.json({ message: 'Live session deleted.' });
});

/* ==================== 7. MATERIALS ==================== */
router.get('/materials', (req, res) => {
  const db = getDb();
  res.json(db.materials);
});

router.post('/materials', (req, res) => {
  const db = getDb();
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
  saveDb(db);
  res.status(201).json(newMaterial);
});

router.put('/materials/:id', (req, res) => {
  const db = getDb();
  const idx = db.materials.findIndex((m) => m.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Material not found.' });
  if ('fileUrl' in req.body && !isSafeMaterialFileUrl(req.body.fileUrl)) {
    return res.status(400).json({ message: 'Provide a valid HTTPS or site-relative study material file URL.' });
  }

  db.materials[idx] = { ...db.materials[idx], ...req.body };
  saveDb(db);
  res.json(db.materials[idx]);
});

router.delete('/materials/:id', (req, res) => {
  const db = getDb();
  db.materials = db.materials.filter((m) => m.id !== req.params.id);
  saveDb(db);
  res.json({ message: 'Material deleted.' });
});

/* ==================== 8. TESTS ==================== */
router.get('/tests', (req, res) => {
  const db = getDb();
  res.json(db.tests);
});

router.post('/tests', (req, res) => {
  const db = getDb();
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
  saveDb(db);
  res.status(201).json(newTest);
});

router.put('/tests/:id', (req, res) => {
  const db = getDb();
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
  saveDb(db);
  res.json(db.tests[idx]);
});

router.delete('/tests/:id', (req, res) => {
  const db = getDb();
  db.tests = db.tests.filter((t) => t.id !== req.params.id);
  saveDb(db);
  res.json({ message: 'Test deleted.' });
});

/* ==================== 9. RESULTS ==================== */
router.get('/results', (req, res) => {
  const db = getDb();
  res.json(db.results);
});

/* ==================== 10. REFUNDS ==================== */
router.get('/refunds', (req, res) => {
  const db = getDb();
  res.json(db.refunds);
});

router.put('/refunds/:id', (req, res) => {
  const db = getDb();
  const idx = db.refunds.findIndex((r) => r.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Refund request not found.' });

  db.refunds[idx] = { ...db.refunds[idx], ...req.body };

  // Sync with student refundStatus
  const student = db.students.find((s) => s.id === db.refunds[idx].studentId);
  if (student) {
    student.refundStatus = req.body.status || student.refundStatus;
  }

  saveDb(db);
  res.json(db.refunds[idx]);
});

/* ==================== 11. ENQUIRIES ==================== */
router.get('/enquiries', (req, res) => {
  const db = getDb();
  res.json(db.enquiries);
});

router.put('/enquiries/:id', (req, res) => {
  const db = getDb();
  const idx = db.enquiries.findIndex((e) => e.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Enquiry not found.' });

  db.enquiries[idx] = { ...db.enquiries[idx], ...req.body };
  saveDb(db);
  res.json(db.enquiries[idx]);
});

/* ==================== 12. ANNOUNCEMENTS ==================== */
router.get('/announcements', (req, res) => {
  const db = getDb();
  res.json(db.announcements);
});

router.post('/announcements', (req, res) => {
  const db = getDb();
  const newAnc = {
    id: `anc-${Date.now()}`,
    title: req.body.title,
    message: req.body.message,
    audience: req.body.audience || 'All students',
    publishDate: new Date().toISOString().split('T')[0],
    status: 'Active',
  };

  db.announcements.unshift(newAnc);
  saveDb(db);
  res.status(201).json(newAnc);
});

router.delete('/announcements/:id', (req, res) => {
  const db = getDb();
  db.announcements = db.announcements.filter((a) => a.id !== req.params.id);
  saveDb(db);
  res.json({ message: 'Announcement deleted.' });
});

export default router;

import express from 'express';
import bcrypt from 'bcryptjs';
import { getDb, saveDb } from '../db.js';
import { requireStudent } from '../middleware/auth.js';
import { createStudentProfileRouter } from './studentProfile.js';
import { createStudentDashboardRouter } from './studentDashboard.js';
import { createStudentMaterialsRouter } from './studentMaterials.js';
import { createStudentEnrollmentRouter } from './studentEnrollment.js';
import { createStudentCourseRouter } from './studentCourse.js';
import { sendPdfDocument } from '../utils/pdf.js';
import { BRAND_NAME } from '../../shared/brand.js';

const router = express.Router();

router.use('/profile', createStudentProfileRouter());
router.use(requireStudent);
router.use(createStudentEnrollmentRouter());
router.use(createStudentDashboardRouter());
router.use(createStudentMaterialsRouter());
router.use(createStudentCourseRouter());

// Helper to get active student for request
function getStudentForUser(req) {
  return req.student;
}

/* ==================== 2. PROFILE & PASSWORD ==================== */
router.put('/change-password', async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ message: 'New password must be at least 6 characters.' });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ message: 'New passwords do not match.' });
  }

  const db = await getDb();
  const user = db.users.find((u) => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }

  const valid = await bcrypt.compare(currentPassword, user.passwordHash).catch(() => false);

  if (!valid) {
    return res.status(400).json({ message: 'Current password incorrect.' });
  }

  const salt = await bcrypt.genSalt(10);
  user.passwordHash = await bcrypt.hash(newPassword, salt);
  await saveDb(db);

  res.json({ message: 'Password updated successfully.' });
});

/* ==================== 4. LIVE SESSIONS ==================== */
router.get('/live-sessions', async (req, res) => {
  const db = await getDb();
  const student = getStudentForUser(req, res);
  const liveSessions = Array.isArray(db.liveSessions) ? db.liveSessions : [];
  const enrollment = (Array.isArray(db.enrollments) ? db.enrollments : []).find((record) =>
    record.studentId === student?.id &&
    (!student.courseId || record.courseId === student.courseId)
  );
  const courseId = student?.courseId || enrollment?.courseId || '';
  const course = (Array.isArray(db.courses) ? db.courses : []).find((record) => record.id === courseId);
  const subject = course?.subject || student?.subject || '';
  const today = new Date().toISOString().slice(0, 10);
  const isForStudent = (session) => {
    if (!courseId) return false;
    if (session.courseId) return session.courseId === courseId;
    if (session.exam && session.exam !== (course?.exam || student?.exam || 'GATE')) return false;
    return !session.subject || session.subject === subject || session.subject === 'All';
  };
  const isValidWebUrl = (value) => {
    try {
      const url = new URL(value);
      return ['https:', 'http:'].includes(url.protocol) && Boolean(url.hostname);
    } catch {
      return false;
    }
  };

  const upcoming = liveSessions.filter((session) => {
    if (!session || session.status !== 'Published') return false;
    if (session.recordingUrl || session.isRecording || session.type === 'recording') return false;
    return isForStudent(session) && typeof session.date === 'string' &&
      session.date >= today && isValidWebUrl(session.meetingLink);
  });

  const recordings = liveSessions.filter((session) => {
    if (!session || session.status !== 'Published') return false;
    return isForStudent(session) &&
      Boolean(session.recordingUrl || session.isRecording || session.type === 'recording') &&
      isValidWebUrl(session.recordingUrl);
  }).map((session) => ({
    ...session,
    subject: session.subject || subject,
    exam: session.exam || course?.exam || student.exam,
    date: session.date || session.recordedAt || '',
    duration: session.duration || session.durationMinutes || '—',
    recordingUrl: session.recordingUrl || null,
  }));

  res.json({ upcoming, recordings });
});

/* ==================== 6. TESTS & SUBMISSION ==================== */
router.get('/tests', async (req, res) => {
  const db = await getDb();
  const student = getStudentForUser(req, res);

  const studentResults = db.results.filter((r) => r.studentId === student.id);
  const attemptedIds = studentResults.map((r) => r.testId);

  const upcomingTests = db.tests
    .filter((t) => t.status === 'Published' && Array.isArray(t.questions) && t.questions.length > 0)
    .map((t) => ({
      id: t.id,
      title: t.name,
      exam: t.exam,
      subject: t.subject,
      durationMinutes: t.duration,
      totalMarks: t.totalMarks,
      negativeMarking: t.negativeMarking,
      questionCount: t.questions.length,
      isAttempted: attemptedIds.includes(t.id),
      score: studentResults.find((r) => r.testId === t.id)?.score || null,
    }));

  res.json({
    tests: upcomingTests,
    completedResults: studentResults,
  });
});

router.get('/tests/:id', async (req, res) => {
  const db = await getDb();
  const test = db.tests.find((t) => t.id === req.params.id);
  if (!test || test.status !== 'Published' || !Array.isArray(test.questions) || test.questions.length === 0) {
    return res.status(404).json({ message: 'Published test with questions not found.' });
  }

  // Hide correct answers from test-taking payload
  const safeQuestions = test.questions.map((q) => ({
    id: q.id,
    question: q.text,
    options: q.options,
    marks: q.marks,
    negativeMarks: q.negativeMarks ?? test.negativeMarking,
  }));

  res.json({
    id: test.id,
    title: test.name,
    exam: test.exam,
    subject: test.subject,
    durationMinutes: test.duration,
    questionCount: test.questions.length,
    totalMarks: test.totalMarks,
    negativeMarking: test.negativeMarking,
    questions: safeQuestions,
  });
});

router.post('/tests/:id/submit', async (req, res) => {
  const db = await getDb();
  const student = getStudentForUser(req, res);
  const test = db.tests.find((t) => t.id === req.params.id);

  if (!test) return res.status(404).json({ message: 'Test not found.' });

  const { answers } = req.body;
  const answerByQuestionId = Array.isArray(answers)
    ? new Map(answers.map((answer) => [answer.questionId, answer.selectedOption]))
    : new Map(Object.entries(answers || {}));
  let score = 0;
  let correctCount = 0;
  let wrongCount = 0;
  let unattemptedCount = 0;

  test.questions.forEach((q) => {
    const studentAnswer = answerByQuestionId.get(q.id);
    if (studentAnswer === undefined || studentAnswer === null) {
      unattemptedCount++;
    } else if (Number(studentAnswer) === Number(q.correctOption ?? q.correctAnswer)) {
      correctCount++;
      score += q.marks;
    } else {
      wrongCount++;
      score -= q.negativeMarks ?? test.negativeMarking ?? 0;
    }
  });

  const finalScore = Math.max(0, Math.round(score * 100) / 100);
  const percentage = Math.round((finalScore / test.totalMarks) * 1000) / 10;

  const newResult = {
    id: `res-${Date.now()}`,
    studentId: student.id,
    studentName: student.name,
    testId: test.id,
    testName: test.name,
    score: finalScore,
    totalMarks: test.totalMarks,
    percentage,
    correctAnswers: correctCount,
    wrongAnswers: wrongCount,
    unattempted: unattemptedCount,
    attemptDate: new Date().toISOString().split('T')[0],
  };

  db.results.unshift(newResult);

  // Update student stats
  const stdIdx = db.students.findIndex((s) => s.id === student.id);
  if (stdIdx !== -1) {
    db.students[stdIdx].testsCompleted += 1;
    db.students[stdIdx].progress = Math.min(100, db.students[stdIdx].progress + 5);
  }

  await saveDb(db);
  res.status(201).json({
    ...newResult,
    answerKey: test.questions.map((question) => ({
      questionId: question.id,
      correctAnswer: Number(question.correctOption ?? question.correctAnswer),
      explanation: question.explanation || '',
    })),
  });
});

/* ==================== 7. RESULTS & ANALYTICS ==================== */
router.get('/results', async (req, res) => {
  const db = await getDb();
  const student = getStudentForUser(req, res);

  const results = db.results.filter((r) => r.studentId === student.id);

  const scoreTrend = results.map((r, i) => ({
    name: `Test #${results.length - i}`,
    score: r.percentage,
    date: r.attemptDate,
  })).reverse();

  const subjectPerformance = [
    { subject: 'Physical Chemistry', accuracy: 82 },
    { subject: 'Organic Chemistry', accuracy: 74 },
    { subject: 'Inorganic Chemistry', accuracy: 78 },
    { subject: 'General Aptitude', accuracy: 88 },
  ];

  res.json({
    results,
    scoreTrend,
    subjectPerformance,
  });
});

/* ==================== 8. PAYMENTS ==================== */
router.get('/payments', async (req, res) => {
  const db = await getDb();
  const student = getStudentForUser(req, res);

  const payments = db.payments.filter((p) => p.studentId === student.id);
  const course = db.courses.find((item) => item.id === student.courseId);
  const courseFee = course?.fee || 10000;
  const amountPaid = payments
    .filter((payment) => payment.status === 'Paid')
    .reduce((total, payment) => total + payment.amount, 0);

  res.json({
    payments: payments.map((payment) => ({
      ...payment,
      studentName: student.name,
      receiptNumber: payment.status === 'Paid'
        ? payment.receiptNumber || `REC-${payment.id.toUpperCase()}`
        : null,
    })),
    courseFee,
    amountPaid,
    status: amountPaid >= courseFee ? 'Paid' : payments.some((payment) => payment.status === 'Pending') ? 'Pending' : 'Unpaid',
    invoiceNumber: `INV-2026-${student.id.toUpperCase()}`,
  });
});

router.get('/payments/:id/receipt.pdf', async (req, res) => {
  const db = await getDb();
  const student = getStudentForUser(req, res);
  const payment = db.payments.find(
    (record) => record.id === req.params.id && record.studentId === student?.id
  );

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
        { text: `Student: ${student.name}` },
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

/* ==================== 9. REFUND REQUEST ==================== */
router.get('/refund', async (req, res) => {
  const db = await getDb();
  const student = getStudentForUser(req, res);

  const existingRequest = db.refunds.find((r) => r.studentId === student.id);

  res.json({
    student,
    refundAmount: 2000,
    courseFee: 10000,
    refundStatus: existingRequest ? existingRequest.status : student.refundStatus,
    existingRequest,
    isEligible: student.refundEligible,
  });
});

router.post('/refund', async (req, res) => {
  const db = await getDb();
  const student = getStudentForUser(req, res);

  if (!student) {
    return res.status(404).json({ message: 'Student profile not found.' });
  }

  if (!student.refundEligible) {
    return res.status(403).json({ message: 'This account is not currently eligible for a refund.' });
  }

  const activeRequest = db.refunds.find(
    (refund) => refund.studentId === student.id &&
      ['Pending', 'Under Review', 'Approved', 'Paid'].includes(refund.status)
  );
  if (activeRequest) {
    return res.status(409).json({ message: 'A refund request is already being reviewed.' });
  }

  const accountDetails = String(req.body.accountDetails || '').trim();
  if (!accountDetails) {
    return res.status(400).json({ message: 'Please provide a UPI ID or bank account for disbursement.' });
  }

  const { examResultProof, notes } = req.body;

  const newRefund = {
    id: `ref-${Date.now()}`,
    studentId: student.id,
    studentName: student.name,
    email: student.email,
    phone: student.phone,
    exam: student.exam,
    course: student.courseName,
    enrollmentId: `enr-${student.id}`,
    courseFee: 10000,
    refundAmount: 2000,
    examResultProof: examResultProof || 'Proof document not attached',
    accountDetails,
    requestDate: new Date().toISOString().split('T')[0],
    eligibility: 'Pending Verification by Academic Registrar',
    status: 'Under Review',
    notes: notes || 'Student submitted exam qualification scorecard.',
  };

  db.refunds.unshift(newRefund);

  const stdIdx = db.students.findIndex((s) => s.id === student.id);
  if (stdIdx !== -1) {
    db.students[stdIdx].refundStatus = 'Under Review';
  }

  await saveDb(db);
  res.status(201).json(newRefund);
});

export default router;

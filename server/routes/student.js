import express from 'express';
import { getDb, saveDb } from '../db.js';
import { requireStudent } from '../middleware/auth.js';
import { sendPdfDocument } from '../utils/pdf.js';
import { GATE_COURSE_CATALOG_ID, GATE_COURSE_FEE, GATE_COURSE_SUBJECTS, getGateCourse, ensureGateCourse } from '../utils/gateEnrollment.js';
import { BRAND_NAME } from '../../shared/brand.js';
import { createEmailNotification } from '../services/emailNotifications.js';

const router = express.Router();

router.use(requireStudent);

const syllabusModules = [
  {
    id: 'mod-1',
    title: 'Module 1: Mathematical Foundations & Operator Algebra',
    topics: ['Linear Vector Spaces', 'Hermitian Operators', 'Dirac Notation', 'Eigenvalue Problems'],
  },
  {
    id: 'mod-2',
    title: 'Module 2: Quantum Chemistry & Postulates',
    topics: ['Schrödinger Wave Equation', '1D/3D Box Solutions', 'Harmonic Oscillator', 'Hydrogen Atom'],
  },
  {
    id: 'mod-3',
    title: 'Module 3: Molecular Spectroscopy & Group Theory',
    topics: ['Rotational Selection Rules', 'Vibrational Raman', 'Point Groups & Character Tables'],
  },
  {
    id: 'mod-4',
    title: 'Module 4: Chemical Kinetics & Reaction Dynamics',
    topics: ['Transition State Theory', 'Catalytic Mechanisms', 'Photochemical Kinetics'],
  },
  {
    id: 'mod-5',
    title: 'Module 5: PYQ Mastery & Speed Problem Sets',
    topics: ['Last 10 Years Numerical Analysis', 'Virtual Calculator Drills', 'Part C Complex Synthesis'],
  },
];

const syllabusTopicIds = new Set(
  syllabusModules.flatMap((module) => module.topics.map((_, index) => `${module.id}-topic-${index + 1}`))
);

function getSyllabusProgress(student) {
  const completed = Array.isArray(student.syllabusProgress)
    ? new Set(student.syllabusProgress.filter((id) => syllabusTopicIds.has(id)))
    : new Set();
  return Math.round((completed.size / syllabusTopicIds.size) * 100);
}

function getStudentForUser(req) {
  return req.student;
}

function getOwnedStudentForUser(req) {
  return req.student;
}

function isVerifiedPayment(payment) {
  return payment?.status === 'Payment Verified' || payment?.status === 'Paid';
}

/* ==================== 1. STUDENT DASHBOARD ==================== */
router.get('/dashboard', async (req, res) => {
  const db = await getDb();
  const student = await getStudentForUser(req, res);

  const course = student.courseId
    ? db.courses.find((c) => c.id === student.courseId) || null
    : (student.courseName && student.courseName !== 'Not enrolled'
      ? db.courses.find((c) => c.name === student.courseName || c.title === student.courseName) || null
      : null);

  const upcomingClass =
    db.liveSessions.find(
      (s) =>
        s.status === 'Published' &&
        (s.exam === student.exam || s.exam === 'All Competitive Exams') &&
        (s.subject === student.subject || s.subject === 'Chemistry')
    ) || db.liveSessions[0];

  const upcomingTest =
    db.tests.find(
      (t) =>
        t.status === 'Published' &&
        t.exam === student.exam &&
        t.subject === student.subject
    ) || db.tests[0];

  const recentResults = db.results
    .filter((r) => r.studentId === student.id)
    .slice(0, 3);

  const relevantAnnouncements = db.announcements.filter(
    (a) =>
      a.status === 'Active' &&
      (a.audience === 'All students' ||
        a.audience === `${student.exam} students` ||
        a.audience === student.subject)
  );
  const progress = getSyllabusProgress(student);

  res.json({
    student: { ...student, progress },
    course: course ? {
      ...course,
      studentProgress: progress,
      classesAttended: student.classesAttended,
      totalClasses: student.totalClasses,
      materialsAccessed: student.materialsAccessed,
      testsCompleted: student.testsCompleted,
      averageScore: student.averageScore,
    } : null,
    upcomingClass,
    upcomingTest,
    recentResults,
    announcements: relevantAnnouncements,
  });
});

/* ==================== 2. STUDENT PROFILE ==================== */
router.get('/profile', async (req, res) => {
  const student = getStudentForUser(req);
  res.json({
    student,
    user: {
      id: req.user.id,
      email: req.user.email,
      phone: req.user.phone,
      name: req.user.name,
      role: req.user.role,
    },
  });
});

router.put('/profile', async (req, res) => {
  const db = await getDb();
  const student = getStudentForUser(req);
  const profileFields = ['name', 'email', 'dateOfBirth', 'gender', 'address', 'qualification', 'college', 'gatePaper', 'gateAttemptYear'];
  const profile = Object.fromEntries(profileFields.map((field) => [field, String(req.body?.[field] ?? '').trim()]));
  if (!profile.name || !profile.email) {
    return res.status(400).json({ message: 'Enter your name and email address.' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) {
    return res.status(400).json({ message: 'Enter a valid email address.' });
  }
  if (profile.dateOfBirth && (Number.isNaN(Date.parse(profile.dateOfBirth)) || new Date(profile.dateOfBirth) >= new Date())) {
    return res.status(400).json({ message: 'Enter a valid date of birth in the past.' });
  }
  if (profile.gateAttemptYear && (!/^\d{4}$/.test(profile.gateAttemptYear) || Number(profile.gateAttemptYear) < 2000 || Number(profile.gateAttemptYear) > new Date().getFullYear() + 5)) {
    return res.status(400).json({ message: 'Choose a valid GATE attempt year.' });
  }

  const studentIndex = db.students.findIndex((record) => record.id === student.id);
  const userIndex = db.users.findIndex((record) => record.id === req.user.id);
  if (studentIndex === -1 || userIndex === -1) return res.status(404).json({ message: 'Student profile not found.' });

  const optionalProfile = [
    profile.dateOfBirth,
    profile.gender,
    profile.address,
    profile.qualification,
    profile.college,
    profile.gatePaper,
    profile.gateAttemptYear,
  ];
  const profileCompleted = optionalProfile.every((value) => value.length > 0);
  const updatedStudent = {
    ...db.students[studentIndex],
    ...profile,
    phone: req.user.phone,
    mobile: req.user.phone,
    mobileVerified: true,
    exam: 'GATE',
    subject: profile.gatePaper,
    profileCompleted,
    updatedAt: new Date().toISOString(),
  };
  db.students[studentIndex] = updatedStudent;
  db.users[userIndex] = {
    ...db.users[userIndex],
    name: profile.name,
    email: profile.email,
    mobileVerified: true,
    profileCompleted,
  };
  await saveDb(db);
  res.json({ message: 'Profile updated successfully.', student: updatedStudent });
});

/* ==================== 3. MY COURSE ==================== */
router.get('/course', async (req, res) => {
  const db = await getDb();
  const student = await getStudentForUser(req, res);
  const course = student.courseId
    ? db.courses.find((c) => c.id === student.courseId) || null
    : (student.courseName && student.courseName !== 'Not enrolled'
      ? db.courses.find((c) => c.name === student.courseName || c.title === student.courseName) || null
      : null);

  const completedTopicIds = Array.isArray(student.syllabusProgress)
    ? student.syllabusProgress.filter((id) => syllabusTopicIds.has(id))
    : [];
  const completedTopics = new Set(completedTopicIds);
  const modules = syllabusModules.map((module) => {
    const topics = module.topics.map((title, index) => ({
      id: `${module.id}-topic-${index + 1}`,
      title,
      isCompleted: completedTopics.has(`${module.id}-topic-${index + 1}`),
    }));
    const completedLessons = topics.filter((topic) => topic.isCompleted).length;
    return {
      ...module,
      topics,
      totalLessons: topics.length,
      completedLessons,
      status: completedLessons === topics.length
        ? 'Completed'
        : completedLessons > 0
          ? 'In Progress'
          : 'Not Started',
    };
  });
  const overallProgress = getSyllabusProgress(student);

  res.json({
    course,
    student: { ...student, progress: overallProgress },
    modules: course ? modules : [],
    overallProgress,
  });
});

router.put('/course/syllabus-progress', async (req, res) => {
  const student = getStudentForUser(req);
  const topicId = String(req.body?.topicId ?? '');
  const { isCompleted } = req.body ?? {};
  if (!syllabusTopicIds.has(topicId) || typeof isCompleted !== 'boolean') {
    return res.status(400).json({ message: 'Choose a valid syllabus topic and completion state.' });
  }

  const db = await getDb();
  const studentIndex = db.students.findIndex((record) => record.id === student.id);
  if (studentIndex === -1) return res.status(404).json({ message: 'Student profile not found.' });

  const current = Array.isArray(db.students[studentIndex].syllabusProgress)
    ? db.students[studentIndex].syllabusProgress.filter((id) => syllabusTopicIds.has(id))
    : [];
  const completed = new Set(current);
  if (isCompleted) completed.add(topicId);
  else completed.delete(topicId);

  const syllabusProgress = [...completed];
  db.students[studentIndex] = {
    ...db.students[studentIndex],
    syllabusProgress,
    progress: getSyllabusProgress({ syllabusProgress }),
    updatedAt: new Date().toISOString(),
  };
  await saveDb(db);

  res.json({
    completedTopicIds: syllabusProgress,
    overallProgress: db.students[studentIndex].progress,
  });
});

/* ==================== 4. LIVE SESSIONS ==================== */
router.get('/live-sessions', async (req, res) => {
  const db = await getDb();
  const student = await getStudentForUser(req, res);

  const upcoming = db.liveSessions.filter(
    (s) => s.status === 'Published'
  );

  const recordings = [
    {
      id: 'rec-1',
      title: 'Chemical Thermodynamics & Maxwell Relations Solved PYQs',
      subject: student.subject,
      exam: student.exam,
      date: '2026-10-02',
      duration: '115 mins',
      recordingUrl: '[RECORDING LINK]',
    },
    {
      id: 'rec-2',
      title: 'Quantum Harmonic Oscillator & Hermite Polynomials',
      subject: student.subject,
      exam: student.exam,
      date: '2026-09-28',
      duration: '124 mins',
      recordingUrl: '[RECORDING LINK]',
    },
    {
      id: 'rec-3',
      title: '1H-NMR Splitting Rules and Structural Elucidation',
      subject: student.subject,
      exam: student.exam,
      date: '2026-09-24',
      duration: '95 mins',
      recordingUrl: '[RECORDING LINK]',
    },
  ];

  res.json({ upcoming, recordings });
});

/* ==================== 5. MATERIALS ==================== */
router.get('/materials', async (req, res) => {
  const db = await getDb();
  const student = await getStudentForUser(req, res);

  // Return all published materials (unlocked because student is authorized)
  const studentMaterials = db.materials.map((m) => ({
    ...m,
    isLocked: false,
    downloadUrl: `/api/student/materials/${m.id}/download`,
  }));

  res.json(studentMaterials);
});

/* ==================== 6. TESTS & SUBMISSION ==================== */
router.get('/tests', async (req, res) => {
  const db = await getDb();
  const student = await getStudentForUser(req, res);

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
  const student = await getStudentForUser(req, res);
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
  const student = await getStudentForUser(req, res);

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
  const student = await getOwnedStudentForUser(req, res);
  if (!student) return;

  const payments = db.payments.filter((p) => p.studentId === student.id);
  const course = db.courses.find((item) => item.id === student.courseId);
  const courseFee = course?.fee || GATE_COURSE_FEE;
  const amountPaid = payments
    .filter((payment) => isVerifiedPayment(payment))
    .reduce((total, payment) => total + payment.amount, 0);

  res.json({
    payments: payments.map((payment) => ({
      ...payment,
      studentName: student.name,
      receiptNumber: isVerifiedPayment(payment)
        ? payment.receiptNumber || `REC-${payment.id.toUpperCase()}`
        : null,
    })),
    courseFee,
    amountPaid,
    status: amountPaid >= courseFee ? 'Paid' : payments.some((payment) => ['Pending', 'Payment Pending', 'Payment Verification Pending'].includes(payment.status)) ? 'Pending' : 'Unpaid',
    invoiceNumber: `INV-2026-${student.id.toUpperCase()}`,
  });
});

router.get('/enrollment/options', async (req, res) => {
  const student = await getOwnedStudentForUser(req, res);
  if (!student) return;

  res.json({
    courseId: GATE_COURSE_CATALOG_ID,
    title: '100-Day Online Live Coaching Program',
    exam: 'GATE',
    fee: GATE_COURSE_FEE,
    duration: '100 Days Intensive',
    subjects: GATE_COURSE_SUBJECTS,
    courses: GATE_COURSE_SUBJECTS.map((subject) => getGateCourse(subject)),
    student: { name: student.name, id: student.id },
  });
});

router.post('/enrollments', async (req, res) => {
  const student = await getOwnedStudentForUser(req, res);
  if (!student) return;

  const course = getGateCourse(req.body?.courseCode ?? req.body?.subject);
  if (req.body?.courseId !== GATE_COURSE_CATALOG_ID || !course) {
    return res.status(400).json({ message: 'Choose an available GATE course and subject.' });
  }

  const db = await getDb();
  const activeEnrollment = db.enrollments.find(
    (record) => record.studentId === student.id && record.courseStatus === 'Active'
  );
  if (activeEnrollment) {
    const activePayment = db.payments.find((record) => record.enrollmentId === activeEnrollment.id);
    if (activePayment) return res.json({ payment: activePayment, enrollment: activeEnrollment });
    return res.status(409).json({ message: 'You are already enrolled in a course.' });
  }

  const existingEnrollment = db.enrollments.find(
    (record) => record.studentId === student.id && record.enrollmentFlow === 'upi-gate'
  );
  if (existingEnrollment) {
    const existingPayment = db.payments.find((record) => record.id === existingEnrollment.paymentId);
    if (existingPayment && existingEnrollment.subject === course.subject) {
      return res.json({ payment: existingPayment, enrollment: existingEnrollment });
    }
    if (existingPayment) {
      return res.status(409).json({
        message: 'An enrollment for another GATE subject is already in progress. Continue that payment or contact the academy before changing subjects.',
      });
    }
    return res.status(409).json({ message: 'An enrollment is already being processed. Contact the academy for assistance.' });
  }

  const now = new Date();
  const courseRecord = ensureGateCourse(db, course);
  const enrollmentId = `enr-${student.id}-${course.id}`;
  const paymentId = `pay-${student.id}-${course.id}`;
  const enrollment = {
    id: enrollmentId,
    studentId: student.id,
    studentName: student.name,
    courseId: courseRecord.id,
    courseCode: course.code,
    requestedCourseId: GATE_COURSE_CATALOG_ID,
    courseName: course.courseName,
    exam: 'GATE',
    subject: course.subject,
    amount: GATE_COURSE_FEE,
    enrollmentDate: null,
    createdAt: now.toISOString(),
    paymentId,
    paymentStatus: 'Payment Pending',
    courseStatus: 'Pending Payment',
    enrollmentFlow: 'upi-gate',
  };
  const payment = {
    id: paymentId,
    transactionId: paymentId,
    studentId: student.id,
    studentName: student.name,
    registrationId: student.id,
    enrollmentId,
    courseId: courseRecord.id,
    courseCode: course.code,
    courseName: course.courseName,
    exam: 'GATE',
    subject: course.subject,
    amount: GATE_COURSE_FEE,
    paymentMethod: 'UPI',
    upi: 'Kinetiq Academi QR',
    date: now.toISOString(),
    createdAt: now.toISOString(),
    paymentDate: null,
    status: 'Payment Pending',
    enrollmentFlow: 'upi-gate',
  };

  db.enrollments.push(enrollment);
  db.payments.push(payment);
  const enrollmentNotification = createEmailNotification({
    type: 'course_enrollment',
    idempotencyKey: `course-enrollment:${enrollment.id}`,
    student,
    enrollment,
    payment,
    status: 'Pending Payment',
  });
  await saveDb(db, { notifications: enrollmentNotification ? [enrollmentNotification] : [] });
  res.status(201).json({ payment, enrollment });
});

router.get('/payments/:id', async (req, res) => {
  const student = await getOwnedStudentForUser(req, res);
  if (!student) return;
  const db = await getDb();
  const payment = db.payments.find(
    (record) => record.id === req.params.id && record.studentId === student.id
  );
  if (!payment) return res.status(404).json({ message: 'Payment not found.' });

  const enrollment = db.enrollments.find(
    (record) => record.id === payment.enrollmentId && record.studentId === student.id
  );
  res.json({
    payment,
    enrollment: enrollment || null,
    student: { name: student.name, registrationId: student.id },
  });
});

router.post('/payments/:id/confirm', async (req, res) => {
  const student = await getOwnedStudentForUser(req, res);
  if (!student) return;
  const db = await getDb();
  const payment = db.payments.find(
    (record) => record.id === req.params.id && record.studentId === student.id
  );
  if (!payment) return res.status(404).json({ message: 'Payment not found.' });
  if (payment.enrollmentFlow !== 'upi-gate') {
    return res.status(409).json({ message: 'This payment cannot be submitted for UPI verification.' });
  }

  if (payment.status === 'Payment Verification Pending' || isVerifiedPayment(payment)) {
    return res.json({ payment });
  }
  if (!['Pending', 'Payment Pending', 'Payment Failed'].includes(payment.status)) {
    return res.status(409).json({ message: 'This payment is not available for verification.' });
  }

  const confirmationTime = new Date().toISOString();
  payment.status = 'Payment Verification Pending';
  payment.studentConfirmedAt = confirmationTime;
  payment.paymentDate = confirmationTime;
  payment.date = confirmationTime;
  const enrollment = db.enrollments.find((record) => record.id === payment.enrollmentId);
  if (enrollment) {
    enrollment.paymentStatus = 'Payment Verification Pending';
    enrollment.courseStatus = 'Pending Payment Verification';
  }
  const submissionNotification = createEmailNotification({
    type: 'payment_submitted',
    idempotencyKey: `payment-submitted:${payment.id}:${confirmationTime}`,
    student,
    enrollment,
    payment,
    status: 'Verification Pending',
  });
  await saveDb(db, { notifications: submissionNotification ? [submissionNotification] : [] });
  res.json({ payment });
});

router.get('/payments/:id/receipt.pdf', async (req, res) => {
  const db = await getDb();
  const student = await getOwnedStudentForUser(req, res);
  if (!student) return;
  const payment = db.payments.find(
    (record) => record.id === req.params.id && record.studentId === student?.id
  );

  if (!payment) return res.status(404).json({ message: 'Payment not found.' });
  if (!isVerifiedPayment(payment)) {
    return res.status(409).json({ message: 'A receipt is available only after payment is confirmed.' });
  }

  const receiptNumber = payment.receiptNumber || `REC-${payment.id.toUpperCase()}`;
  const enrollment = db.enrollments.find((record) => record.id === payment.enrollmentId);
  sendPdfDocument(res, {
    filename: `${receiptNumber}.pdf`,
    title: `${BRAND_NAME} | GATE Course Enrollment Receipt`,
    subtitle: `Enrollment Receipt ${receiptNumber}`,
    sections: [{
      title: 'Enrollment & Payment Details',
      items: [
        { text: `Student: ${student.name}` },
        { text: `Registration/Application ID: ${student.id}` },
        { text: `Course: ${payment.courseName}` },
        ...(payment.courseCode ? [{ text: `Course Code: ${payment.courseCode}` }] : []),
        { text: `Amount Paid: INR ${Number(payment.amount).toLocaleString('en-IN')}` },
        { text: `UPI: ${payment.upi || 'UPI QR'}` },
        { text: `Enrollment Date: ${enrollment?.enrollmentDate || student.enrollmentDate || '-'}` },
        { text: 'Payment Status: Payment Verified' },
        { text: 'Enrollment Status: Enrollment Confirmed' },
        { text: `Verification Date: ${payment.verifiedAt || payment.receiptIssuedAt || '-'}` },
        { text: `Payment Record ID: ${payment.id}` },
        { text: 'This is a computer-generated Kinetiq Academi enrollment receipt.' },
      ],
    }],
  });
});

/* ==================== 9. ANNOUNCEMENTS ==================== */
router.get('/announcements', async (req, res) => {
  const db = await getDb();
  const student = await getStudentForUser(req, res);

  const list = db.announcements.filter(
    (a) =>
      a.status === 'Active' &&
      (a.audience === 'All students' ||
        a.audience === `${student.exam} students` ||
        a.audience === student.subject)
  );

  res.json(list.map((announcement) => ({
    ...announcement,
    priority: typeof announcement.priority === 'string' && announcement.priority.trim()
      ? announcement.priority.trim().toLowerCase() === 'normal'
        ? 'Medium'
        : ['Urgent', 'High', 'Medium', 'Low'].find(
          (priority) => priority.toLowerCase() === announcement.priority.trim().toLowerCase()
        ) || 'Medium'
      : 'Medium',
    category: typeof announcement.category === 'string' && announcement.category.trim()
      ? announcement.category.trim()
      : 'General',
    keywords: Array.isArray(announcement.keywords) ? announcement.keywords : [],
    content: announcement.content || announcement.description || announcement.message || '',
    publishDate: announcement.publishDate || announcement.date || '',
  })));
});

export default router;

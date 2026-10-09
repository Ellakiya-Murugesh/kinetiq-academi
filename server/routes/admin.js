import express from 'express';
import { getDb, saveDb, normalizeMobile } from '../db.js';
import { requireAdmin } from '../middleware/auth.js';
import { sendPdfDocument } from '../utils/pdf.js';
import { BRAND_NAME } from '../../shared/brand.js';
import {
  createEmailNotification,
  listEmailNotifications,
  queueAdminTestEmail,
  retryEmailNotification,
  verifyEmailTransport,
} from '../services/emailNotifications.js';

const router = express.Router();
const ANNOUNCEMENT_PRIORITIES = new Set(['Urgent', 'High', 'Medium', 'Low']);

function normalizeAnnouncementPriority(priority) {
  if (typeof priority !== 'string') return 'Medium';
  const normalized = priority.trim().toLowerCase();
  if (normalized === 'normal') return 'Medium';
  return [...ANNOUNCEMENT_PRIORITIES].find((value) => value.toLowerCase() === normalized) || 'Medium';
}

// Allow public submission to enquiries endpoint without admin auth
router.post('/public-enquiry', async (req, res) => {
  const { name, phone, exam, subject, message } = req.body;
  if (!name || !phone) {
    return res.status(400).json({ message: 'Name and Phone number are required.' });
  }

  const db = await getDb();
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
  await saveDb(db);
  res.status(201).json({ message: 'Enquiry submitted successfully.', enquiry: newEnquiry });
});

// All subsequent routes require ADMIN role verification
router.use(requireAdmin);

router.get('/email-notifications', async (req, res) => {
  res.json(await listEmailNotifications());
});

router.post('/email-notifications/test', async (req, res) => {
  try {
    const db = await getDb();
    const admin = db.users.find((user) => user.id === req.user.id && user.role === 'ADMIN');
    if (!admin) return res.status(404).json({ message: 'Administrator account not found.' });
    await verifyEmailTransport();
    const notificationId = await queueAdminTestEmail(admin);
    return res.status(202).json({
      message: 'Gmail SMTP authentication succeeded. A test email is queued for the registered administrator address.',
      notificationId,
    });
  } catch (error) {
    const code = String(error?.code || error?.name || 'EMAIL_TEST_FAILED')
      .replace(/[^A-Za-z0-9_-]/g, '').slice(0, 48);
    console.warn(`Administrator SMTP test failed (${code}).`);
    if (['SMTP_NOT_CONFIGURED', 'SMTP_CONFIGURATION_INVALID', 'EMAIL_URL_NOT_CONFIGURED'].includes(code)) {
      return res.status(503).json({ message: error.message });
    }
    if (code === 'EAUTH') {
      return res.status(503).json({
        message: 'Gmail rejected SMTP authentication. Check that SMTP_PASS is a current Google App Password and 2-Step Verification is enabled.',
      });
    }
    return res.status(503).json({
      message: 'Could not verify Gmail SMTP. Check backend outbound network access and server logs for the diagnostic code.',
    });
  }
});

router.post('/email-notifications/:id/retry', async (req, res) => {
  const retried = await retryEmailNotification(req.params.id);
  if (!retried) {
    return res.status(409).json({ message: 'This notification is not failed or waiting for retry.' });
  }
  return res.json({ message: 'Email notification queued for retry.' });
});

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
router.get('/students', async (req, res) => {
  const db = await getDb();
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
  const publicUser = user && Object.fromEntries(
    Object.entries(user).filter(([field]) => field !== 'passwordHash')
  );

  res.json({
    student,
    user: publicUser,
    enrollment,
    payments,
    testResults,
  });
});

router.post('/students', async (req, res) => {
  const db = await getDb();
  const { name, email, phone, exam, subject, courseId } = req.body;
  const mobile = normalizeMobile(phone);

  if (!name || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email)) || !/^[6-9]\d{9}$/.test(mobile)) {
    return res.status(400).json({ message: 'Provide a valid name, email and 10-digit mobile number.' });
  }

  const newUserId = `usr-student-${Date.now()}`;
  const newStudentId = `std-${Math.floor(1000 + Math.random() * 9000)}`;

  const newUser = {
    id: newUserId,
    email,
    phone: mobile,
    mobile,
    mobileVerified: false,
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
    phone: mobile,
    mobile,
    mobileVerified: false,
    profileCompleted: false,
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
  };

  db.users.push(newUser);
  db.students.unshift(newStudent);
  await saveDb(db);

  res.status(201).json(newStudent);
});

router.put('/students/:id', async (req, res) => {
  const db = await getDb();
  const index = db.students.findIndex((s) => s.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ message: 'Student not found.' });
  }

  const existingStudent = db.students[index];
  const editableFields = { ...req.body };
  for (const immutableField of ['id', 'userId', 'phone', 'mobile', 'mobileVerified']) {
    delete editableFields[immutableField];
  }
  db.students[index] = { ...existingStudent, ...editableFields };
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
  res.json(db.courses);
});

router.post('/courses', async (req, res) => {
  const db = await getDb();
  const newCourse = {
    id: `crs-${Date.now()}`,
    name: req.body.name,
    exam: req.body.exam,
    subject: req.body.subject,
    description: req.body.description,
    duration: req.body.duration || '100 Days Intensive',
    startDate: req.body.startDate || '2026-11-01',
    fee: Number(req.body.fee) || 10000,
    status: req.body.status || 'Published',
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

  db.courses[idx] = { ...db.courses[idx], ...req.body };
  await saveDb(db);
  res.json(db.courses[idx]);
});

router.delete('/courses/:id', async (req, res) => {
  const db = await getDb();
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
  if (db.enrollments[idx].enrollmentFlow === 'upi-gate') {
    return res.status(409).json({
      message: 'UPI enrollment status is controlled by payment verification. Review it from Payment Management.',
    });
  }

  const previousEnrollment = db.enrollments[idx];
  const { courseStatus, rejectionReason } = req.body || {};
  if (typeof courseStatus !== 'string' || !['Active', 'Suspended', 'Cancelled'].includes(courseStatus)) {
    return res.status(400).json({ message: 'Enrollment status must be Active, Suspended, or Cancelled.' });
  }
  if (rejectionReason !== undefined && typeof rejectionReason !== 'string') {
    return res.status(400).json({ message: 'Enrollment status explanation must be text.' });
  }
  const updatedEnrollment = {
    ...previousEnrollment,
    courseStatus,
    updatedAt: new Date().toISOString(),
    ...(typeof rejectionReason === 'string' ? { rejectionReason: rejectionReason.trim().slice(0, 1000) } : {}),
  };
  db.enrollments[idx] = updatedEnrollment;
  const normalizedStatus = String(courseStatus).toLowerCase();
  const type = ['active', 'approved'].includes(normalizedStatus)
    ? 'enrollment_approved'
    : ['cancelled', 'rejected', 'denied'].includes(normalizedStatus)
      ? 'enrollment_rejected'
      : null;
  const student = db.students.find((record) => record.id === updatedEnrollment.studentId);
  const notification = type && courseStatus !== previousEnrollment.courseStatus && student
    ? createEmailNotification({
        type,
        idempotencyKey: `enrollment-status:${updatedEnrollment.id}:${courseStatus}:${updatedEnrollment.updatedAt}`,
        student,
        enrollment: updatedEnrollment,
        status: courseStatus,
        reason: rejectionReason,
      })
    : null;
  await saveDb(db, { notifications: notification ? [notification] : [] });
  res.json(updatedEnrollment);
});

/* ==================== 5. PAYMENTS ==================== */
router.get('/payments', async (req, res) => {
  const db = await getDb();
  res.json(db.payments.map((payment) => {
    const student = db.students.find((record) => record.id === payment.studentId);
    return {
      ...payment,
      studentName: student?.name || payment.studentName || 'Student',
      registrationId: student?.id || payment.registrationId || payment.studentId || '—',
      paymentDate: payment.paymentDate || payment.studentConfirmedAt || payment.date,
    };
  }));
});

router.get('/payments/:id/receipt.pdf', async (req, res) => {
  const db = await getDb();
  const payment = db.payments.find((record) => record.id === req.params.id);
  if (!payment) return res.status(404).json({ message: 'Payment not found.' });
  if (!['Paid', 'Payment Verified'].includes(payment.status)) {
    return res.status(409).json({ message: 'A receipt is available only after payment is confirmed.' });
  }

  const receiptNumber = payment.receiptNumber || `REC-${payment.id.toUpperCase()}`;
  const student = db.students.find((record) => record.id === payment.studentId);
  const enrollment = db.enrollments.find((record) => record.id === payment.enrollmentId);
  sendPdfDocument(res, {
    filename: `${receiptNumber}.pdf`,
    title: payment.enrollmentFlow === 'upi-gate'
      ? `${BRAND_NAME} | GATE Course Enrollment Receipt`
      : `${BRAND_NAME} Payment Receipt`,
    subtitle: `Receipt ${receiptNumber}`,
    sections: [{
      title: payment.enrollmentFlow === 'upi-gate' ? 'Enrollment & Payment Details' : 'Payment Details',
      items: [
        { text: `Student: ${student?.name || payment.studentName}` },
        ...(payment.enrollmentFlow === 'upi-gate'
          ? [{ text: `Registration/Application ID: ${student?.id || payment.registrationId || payment.studentId}` }]
          : [{ text: `Transaction ID: ${payment.transactionId}` }]),
        { text: `Course: ${payment.courseName}` },
        { text: `Amount Paid: INR ${Number(payment.amount).toLocaleString('en-IN')}` },
        ...(payment.enrollmentFlow === 'upi-gate'
          ? [
              ...(payment.courseCode ? [{ text: `Course Code: ${payment.courseCode}` }] : []),
              { text: `UPI: ${payment.upi || 'UPI QR'}` },
              { text: `Enrollment Date: ${enrollment?.enrollmentDate || student?.enrollmentDate || '-'}` },
              { text: 'Payment Status: Payment Verified' },
              { text: 'Enrollment Status: Enrollment Confirmed' },
              { text: `Verification Date: ${payment.verifiedAt || payment.receiptIssuedAt || '-'}` },
              { text: `Payment Record ID: ${payment.id}` },
            ]
          : [
              { text: `Payment Method: ${payment.paymentMethod}` },
              { text: `Payment Date: ${payment.date}` },
              { text: 'Status: Paid' },
            ]),
        { text: `This is a computer-generated ${payment.enrollmentFlow === 'upi-gate' ? 'Kinetiq Academi enrollment' : 'payment'} receipt.` },
      ],
    }],
  });
});

router.put('/payments/:id', async (req, res) => {
  const db = await getDb();
  const payment = db.payments.find((record) => record.id === req.params.id);
  if (!payment) return res.status(404).json({ message: 'Payment not found.' });

  const { status } = req.body;
  if (payment.enrollmentFlow === 'upi-gate') {
    if (payment.status !== 'Payment Verification Pending' ||
        !['Payment Verified', 'Payment Failed'].includes(status)) {
      return res.status(409).json({
        message: 'Only a payment awaiting verification can be marked Payment Verified or Payment Failed.',
      });
    }

    const student = db.students.find((record) => record.id === payment.studentId);
    if (!student) return res.status(404).json({ message: 'Student profile not found.' });
    const enrollment = db.enrollments.find((record) => record.id === payment.enrollmentId);
    if (!enrollment) return res.status(404).json({ message: 'Enrollment record not found.' });

    const now = new Date();
    if (status === 'Payment Failed') {
      payment.status = 'Payment Failed';
      payment.reviewedAt = now.toISOString();
      payment.rejectionReason = typeof req.body?.rejectionReason === 'string'
        ? req.body.rejectionReason.trim().slice(0, 1000)
        : '';
      student.paymentStatus = 'Payment Failed';
      enrollment.paymentStatus = 'Payment Failed';
      enrollment.courseStatus = 'Payment Failed';
    } else {
      const course = db.courses.find((record) => record.id === payment.courseId);
      const wasActive = enrollment.courseStatus === 'Active';
      payment.status = 'Payment Verified';
      payment.verifiedAt = payment.verifiedAt || now.toISOString();
      payment.receiptNumber = payment.receiptNumber || `REC-${payment.id.toUpperCase()}`;
      payment.receiptIssuedAt = payment.receiptIssuedAt || payment.verifiedAt;
      student.exam = 'GATE';
      student.subject = payment.subject;
      student.courseId = payment.courseId;
      student.courseName = payment.courseName;
      student.enrollmentDate = now.toISOString().split('T')[0];
      student.paymentStatus = 'Payment Verified';
      enrollment.studentName = student.name;
      enrollment.courseId = payment.courseId;
      enrollment.courseName = payment.courseName;
      enrollment.exam = 'GATE';
      enrollment.subject = payment.subject;
      enrollment.enrollmentDate = enrollment.enrollmentDate || now.toISOString().split('T')[0];
      enrollment.paymentStatus = 'Payment Verified';
      enrollment.courseStatus = 'Active';
      if (course && !wasActive) course.enrolledCount = (course.enrolledCount || 0) + 1;
    }

    const paymentNotification = createEmailNotification({
      type: status === 'Payment Failed' ? 'payment_rejected' : 'payment_verified',
      idempotencyKey: `payment-status:${payment.id}:${status}:${payment.studentConfirmedAt || payment.id}`,
      student,
      enrollment,
      payment,
      status: status === 'Payment Failed' ? 'Rejected' : 'Verified',
      reason: payment.rejectionReason,
    });
    const enrollmentNotification = status === 'Payment Verified'
      ? createEmailNotification({
          type: 'enrollment_confirmed',
          idempotencyKey: `enrollment-confirmed:${enrollment.id}:${payment.studentConfirmedAt || payment.id}`,
          student,
          enrollment,
          payment,
          status: 'Enrollment Confirmed',
        })
      : null;
    await saveDb(db, {
      notifications: [paymentNotification, enrollmentNotification].filter(Boolean),
    });
    return res.json(payment);
  }

  if (!['Paid', 'Pending', 'Failed'].includes(status)) {
    return res.status(400).json({ message: 'Invalid payment status.' });
  }

  const previousStatus = payment.status;
  payment.status = status;
  if (status !== previousStatus) payment.updatedAt = new Date().toISOString();

  const notifications = [];
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
      if (status !== previousStatus) {
        const paymentNotification = createEmailNotification({
          type: 'payment_verified',
          idempotencyKey: `payment-status:${payment.id}:${status}:${payment.updatedAt}`,
          student,
          enrollment,
          payment,
          status: 'Verified',
        });
        const enrollmentNotification = createEmailNotification({
          type: 'enrollment_confirmed',
          idempotencyKey: `enrollment-confirmed:${enrollment.id}:${payment.updatedAt}`,
          student,
          enrollment,
          payment,
          status: 'Enrollment Confirmed',
        });
        if (paymentNotification) notifications.push(paymentNotification);
        if (enrollmentNotification) notifications.push(enrollmentNotification);
      }
    }
  } else if (status === 'Failed' && previousStatus !== 'Failed') {
    const student = db.students.find((record) => record.id === payment.studentId);
    const enrollment = db.enrollments.find((record) => record.id === payment.enrollmentId);
    const notification = createEmailNotification({
      type: 'payment_rejected',
      idempotencyKey: `payment-status:${payment.id}:${status}:${payment.updatedAt}`,
      student,
      enrollment,
      payment,
      status: 'Rejected',
      reason: req.body?.rejectionReason,
    });
    if (notification) notifications.push(notification);
  }

  await saveDb(db, { notifications });
  res.json(payment);
});

/* ==================== 6. LIVE SESSIONS ==================== */
router.get('/live-sessions', async (req, res) => {
  const db = await getDb();
  res.json(db.liveSessions);
});

router.post('/live-sessions', async (req, res) => {
  const db = await getDb();
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
  await saveDb(db);
  res.status(201).json(newSession);
});

router.put('/live-sessions/:id', async (req, res) => {
  const db = await getDb();
  const idx = db.liveSessions.findIndex((s) => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Live session not found.' });

  db.liveSessions[idx] = { ...db.liveSessions[idx], ...req.body };
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
  const newMaterial = {
    id: `mat-${Date.now()}`,
    title: req.body.title,
    exam: req.body.exam,
    subject: req.body.subject,
    category: req.body.category || 'Study Notes',
    description: req.body.description,
    fileUrl: req.body.fileUrl || '/downloads/sample-notes.pdf',
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
  const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
  const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
  const category = typeof req.body?.category === 'string' ? req.body.category.trim() : '';
  const audience = typeof req.body?.audience === 'string' ? req.body.audience.trim() : 'All students';
  const rawKeywords = req.body?.keywords;
  const keywords = Array.isArray(rawKeywords)
    ? rawKeywords.filter((keyword) => typeof keyword === 'string').map((keyword) => keyword.trim()).filter(Boolean)
    : typeof rawKeywords === 'string'
      ? rawKeywords.split(',').map((keyword) => keyword.trim()).filter(Boolean)
      : [];
  if (!title || title.length > 160 || !message || message.length > 10000) {
    return res.status(400).json({ message: 'Enter a title (up to 160 characters) and message (up to 10,000 characters).' });
  }
  if (category.length > 64 || audience.length > 100 || keywords.some((keyword) => keyword.length > 80) || keywords.length > 20) {
    return res.status(400).json({ message: 'Category, audience, or keywords exceed the allowed length.' });
  }
  const requestedPriority = req.body?.priority;
  if (requestedPriority !== undefined && (
    typeof requestedPriority !== 'string' ||
    !['urgent', 'high', 'medium', 'low', 'normal'].includes(requestedPriority.trim().toLowerCase())
  )) {
    return res.status(400).json({ message: 'Priority must be Urgent, High, Medium, or Low.' });
  }

  const db = await getDb();
  const newAnc = {
    id: `anc-${Date.now()}`,
    title,
    message,
    category: category || 'General',
    keywords,
    priority: normalizeAnnouncementPriority(req.body?.priority),
    audience: audience || 'All students',
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

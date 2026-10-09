import { createHash } from 'node:crypto';
import nodemailer from 'nodemailer';
import { getMongoDatabase } from '../db.js';
import { BRAND_NAME } from '../../shared/brand.js';

const EMAIL_FROM = 'kinetiqacademi@gmail.com';
const SMTP_HOST = 'smtp.gmail.com';
const SMTP_PORT = 465;
const MAX_ATTEMPTS = 8;
const POLL_INTERVAL_MS = 15_000;
let workerTimer;
let workerRunning = false;
let workerEnabled = false;

const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}[character]));

function getWebsiteUrl() {
  const configured = process.env.FRONTEND_URL || process.env.APP_ORIGIN;
  if (!configured && process.env.NODE_ENV !== 'production') return 'http://127.0.0.1:5173';
  if (!configured) {
    const error = new Error('FRONTEND_URL must be set to the deployed HTTPS website URL.');
    error.code = 'EMAIL_URL_NOT_CONFIGURED';
    throw error;
  }
  let url;
  try {
    url = new URL(configured);
  } catch {
    const error = new Error('FRONTEND_URL must be a valid website URL.');
    error.code = 'EMAIL_URL_NOT_CONFIGURED';
    throw error;
  }
  if (process.env.NODE_ENV === 'production' && url.protocol !== 'https:') {
    const error = new Error('FRONTEND_URL must use HTTPS in production.');
    error.code = 'EMAIL_URL_NOT_CONFIGURED';
    throw error;
  }
  return url.origin;
}

function getTransporter() {
  const port = Number(process.env.SMTP_PORT || SMTP_PORT);
  const secure = String(process.env.SMTP_SECURE ?? 'true').toLowerCase() === 'true';
  const host = process.env.SMTP_HOST || SMTP_HOST;
  const user = process.env.SMTP_USER || EMAIL_FROM;
  const from = process.env.EMAIL_FROM || EMAIL_FROM;
  const password = process.env.SMTP_PASS;

  if (host !== SMTP_HOST || port !== SMTP_PORT || !secure || user !== EMAIL_FROM || from !== EMAIL_FROM) {
    const error = new Error('Email settings must use Gmail SMTP over implicit TLS on port 465 with the academy account.');
    error.code = 'SMTP_CONFIGURATION_INVALID';
    throw error;
  }
  if (!password?.trim()) {
    const error = new Error('SMTP_PASS is missing. Add the Google-generated Gmail App Password to the backend environment.');
    error.code = 'SMTP_NOT_CONFIGURED';
    throw error;
  }
  return nodemailer.createTransport({
    host,
    port,
    secure: true,
    auth: { user, pass: password },
    tls: { rejectUnauthorized: true },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });
}

function detailsFor(notification) {
  const course = notification.courseName || 'GATE course';
  const code = notification.courseCode || '—';
  const amount = Number(notification.amount || 0).toLocaleString('en-IN');
  const details = [
    ['Student Name', notification.studentName],
    ['Student Email', notification.recipientEmail],
    ['Course Name', course],
    ['Course Code', code],
    ['Status', notification.displayStatus || notification.statusLabel || 'Received'],
    ['Date', new Date(notification.createdAt).toLocaleString('en-IN')],
  ].filter(([, value]) => Boolean(value));
  if (notification.enrollmentId) details.splice(2, 0, ['Enrollment ID', notification.enrollmentId]);
  if (notification.paymentId) {
    const paymentDetailsIndex = notification.enrollmentId ? 3 : 2;
    details.splice(paymentDetailsIndex, 0, ['Payment ID', notification.paymentId]);
    details.splice(paymentDetailsIndex + 1, 0, ['Payment Method', notification.paymentMethod || 'UPI']);
    details.splice(paymentDetailsIndex + 2, 0, ['Amount', `₹${amount}`]);
  }
  return details;
}

function contentFor(notification) {
  const name = notification.studentName || 'Student';
  const dashboardUrl = `${getWebsiteUrl()}/login`;
  const subjectSuffix = `– ${BRAND_NAME}`;
  const messages = {
    registration: {
      subject: `Registration Confirmation ${subjectSuffix}`,
      intro: `Your ${BRAND_NAME} student account was created successfully.`,
      status: 'Registration Successful',
      instruction: 'You can sign in to your student account to complete your profile and explore available GATE courses.',
    },
    course_enrollment: {
      subject: `Course Enrollment Confirmation ${subjectSuffix}`,
      intro: 'Your enrollment request has been received.',
      status: 'Enrollment Received',
      instruction: 'Please complete payment using the UPI option on the website if payment is still pending. We will notify you when the payment has been reviewed.',
    },
    payment_submitted: {
      subject: `Payment Submitted for Verification ${subjectSuffix}`,
      intro: 'We received your payment completion notification.',
      status: 'Verification Pending',
      instruction: 'This confirms submission for verification only; it does not mean your payment has been verified.',
    },
    payment_verified: {
      subject: `Payment Verified Successfully ${subjectSuffix}`,
      intro: 'Your payment has been successfully verified.',
      status: 'Payment Verified',
      instruction: 'Sign in to your Student Dashboard to view your enrollment and payment details.',
    },
    payment_rejected: {
      subject: `Payment Verification Update ${subjectSuffix}`,
      intro: 'We could not verify the submitted payment.',
      status: 'Payment Rejected',
      instruction: notification.reason
        ? `Reason provided: ${notification.reason} Contact academy support or submit updated payment information if needed.`
        : 'Please contact academy support or submit updated payment information if needed.',
    },
    enrollment_approved: {
      subject: `Enrollment Approved ${subjectSuffix}`,
      intro: 'Your course enrollment has been approved.',
      status: 'Enrollment Approved',
      instruction: 'Sign in to your Student Dashboard to review your enrollment details.',
    },
    enrollment_rejected: {
      subject: `Enrollment Status Update ${subjectSuffix}`,
      intro: 'Your course enrollment status has been updated.',
      status: 'Enrollment Rejected',
      instruction: notification.reason || 'Please contact academy support for assistance.',
    },
    enrollment_confirmed: {
      subject: `Enrollment Confirmed ${subjectSuffix}`,
      intro: 'Your course enrollment is confirmed.',
      status: 'Enrollment Confirmed',
      instruction: 'Sign in to your Student Dashboard to review your course details.',
    },
    admin_test: {
      subject: `Email Configuration Test ${subjectSuffix}`,
      intro: `This is a test message from the ${BRAND_NAME} administrator email configuration.`,
      status: 'Test Email',
      instruction: 'If you received this message, Gmail SMTP delivery is working.',
    },
  };
  const message = messages[notification.type];
  if (!message) throw new Error('Unsupported email notification type.');
  const details = detailsFor(notification);
  const rows = details.map(([label, value]) =>
    `<tr><td style="padding:9px 12px;border-bottom:1px solid #e7edf5;color:#596579">${escapeHtml(label)}</td><td style="padding:9px 12px;border-bottom:1px solid #e7edf5;color:#172b4d;font-weight:600">${escapeHtml(value)}</td></tr>`
  ).join('');
  const text = `Dear ${name},\n\n${message.intro}\n\n${details.map(([label, value]) => `${label}: ${value}`).join('\n')}\n\n${message.instruction}\n\nBest regards,\n${BRAND_NAME} Team\n${EMAIL_FROM}\n${dashboardUrl}`;
  const html = `<!doctype html><html><body style="margin:0;background:#f3f6fa;font-family:Arial,sans-serif;color:#172b4d"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:24px 12px"><tr><td align="center"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#fff;border-radius:14px;overflow:hidden"><tr><td style="background:#00245c;color:#fff;padding:24px 28px;font-size:20px;font-weight:700">${BRAND_NAME}</td></tr><tr><td style="padding:28px"><p>Dear ${escapeHtml(name)},</p><h1 style="font-size:22px;color:#00245c">${escapeHtml(message.status)}</h1><p>${escapeHtml(message.intro)}</p><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:20px 0">${rows}</table><p>${escapeHtml(message.instruction)}</p><p style="margin:28px 0"><a href="${escapeHtml(dashboardUrl)}" style="background:#0755a5;color:#fff;text-decoration:none;padding:12px 18px;border-radius:9px;display:inline-block">Visit Student Dashboard</a></p><p>Best regards,<br>${BRAND_NAME} Team<br><a href="mailto:${EMAIL_FROM}">${EMAIL_FROM}</a></p></td></tr></table></td></tr></table></body></html>`;
  return { subject: message.subject, html, text };
}

export function createEmailNotification({
  type,
  idempotencyKey,
  student,
  enrollment,
  payment,
  status,
  reason,
}) {
  const recipientEmail = String(student?.email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) return null;
  const stableKey = String(idempotencyKey || '');
  if (!stableKey) throw new Error('Email notification requires an idempotency key.');
  const createdAt = new Date().toISOString();
  const id = createHash('sha256').update(stableKey).digest('hex');
  return {
    id,
    idempotencyKey: stableKey,
    studentId: student.id || null,
    enrollmentId: enrollment?.id || null,
    paymentId: payment?.id || null,
    paymentMethod: payment?.paymentMethod || (payment ? 'UPI' : ''),
    type,
    recipientEmail,
    studentName: String(student.name || 'Student'),
    courseName: enrollment?.courseName || payment?.courseName || '',
    courseCode: enrollment?.courseCode || payment?.courseCode || '',
    amount: payment?.amount ?? enrollment?.courseFee ?? 0,
    displayStatus: status || '',
    reason: typeof reason === 'string' ? reason.trim().slice(0, 1000) : '',
    status: 'pending',
    attemptCount: 0,
    manualRetryCount: 0,
    createdAt,
    updatedAt: createdAt,
    nextAttemptAt: new Date(),
    sentAt: null,
    lastErrorCode: null,
    lastError: null,
  };
}

export function getEmailContent(notification) {
  return contentFor(notification);
}

function safeFailure(error) {
  const code = String(error?.code || error?.name || 'EMAIL_DELIVERY_FAILED')
    .replace(/[^A-Za-z0-9_-]/g, '').slice(0, 48);
  if (code === 'EAUTH' || code === 'InvalidLogin') {
    return { code: 'SMTP_AUTH_FAILED', message: 'Gmail rejected SMTP authentication. Check the backend App Password and 2-Step Verification.' };
  }
  if (['SMTP_NOT_CONFIGURED', 'SMTP_CONFIGURATION_INVALID', 'EMAIL_URL_NOT_CONFIGURED'].includes(code)) {
    return { code, message: error.message };
  }
  if (code.includes('TLS') || code === 'CERT_HAS_EXPIRED' || code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE') {
    return { code: 'SMTP_TLS_FAILED', message: 'Verified TLS connection to Gmail SMTP failed. Check the server clock and network TLS inspection settings.' };
  }
  return { code, message: 'Email delivery failed. Check backend network access and the Gmail SMTP configuration.' };
}

async function deliverOne() {
  const db = getMongoDatabase();
  const now = new Date();
  const staleSendingBefore = new Date(now.getTime() - 5 * 60_000).toISOString();
  const notification = await db.collection('emailNotifications').findOneAndUpdate(
    {
      $or: [
        { status: { $in: ['pending', 'retry'] }, nextAttemptAt: { $lte: now } },
        { status: 'sending', updatedAt: { $lte: staleSendingBefore } },
      ],
    },
    { $set: { status: 'sending', updatedAt: now.toISOString() }, $inc: { attemptCount: 1 } },
    { sort: { createdAt: 1 }, returnDocument: 'after' }
  );
  if (!notification) return false;

  try {
    const message = contentFor(notification);
    const transporter = getTransporter();
    await transporter.sendMail({
      from: `${BRAND_NAME} <${EMAIL_FROM}>`,
      to: notification.recipientEmail,
      subject: message.subject,
      html: message.html,
      text: message.text,
      messageId: `<${notification.id}@kinetiqacademy>`,
    });
    await db.collection('emailNotifications').updateOne(
      { id: notification.id, status: 'sending' },
      { $set: { status: 'sent', sentAt: new Date().toISOString(), updatedAt: new Date().toISOString(), lastError: null, lastErrorCode: null } }
    );
  } catch (error) {
    const failure = safeFailure(error);
    const terminal = notification.attemptCount >= MAX_ATTEMPTS ||
      ['SMTP_NOT_CONFIGURED', 'SMTP_CONFIGURATION_INVALID', 'EMAIL_URL_NOT_CONFIGURED'].includes(failure.code);
    const delayMinutes = Math.min(60, 2 ** Math.min(notification.attemptCount, 6));
    const nextAttemptAt = new Date(Date.now() + delayMinutes * 60_000);
    await db.collection('emailNotifications').updateOne(
      { id: notification.id, status: 'sending' },
      {
        $set: {
          status: terminal ? 'failed' : 'retry',
          updatedAt: new Date().toISOString(),
          nextAttemptAt,
          lastErrorCode: failure.code,
          lastError: failure.message,
        },
      }
    );
    console.warn(`Email notification delivery failed (${failure.code}); notification ${notification.id.slice(0, 12)} remains recorded.`);
  }
  return true;
}

async function runWorker() {
  if (workerRunning) return;
  workerRunning = true;
  try {
    await deliverOne();
  } catch (error) {
    const diagnostic = String(error?.code || error?.name || 'EMAIL_WORKER_FAILED')
      .replace(/[^A-Za-z0-9_-]/g, '').slice(0, 48);
    console.warn(`Email notification worker is waiting for MongoDB (${diagnostic}).`);
  } finally {
    workerRunning = false;
    if (workerEnabled) {
      workerTimer = setTimeout(runWorker, POLL_INTERVAL_MS);
      workerTimer.unref?.();
    } else {
      workerTimer = undefined;
    }
  }
}

export function startEmailNotificationWorker() {
  if (!workerEnabled) {
    workerEnabled = true;
    void runWorker();
  }
}

export function stopEmailNotificationWorker() {
  workerEnabled = false;
  if (workerTimer) clearTimeout(workerTimer);
  workerTimer = undefined;
}

export async function verifyEmailTransport() {
  await getTransporter().verify();
}

export async function queueAdminTestEmail(user) {
  const notification = createEmailNotification({
    type: 'admin_test',
    idempotencyKey: `admin-email-test:${user.id}:${Date.now()}`,
    student: user,
    status: 'Test email',
  });
  if (!notification) {
    const error = new Error('The administrator account does not have a valid registered email address.');
    error.code = 'ADMIN_EMAIL_MISSING';
    throw error;
  }
  const db = getMongoDatabase();
  await db.collection('emailNotifications').updateOne(
    { id: notification.id },
    { $setOnInsert: notification },
    { upsert: true }
  );
  return notification.id;
}

export async function retryEmailNotification(id) {
  const db = getMongoDatabase();
  const result = await db.collection('emailNotifications').updateOne(
    { id, status: { $in: ['failed', 'retry'] } },
    {
      $set: { status: 'pending', nextAttemptAt: new Date(), updatedAt: new Date().toISOString() },
      $inc: { manualRetryCount: 1 },
    }
  );
  return result.modifiedCount === 1;
}

export async function listEmailNotifications(limit = 200) {
  return getMongoDatabase().collection('emailNotifications')
    .find({})
    .sort({ createdAt: -1 })
    .limit(limit)
    .project({
      _id: 0,
      id: 1,
      studentId: 1,
      enrollmentId: 1,
      paymentId: 1,
      type: 1,
      recipientEmail: 1,
      studentName: 1,
      courseName: 1,
      status: 1,
      attemptCount: 1,
      manualRetryCount: 1,
      createdAt: 1,
      sentAt: 1,
      lastErrorCode: 1,
      lastError: 1,
    })
    .toArray();
}

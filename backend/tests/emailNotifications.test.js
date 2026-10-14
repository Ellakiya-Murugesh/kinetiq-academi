import test from 'node:test';
import assert from 'node:assert/strict';
import { createEmailNotification, getEmailContent } from '../services/emailNotifications.js';

const student = { id: 'std-1', name: 'Asha Student', email: 'asha@example.com', password: 'must-not-appear' };
const enrollment = { id: 'enr-1', courseName: 'GATE Chemistry', courseCode: 'CY' };
const payment = { id: 'pay-1', amount: 25000, courseName: 'GATE Chemistry', courseCode: 'CY' };

test('notification IDs and recipients derive from the registered student and stable event key', () => {
  const one = createEmailNotification({ type: 'course_enrollment', idempotencyKey: 'enrollment:enr-1', student, enrollment });
  const two = createEmailNotification({ type: 'course_enrollment', idempotencyKey: 'enrollment:enr-1', student, enrollment });
  assert.equal(one.id, two.id);
  assert.equal(one.recipientEmail, 'asha@example.com');
  assert.equal(one.studentId, student.id);
});

test('missing student email is rejected instead of accepting a caller-supplied recipient', () => {
  assert.equal(createEmailNotification({ type: 'registration', idempotencyKey: 'signup:1', student: { id: 's1', name: 'Asha' } }), null);
});

test('registration email includes login link and never includes password', () => {
  const notification = createEmailNotification({ type: 'registration', idempotencyKey: 'signup:1', student });
  const content = getEmailContent(notification);
  assert.match(content.subject, /Registration Confirmation/);
  assert.match(content.text, /Asha Student/);
  assert.match(content.html, /Visit Student Dashboard/);
  assert.doesNotMatch(content.text + content.html, /must-not-appear/);
});

test('payment submission states verification is pending, not verified', () => {
  const notification = createEmailNotification({
    type: 'payment_submitted', idempotencyKey: 'payment-submitted:pay-1:2026-01-01',
    student, enrollment, payment, status: 'Verification Pending',
  });
  const content = getEmailContent(notification);
  assert.match(content.subject, /Payment Submitted for Verification/);
  assert.match(content.text, /does not mean your payment has been verified/);
  assert.match(content.html, /Verification Pending/);
});

test('course enrollment confirmation includes course, fee, and enrollment identity', () => {
  const notification = createEmailNotification({
    type: 'course_enrollment', idempotencyKey: 'course-enrollment:enr-1',
    student, enrollment, payment, status: 'Pending Payment',
  });
  const content = getEmailContent(notification);
  assert.match(content.subject, /Course Enrollment Confirmation/);
  assert.match(content.text, /Enrollment ID: enr-1/);
  assert.match(content.text, /Course Code: CY/);
  assert.match(content.text, /₹25,000/);
});

test('payment verification and rejection have separate subjects and instructions', () => {
  const verified = createEmailNotification({
    type: 'payment_verified', idempotencyKey: 'payment-verified:pay-1',
    student, enrollment, payment, status: 'Verified',
  });
  const rejected = createEmailNotification({
    type: 'payment_rejected', idempotencyKey: 'payment-rejected:pay-2',
    student, enrollment, payment, status: 'Rejected', reason: 'Reference could not be confirmed.',
  });
  assert.match(getEmailContent(verified).subject, /Payment Verified Successfully/);
  assert.match(getEmailContent(rejected).text, /Reference could not be confirmed/);
});

test('enrollment status notifications use distinct approved, rejected, and confirmed messaging', () => {
  const types = ['enrollment_approved', 'enrollment_rejected', 'enrollment_confirmed'];
  const content = types.map((type) => getEmailContent(createEmailNotification({
    type,
    idempotencyKey: `status:${type}:enr-1`,
    student,
    enrollment,
    status: type,
  })));
  assert.match(content[0].subject, /Enrollment Approved/);
  assert.match(content[1].subject, /Enrollment Status Update/);
  assert.match(content[2].subject, /Enrollment Confirmed/);
});

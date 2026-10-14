import assert from 'node:assert/strict';
import test from 'node:test';
import express from 'express';
import { createStudentEnrollmentRouter } from '../routes/studentEnrollment.js';
import { GATE_COURSE_CATALOG_ID, GATE_COURSE_FEE } from '../utils/gateEnrollment.js';

function createHarness() {
  let database = {
    courses: [],
    payments: [],
    enrollments: [],
  };
  let nextId = 0;
  const notifications = [];
  const app = express();
  app.use(express.json());
  app.use('/api/student', (req, _res, next) => {
    const id = req.get('x-student-id') || 'student-1';
    req.student = {
      id,
      name: id === 'student-1' ? 'Test Student' : 'Other Student',
      email: `${id}@example.com`,
      courseId: 'gate-chemistry-100-day',
    };
    next();
  }, createStudentEnrollmentRouter({
    loadDatabase: async () => database,
    persistDatabase: async (updatedDatabase, { notifications: queued = [] } = {}) => {
      database = updatedDatabase;
      notifications.push(...queued);
      await new Promise((resolve) => setImmediate(resolve));
    },
    makeId: () => `test-${++nextId}`,
    now: () => new Date('2026-10-12T10:00:00.000Z'),
    makeNotification: (notification) => ({ ...notification, id: `notification-${notifications.length + 1}` }),
  }));
  const server = app.listen(0, '127.0.0.1');

  return new Promise((resolve) => {
    server.once('listening', () => resolve({
      notifications,
      get database() { return database; },
      request: (path, { method = 'GET', body, studentId = 'student-1' } = {}) =>
        fetch(`http://127.0.0.1:${server.address().port}/api/student${path}`, {
          method,
          headers: { 'Content-Type': 'application/json', 'x-student-id': studentId },
          ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        }),
      close: () => new Promise((done, reject) => server.close((error) => error ? reject(error) : done())),
    }));
  });
}

test('enrollment options expose only the supported GATE courses for the authenticated student', async (t) => {
  const api = await createHarness();
  t.after(api.close);

  const response = await api.request('/enrollment/options');
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.courseId, GATE_COURSE_CATALOG_ID);
  assert.deepEqual(body.courses.map((course) => course.code), [
    'GATE-CY',
    'GATE-PH',
    'GATE-ME',
    'GATE-CSE',
    'GATE-ECE',
  ]);
  assert.equal(body.student.id, 'student-1');
});

test('enrollment creates a pending payment and confirmation queues notifications without marking it paid', async (t) => {
  const api = await createHarness();
  t.after(api.close);

  const invalid = await api.request('/enrollments', {
    method: 'POST',
    body: { courseId: GATE_COURSE_CATALOG_ID, courseCode: 'GATE-EE', amount: 1 },
  });
  assert.equal(invalid.status, 400);

  const created = await api.request('/enrollments', {
    method: 'POST',
    body: { courseId: GATE_COURSE_CATALOG_ID, courseCode: 'GATE-CSE', amount: 1 },
  });
  const createdBody = await created.json();
  assert.equal(created.status, 201);
  assert.ok(createdBody.payment.id);
  assert.equal(api.database.payments.length, 1);
  assert.equal(api.database.payments[0].amount, GATE_COURSE_FEE);
  assert.equal(api.database.payments[0].status, 'Payment Pending');
  assert.equal(api.database.enrollments[0].paymentStatus, 'Payment Pending');
  assert.equal(api.database.enrollments[0].courseStatus, 'Pending Payment');
  assert.equal(api.notifications[0].type, 'course_enrollment');

  const repeated = await api.request('/enrollments', {
    method: 'POST',
    body: { courseId: GATE_COURSE_CATALOG_ID, courseCode: 'GATE-CSE' },
  });
  assert.equal(repeated.status, 200);
  assert.equal((await repeated.json()).payment.id, createdBody.payment.id);
  assert.equal(api.database.payments.length, 1);

  const submitted = await api.request(`/payments/${createdBody.payment.id}/confirm`, { method: 'POST' });
  assert.equal(submitted.status, 200);
  assert.equal(api.database.payments[0].status, 'Payment Verification Pending');
  assert.equal(api.database.enrollments[0].paymentStatus, 'Payment Verification Pending');
  assert.equal(api.notifications[1].type, 'payment_submitted');

  const duplicateSubmission = await api.request(`/payments/${createdBody.payment.id}/confirm`, { method: 'POST' });
  assert.equal(duplicateSubmission.status, 200);
  assert.equal(api.notifications.length, 2);
});

test('payment details and confirmation are scoped to the authenticated student', async (t) => {
  const api = await createHarness();
  t.after(api.close);

  const created = await api.request('/enrollments', {
    method: 'POST',
    body: { courseId: GATE_COURSE_CATALOG_ID, courseCode: 'GATE-PH' },
  });
  const { payment } = await created.json();
  const response = await api.request(`/payments/${payment.id}`, { studentId: 'student-2' });
  assert.equal(response.status, 404);

  const confirmResponse = await api.request(`/payments/${payment.id}/confirm`, {
    method: 'POST',
    studentId: 'student-2',
  });
  assert.equal(confirmResponse.status, 404);
  assert.equal(api.database.payments[0].status, 'Payment Pending');
});

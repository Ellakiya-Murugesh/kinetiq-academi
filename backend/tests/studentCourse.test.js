import assert from 'node:assert/strict';
import test from 'node:test';
import express from 'express';
import { createStudentCourseRouter } from '../routes/studentCourse.js';
import { normalizeCoursePayload } from '../utils/adminCatalog.js';

const student = {
  id: 'student-1',
  courseId: 'course-chem',
  exam: 'GATE',
  subject: 'Chemistry',
  paymentStatus: 'Paid',
};

function createDatabase() {
  return {
    courses: [
      {
        id: 'course-chem',
        name: 'GATE Chemistry',
        subject: 'Chemistry',
        status: 'Published',
        startDate: '2026-11-01',
        duration: '100 Days Intensive',
        modules: [{
          id: 'module-1',
          title: 'Foundations',
          totalLessons: 5,
          completedLessons: 2,
          status: 'Completed',
          lessons: [
            { id: 'lesson-1', title: 'Vectors', completed: true },
            { id: 'lesson-2', title: 'Operators' },
          ],
        }],
      },
      { id: 'other-course', name: 'Other student course', subject: 'Physics' },
    ],
    enrollments: [
      {
        id: 'enrollment-1',
        studentId: student.id,
        courseId: student.courseId,
        enrollmentDate: '2026-10-01',
        paymentId: 'payment-1',
        paymentStatus: 'Paid',
        courseStatus: 'Active',
      },
      {
        id: 'other-enrollment',
        studentId: 'student-2',
        courseId: 'other-course',
        paymentId: 'other-payment',
      },
    ],
    payments: [
      { id: 'payment-1', studentId: student.id, courseId: student.courseId, status: 'Paid' },
      { id: 'other-payment', studentId: 'student-2', status: 'Paid' },
    ],
    lessonProgress: [],
  };
}

async function startApi({ currentStudent = student, loadError, database = createDatabase() } = {}) {
  const loggedErrors = [];
  const app = express();
  app.use('/api/student', (req, res, next) => {
    if (req.get('authorization') !== 'Bearer test-token') {
      return res.status(401).json({ message: 'Authentication required.' });
    }
    req.student = currentStudent;
    return next();
  }, createStudentCourseRouter({
    loadDatabase: async () => {
      if (loadError) throw loadError;
      return structuredClone(database);
    },
    persistDatabase: async (updatedDatabase) => {
      Object.assign(database, structuredClone(updatedDatabase));
    },
    logError: (message) => loggedErrors.push(message),
  }));
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));

  return {
    loggedErrors,
    request: (pathOrHeaders = '/course', options = {}) => {
      const path = typeof pathOrHeaders === 'string' ? pathOrHeaders : '/course';
      const requestOptions = typeof pathOrHeaders === 'string'
        ? options
        : { ...options, headers: pathOrHeaders };
      return fetch(
        `http://127.0.0.1:${server.address().port}/api/student${path}`,
        requestOptions,
      );
    },
    close: () => new Promise((resolve, reject) =>
      server.close((error) => error ? reject(error) : resolve())
    ),
    database,
  };
}

const authHeaders = { Authorization: 'Bearer test-token' };

test('course endpoint returns only the eligible authenticated student course and enrollment status', async (t) => {
  const api = await startApi();
  t.after(api.close);

  const response = await api.request(authHeaders);
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.course.id, student.courseId);
  assert.equal(body.course.subject, 'Chemistry');
  assert.equal(body.student.id, student.id);
  assert.equal(body.accessStatus, 'available');
  assert.equal(body.enrollment.paymentStatus, 'Paid');
  assert.equal(body.enrollment.courseStatus, 'Active');
  assert.equal(body.payment.status, 'Paid');
  assert.equal(body.modules[0].totalLessons, 2);
  assert.equal(body.modules[0].completedLessons, 0);
  assert.equal(body.modules[0].status, 'Upcoming');
  assert.deepEqual(body.modules[0].lessons.map((lesson) => lesson.completed), [false, false]);
  assert.deepEqual(body.progress, { completedLessons: 0, totalLessons: 2 });
  assert.equal(body.overallProgress, 0);
  assert.equal(body.course.modules[0].completedLessons, 0);
});

test('course endpoint returns freshly updated canonical details and published curriculum without caching', async (t) => {
  const database = createDatabase();
  const api = await startApi({ database });
  t.after(api.close);

  const firstResponse = await api.request(authHeaders);
  assert.equal(firstResponse.headers.get('cache-control'), 'no-store');
  await firstResponse.json();

  const update = normalizeCoursePayload({
    ...database.courses[0],
    name: 'Updated GATE Chemistry',
    description: 'Updated course description.',
    duration: '120 Days Intensive',
    status: 'Published',
    modules: [{
      id: 'module-updated',
      title: 'Updated Foundations',
      status: 'Published',
      lessons: [{
        id: 'lesson-updated',
        title: 'Updated Atomic Structure',
        status: 'Published',
      }],
    }],
  }, database.courses[0]);
  assert.equal(update.error, undefined);
  database.courses[0] = update.course;

  const refreshedResponse = await api.request(authHeaders);
  const body = await refreshedResponse.json();
  assert.equal(body.course.id, student.courseId);
  assert.equal(body.course.name, 'Updated GATE Chemistry');
  assert.equal(body.course.description, 'Updated course description.');
  assert.equal(body.course.duration, '120 Days Intensive');
  assert.deepEqual(body.modules.map((module) => ({
    id: module.id,
    title: module.title,
    lessons: module.lessons.map((lesson) => lesson.title),
  })), [{
    id: 'module-updated',
    title: 'Updated Foundations',
    lessons: ['Updated Atomic Structure'],
  }]);
});

test('pending payment withholds course content and rejects lesson completion', async (t) => {
  const database = createDatabase();
  database.enrollments[0].paymentStatus = 'Payment Verification Pending';
  database.enrollments[0].courseStatus = 'Pending Payment';
  database.payments[0].status = 'Payment Verification Pending';
  const api = await startApi({ database });
  t.after(api.close);

  const response = await api.request(authHeaders);
  const body = await response.json();
  assert.equal(body.accessStatus, 'access-pending');
  assert.equal(body.course, null);
  assert.deepEqual(body.modules, []);
  assert.equal(body.payment.status, 'Payment Verification Pending');

  const completion = await api.request(
    '/course/modules/module-1/lessons/lesson-1/complete',
    { method: 'POST', headers: authHeaders },
  );
  assert.equal(completion.status, 403);
  assert.deepEqual(database.lessonProgress, []);
});

test('student curriculum excludes draft courses, modules, and lessons', async (t) => {
  const database = createDatabase();
  database.courses[0].modules.push({
    id: 'module-draft',
    title: 'Unpublished Module',
    status: 'Draft',
    lessons: [{ id: 'lesson-draft', title: 'Unpublished Lesson', status: 'Published' }],
  });
  database.courses[0].modules[0].lessons[1].status = 'Draft';
  const api = await startApi({ database });
  t.after(api.close);

  const response = await api.request(authHeaders);
  const body = await response.json();
  assert.equal(body.modules.length, 1);
  assert.equal(body.modules[0].totalLessons, 1);
  assert.deepEqual(body.modules[0].lessons.map((lesson) => lesson.id), ['lesson-1']);
  assert.deepEqual(body.progress, { completedLessons: 0, totalLessons: 1 });
});

test('course endpoint does not substitute another course when the student has no assignment', async (t) => {
  const api = await startApi({ currentStudent: { ...student, id: 'student-without-course', courseId: undefined } });
  t.after(api.close);

  const response = await api.request(authHeaders);
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.course, null);
  assert.deepEqual(body.modules, []);
});

test('course endpoint requires authentication', async (t) => {
  const api = await startApi();
  t.after(api.close);

  const response = await api.request();
  assert.equal(response.status, 401);
});

test('lesson completion persists once, updates module and overall progress, and remains isolated by student', async (t) => {
  const database = createDatabase();
  const api = await startApi({ database });
  t.after(api.close);

  const firstCompletion = await api.request(
    '/course/modules/module-1/lessons/lesson-1/complete',
    { method: 'POST', headers: authHeaders },
  );
  assert.equal(firstCompletion.status, 200);
  const firstBody = await firstCompletion.json();
  assert.equal(firstBody.progress.completedLessons, 1);
  assert.equal(firstBody.progress.totalLessons, 2);
  assert.equal(firstBody.progress.overallProgress, 50);
  assert.equal(firstBody.modules[0].status, 'In Progress');
  assert.deepEqual(database.lessonProgress.map((record) => record.lessonId), ['lesson-1']);

  const duplicateCompletion = await api.request(
    '/course/modules/module-1/lessons/lesson-1/complete',
    { method: 'POST', headers: authHeaders },
  );
  assert.equal(duplicateCompletion.status, 200);
  assert.equal((await duplicateCompletion.json()).progress.completedLessons, 1);
  assert.equal(database.lessonProgress.length, 1);

  const reloaded = await api.request(authHeaders);
  const reloadedBody = await reloaded.json();
  assert.equal(reloadedBody.overallProgress, 50);
  assert.equal(reloadedBody.modules[0].lessons[0].completed, true);

  const secondStudentApi = await startApi({
    currentStudent: { ...student, id: 'student-2' },
    database,
  });
  t.after(secondStudentApi.close);
  const secondStudentCourse = await secondStudentApi.request(authHeaders);
  const secondStudentBody = await secondStudentCourse.json();
  assert.equal(secondStudentBody.overallProgress, 0);
  assert.deepEqual(secondStudentBody.progress, { completedLessons: 0, totalLessons: 2 });

  const finalCompletion = await api.request(
    '/course/modules/module-1/lessons/lesson-2/complete',
    { method: 'POST', headers: authHeaders },
  );
  const finalBody = await finalCompletion.json();
  assert.equal(finalCompletion.status, 200);
  assert.equal(finalBody.progress.completedLessons, 2);
  assert.equal(finalBody.progress.overallProgress, 100);
  assert.equal(finalBody.modules[0].status, 'Completed');
});

test('lesson completion rejects lesson IDs that are not in the student course', async (t) => {
  const api = await startApi();
  t.after(api.close);

  const response = await api.request(
    '/course/modules/module-1/lessons/other-student-lesson/complete',
    { method: 'POST', headers: authHeaders },
  );
  assert.equal(response.status, 404);
  assert.deepEqual(api.database.lessonProgress, []);
});

test('course database failures return a safe retryable error', async (t) => {
  const api = await startApi({ loadError: Object.assign(new Error('private database detail'), { code: 'MONGODB_UNAVAILABLE' }) });
  t.after(api.close);

  const response = await api.request(authHeaders);
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), {
    message: 'Your course information is temporarily unavailable. Please try again.',
  });
  assert.deepEqual(api.loggedErrors, ['Student course load failed (MONGODB_UNAVAILABLE).']);
});

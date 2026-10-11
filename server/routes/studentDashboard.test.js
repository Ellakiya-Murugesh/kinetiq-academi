import assert from 'node:assert/strict';
import test from 'node:test';
import express from 'express';
import { createStudentDashboardRouter } from './studentDashboard.js';

const student = {
  id: 'student-1',
  userId: 'user-1',
  name: 'Test Student',
  role: 'STUDENT',
  exam: 'GATE',
  subject: 'Chemistry',
  courseId: 'course-1',
};

function createDatabase(announcements = []) {
  return {
    courses: [{ id: 'course-1', name: 'GATE Chemistry Course' }],
    liveSessions: [
      { id: 'session-1', status: 'Published', exam: 'GATE', subject: 'Chemistry', title: 'Chemistry Review' },
    ],
    results: [
      { id: 'result-1', studentId: 'student-1', testName: 'Mock Test', percentage: 80 },
      { id: 'other-result', studentId: 'student-2', testName: 'Private Result', percentage: 100 },
    ],
    announcements,
  };
}

async function startApi({ database = createDatabase(), loadError, userRole = 'STUDENT' } = {}) {
  const loggedErrors = [];
  const app = express();
  app.use('/api/student', (req, res, next) => {
    if (req.get('authorization') !== 'Bearer test-student-session') {
      return res.status(401).json({ message: 'Authentication required.' });
    }
    if (userRole !== 'STUDENT') {
      return res.status(403).json({ message: 'Student access required.' });
    }
    req.student = student;
    req.user = { id: student.userId, role: 'STUDENT' };
    return next();
  }, createStudentDashboardRouter({
    loadDatabase: async () => {
      if (loadError) throw loadError;
      return structuredClone(database);
    },
    logError: (message) => loggedErrors.push(message),
  }));
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}/api/student`;
  return {
    loggedErrors,
    request: (path, headers = {}) => fetch(`${baseUrl}${path}`, { headers }),
    close: () => new Promise((resolve, reject) =>
      server.close((error) => error ? reject(error) : resolve())
    ),
  };
}

const authHeaders = { Authorization: 'Bearer test-student-session' };

test('student announcements return only active notices authorized for the current student', async (t) => {
  const api = await startApi({
    database: createDatabase([
      { id: 'all', title: 'All students', message: 'General notice', status: 'Active', audience: 'All students' },
      { id: 'exam', title: 'GATE students', message: 'GATE notice', status: 'Active', audience: 'GATE students' },
      { id: 'subject', title: 'Chemistry', message: 'Subject notice', status: 'Active', audience: 'Chemistry' },
      { id: 'other-subject', title: 'Physics', message: 'Other subject notice', status: 'Active', audience: 'Physics' },
      { id: 'draft', title: 'Draft', message: 'Unpublished', status: 'Draft', audience: 'All students' },
      { id: 'published', title: 'Published', message: 'Published notice', status: 'Published', audience: 'GATE students' },
      { id: 'other-course', title: 'Other course', message: 'Private', status: 'Active', audience: 'All students', courseId: 'another-course' },
      null,
    ]),
  });
  t.after(api.close);

  const response = await api.request('/announcements', authHeaders);
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.deepEqual(body.map((notice) => notice.id), ['all', 'exam', 'subject', 'published']);
  assert.equal(body[0].message, 'General notice');
  assert.equal('audience' in body[0], false);
});

test('student announcements return an empty array when there are no authorized notices', async (t) => {
  const api = await startApi({ database: createDatabase([]) });
  t.after(api.close);

  const response = await api.request('/announcements', authHeaders);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), []);
});

test('student dashboard returns only the current student results and their course data', async (t) => {
  const api = await startApi({
    database: createDatabase([
      { id: 'all', title: 'General', message: 'Notice', status: 'Active', audience: 'All students' },
    ]),
  });
  t.after(api.close);

  const response = await api.request('/dashboard', authHeaders);
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.student.id, student.id);
  assert.equal(body.course.id, 'course-1');
  assert.deepEqual(body.syllabusProgress, { percentage: 0, status: 'Not Yet Started' });
  assert.deepEqual(body.recentResults.map((result) => result.id), ['result-1']);
  assert.equal(body.upcomingClass.id, 'session-1');
  assert.deepEqual(body.announcements.map((notice) => notice.id), ['all']);
  assert.equal('upcomingTest' in body, false);
});

test('student dashboard displays existing progress without resetting it', async (t) => {
  const progressedStudent = { ...student, progress: 64 };
  const app = express();
  app.use('/api/student', (req, _res, next) => {
    req.student = progressedStudent;
    next();
  }, createStudentDashboardRouter({
    loadDatabase: async () => createDatabase([]),
    logError: () => {},
  }));
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  t.after(() => new Promise((resolve, reject) =>
    server.close((error) => error ? reject(error) : resolve())
  ));

  const response = await fetch(`http://127.0.0.1:${server.address().port}/api/student/dashboard`);
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(progressedStudent.progress, 64);
  assert.deepEqual(body.syllabusProgress, { percentage: 64, status: 'In Progress' });
});

test('student dashboard succeeds with empty optional data collections', async (t) => {
  const database = createDatabase([]);
  delete database.courses;
  delete database.liveSessions;
  delete database.results;
  delete database.announcements;
  const api = await startApi({ database });
  t.after(api.close);

  const response = await api.request('/dashboard', authHeaders);
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.course, null);
  assert.equal(body.upcomingClass, null);
  assert.deepEqual(body.recentResults, []);
  assert.deepEqual(body.syllabusProgress, { percentage: 0, status: 'Not Yet Started' });
});

test('student dashboard clamps invalid or absent progress to the not-started display', async (t) => {
  for (const progress of [undefined, -1, 101, 'not-a-number']) {
    const currentStudent = { ...student, progress };
    const app = express();
    app.use('/api/student', (req, _res, next) => {
      req.student = currentStudent;
      next();
    }, createStudentDashboardRouter({
      loadDatabase: async () => createDatabase([]),
      logError: () => {},
    }));
    const server = app.listen(0, '127.0.0.1');
    await new Promise((resolve) => server.once('listening', resolve));
    try {
      const response = await fetch(`http://127.0.0.1:${server.address().port}/api/student/dashboard`);
      const body = await response.json();
      assert.equal(response.status, 200);
      assert.deepEqual(body.syllabusProgress, { percentage: 0, status: 'Not Yet Started' });
      assert.equal(currentStudent.progress, progress);
    } finally {
      await new Promise((resolve, reject) =>
        server.close((error) => error ? reject(error) : resolve())
      );
    }
  }
});

test('student dashboard endpoints reject unauthenticated requests', async (t) => {
  const api = await startApi();
  t.after(api.close);

  for (const path of ['/dashboard', '/announcements']) {
    const response = await api.request(path);
    assert.equal(response.status, 401);
  }
});

test('student dashboard endpoints reject authenticated non-student accounts', async (t) => {
  const api = await startApi({ userRole: 'ADMIN' });
  t.after(api.close);

  for (const path of ['/dashboard', '/announcements']) {
    const response = await api.request(path, authHeaders);
    assert.equal(response.status, 403);
  }
});

test('announcement database failures return a safe unavailable response and diagnostic log', async (t) => {
  const api = await startApi({ loadError: Object.assign(new Error('sensitive connection details'), { code: 'MONGODB_UNAVAILABLE' }) });
  t.after(api.close);

  const response = await api.request('/announcements', authHeaders);
  const body = await response.json();
  assert.equal(response.status, 503);
  assert.match(body.message, /temporarily unavailable/i);
  assert.doesNotMatch(JSON.stringify(body), /sensitive connection details/);
  assert.deepEqual(api.loggedErrors, ['Student announcements load failed (MONGODB_UNAVAILABLE).']);
});

test('dashboard database failures return a safe unavailable response', async (t) => {
  const api = await startApi({ loadError: Object.assign(new Error('sensitive connection details'), { code: 'MONGODB_UNAVAILABLE' }) });
  t.after(api.close);

  const response = await api.request('/dashboard', authHeaders);
  const body = await response.json();
  assert.equal(response.status, 503);
  assert.match(body.message, /temporarily unavailable/i);
  assert.doesNotMatch(JSON.stringify(body), /sensitive connection details/);
});

test('a missing announcements collection is reported as unavailable rather than fake success', async (t) => {
  const database = createDatabase();
  delete database.announcements;
  const api = await startApi({ database });
  t.after(api.close);

  const response = await api.request('/announcements', authHeaders);
  assert.equal(response.status, 503);
});

import assert from 'node:assert/strict';
import test from 'node:test';
import express from 'express';
import {
  createStudentMaterialsRouter,
  isSafeMaterialFileUrl,
  selectStudentMaterials,
} from '../routes/studentMaterials.js';

const student = {
  id: 'student-1',
  courseId: 'gate-cse-100-day',
  exam: 'GATE',
};

function material(overrides = {}) {
  return {
    id: 'material-1',
    title: 'Study Notes',
    exam: 'GATE',
    subject: 'CSE',
    category: 'Study Notes',
    description: 'Real test resource',
    fileUrl: 'https://files.example.test/notes.pdf',
    fileSize: '1 MB',
    pages: 10,
    accessLevel: 'Enrolled Students Only',
    status: 'Published',
    ...overrides,
  };
}

test('student materials include published matching-exam resources across all supported categories', () => {
  const subjects = ['CSE', 'IT', 'ME', 'ECE', 'Chemistry', 'Physics'];
  const rows = subjects.map((subject, index) => material({
    id: `material-${index}`,
    subject,
  }));

  const result = selectStudentMaterials({ materials: rows }, student);

  assert.deepEqual(result.map((row) => row.subject), subjects);
  assert.equal(result[0].fileUrl, rows[0].fileUrl);
  assert.equal('passwordHash' in result[0], false);
});

test('student materials omit drafts, other exams, unrelated course resources, and unentitled records', () => {
  const rows = [
    material({ id: 'draft', status: 'Draft' }),
    material({ id: 'other-exam', exam: 'CSIR NET' }),
    material({ id: 'other-course', courseId: 'another-course' }),
    material({ id: 'no-access', accessLevel: 'Staff Only' }),
    material({ id: 'bad-url', fileUrl: '' }),
  ];

  assert.deepEqual(selectStudentMaterials({ materials: rows }, student), []);
});

test('public material is available to authenticated students but enrolled-only material requires an assigned course', () => {
  const rows = [
    material({ id: 'public', accessLevel: 'Public', courseId: undefined }),
    material({ id: 'enrolled', accessLevel: 'Enrolled Students Only' }),
  ];

  assert.deepEqual(
    selectStudentMaterials({ materials: rows }, { ...student, courseId: undefined })
      .map((row) => row.id),
    ['public']
  );
});

test('missing optional materials collection returns an empty list', () => {
  assert.deepEqual(selectStudentMaterials({}, student), []);
});

test('material URLs must be HTTPS or safe site-relative paths', () => {
  assert.equal(isSafeMaterialFileUrl('https://files.example.test/notes.pdf'), true);
  assert.equal(isSafeMaterialFileUrl('/downloads/notes.pdf'), true);
  assert.equal(isSafeMaterialFileUrl('http://files.example.test/notes.pdf'), false);
  assert.equal(isSafeMaterialFileUrl('//files.example.test/notes.pdf'), false);
  assert.equal(isSafeMaterialFileUrl('/downloads/%2e%2e/private.pdf'), false);
  assert.equal(isSafeMaterialFileUrl(''), false);
});

test('materials endpoint requires the outer student authentication middleware and supports retryable failures', async (t) => {
  const loggedErrors = [];
  const app = express();
  app.use('/api/student', (req, res, next) => {
    if (req.get('authorization') !== 'Bearer test-session') {
      return res.status(401).json({ message: 'Authentication required.' });
    }
    req.student = student;
    return next();
  }, createStudentMaterialsRouter({
    loadDatabase: async () => ({ materials: [material()] }),
    logError: (message) => loggedErrors.push(message),
  }));

  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  t.after(() => new Promise((resolve, reject) =>
    server.close((error) => error ? reject(error) : resolve())
  ));

  const baseUrl = `http://127.0.0.1:${server.address().port}/api/student/materials`;
  const unauthorized = await fetch(baseUrl);
  assert.equal(unauthorized.status, 401);

  const authorized = await fetch(baseUrl, { headers: { Authorization: 'Bearer test-session' } });
  assert.equal(authorized.status, 200);
  assert.deepEqual((await authorized.json()).map((row) => row.id), ['material-1']);

  const failedApp = express();
  failedApp.use('/api/student', (req, _res, next) => {
    req.student = student;
    next();
  }, createStudentMaterialsRouter({
    loadDatabase: async () => { throw Object.assign(new Error('private detail'), { code: 'DB_DOWN' }); },
    logError: (message) => loggedErrors.push(message),
  }));
  const failedServer = failedApp.listen(0, '127.0.0.1');
  await new Promise((resolve) => failedServer.once('listening', resolve));
  t.after(() => new Promise((resolve, reject) =>
    failedServer.close((error) => error ? reject(error) : resolve())
  ));
  const failedResponse = await fetch(`http://127.0.0.1:${failedServer.address().port}/api/student/materials`);
  assert.equal(failedResponse.status, 503);
  assert.equal((await failedResponse.json()).message, 'Study materials are temporarily unavailable. Please try again.');
  assert.deepEqual(loggedErrors, ['Student materials load failed (DB_DOWN).']);
});

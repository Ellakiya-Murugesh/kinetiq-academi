import assert from 'node:assert/strict';
import test from 'node:test';
import express from 'express';
import jwt from 'jsonwebtoken';
import { authenticateToken, JWT_SECRET } from '../middleware/auth.js';
import { createStudentProfileRouter } from './studentProfile.js';

const initialData = () => ({
  users: [
    {
      id: 'student-user-1',
      role: 'STUDENT',
      status: 'ACTIVE',
      name: 'Test Student',
      email: 'student@example.com',
      phone: '+919876543210',
    },
    {
      id: 'student-user-2',
      role: 'STUDENT',
      status: 'ACTIVE',
      name: 'Other Student',
      email: 'other@example.com',
      phone: '+919876543211',
    },
    {
      id: 'admin-user',
      role: 'ADMIN',
      status: 'ACTIVE',
      name: 'Administrator',
      email: 'admin@example.com',
      phone: '+919876543212',
    },
  ],
  students: [
    {
      id: 'student-record-1',
      userId: 'student-user-1',
      name: 'Test Student',
      email: 'student@example.com',
      phone: '+919876543210',
      dateOfBirth: '2000-01-02',
      gender: 'Female',
      address: 'Old address',
      qualification: 'B.Sc.',
      college: 'Example College',
      gatePaper: 'Chemistry',
      gateAttemptYear: '2027',
    },
    {
      id: 'student-record-2',
      userId: 'student-user-2',
      name: 'Other Student',
      email: 'other@example.com',
      phone: '+919876543211',
    },
  ],
});

async function startProfileApi({ loadError, persistError } = {}) {
  let data = initialData();
  const app = express();
  app.use(express.json());

  const authenticateStudent = (req, res, next) => {
    const user = data.users.find((record) => record.id === req.get('x-test-user'));
    if (!user) return res.status(401).json({ message: 'Authentication required.' });
    if (user.role !== 'STUDENT') return res.status(403).json({ message: 'Student access required.' });
    const student = data.students.find((record) => record.userId === user.id);
    if (!student) return res.status(404).json({ message: 'Student profile not found.' });
    req.user = user;
    req.student = student;
    return next();
  };

  app.use('/api/student/profile', createStudentProfileRouter({
    authenticateStudent,
    loadDatabase: async () => {
      if (loadError) throw loadError;
      return structuredClone(data);
    },
    persistDatabase: async (updatedData) => {
      if (persistError) throw persistError;
      data = structuredClone(updatedData);
    },
  }));

  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  return {
    get data() {
      return structuredClone(data);
    },
    baseUrl: `http://127.0.0.1:${server.address().port}/api/student/profile`,
    close: () => new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    }),
  };
}

function studentHeaders(userId = 'student-user-1') {
  return { 'Content-Type': 'application/json', 'x-test-user': userId };
}

test('profile GET returns only the authenticated student and uses account contact details', async (t) => {
  const api = await startProfileApi();
  t.after(api.close);

  const response = await fetch(api.baseUrl, { headers: studentHeaders() });
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.student.id, 'student-record-1');
  assert.equal(body.student.email, 'student@example.com');
  assert.equal(body.student.phone, '+919876543210');
  assert.equal(body.student.address, 'Old address');
  assert.notEqual(body.student.id, 'student-record-2');
});

test('profile PUT persists editable details, keeps mobile read-only, and returns data for reload', async (t) => {
  const api = await startProfileApi();
  t.after(api.close);

  const response = await fetch(api.baseUrl, {
    method: 'PUT',
    headers: studentHeaders(),
    body: JSON.stringify({
      name: 'Updated Student',
      email: 'updated@example.com',
      phone: '+910000000000',
      address: 'New address',
      dateOfBirth: '2001-05-06',
      gender: 'Prefer not to say',
      qualification: 'M.Sc.',
      college: 'New University',
      gatePaper: 'Physics',
      gateAttemptYear: '2028',
      subject: 'Unauthorized subject change',
    }),
  });
  const saved = await response.json();

  assert.equal(response.status, 200);
  assert.equal(saved.student.name, 'Updated Student');
  assert.equal(saved.student.phone, '+919876543210');
  assert.equal(saved.student.subject, undefined);
  assert.equal(api.data.users[0].phone, '+919876543210');
  assert.equal(api.data.students[0].phone, '+919876543210');
  assert.equal(api.data.students[0].subject, undefined);

  const reload = await fetch(api.baseUrl, { headers: studentHeaders() });
  const reloaded = await reload.json();
  assert.equal(reload.status, 200);
  assert.equal(reloaded.student.email, 'updated@example.com');
  assert.equal(reloaded.student.address, 'New address');
  assert.equal(reloaded.student.dateOfBirth, '2001-05-06');
  assert.equal(reloaded.student.gateAttemptYear, '2028');
});

test('profile GET safely returns empty strings for missing optional profile values', async (t) => {
  const api = await startProfileApi();
  t.after(api.close);

  const response = await fetch(api.baseUrl, { headers: studentHeaders('student-user-2') });
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.student.address, '');
  assert.equal(body.student.dateOfBirth, '');
  assert.equal(body.student.gender, '');
});

test('profile PUT preserves omitted optional fields and allows clearing them explicitly', async (t) => {
  const api = await startProfileApi();
  t.after(api.close);

  const partialUpdate = await fetch(api.baseUrl, {
    method: 'PUT',
    headers: studentHeaders(),
    body: JSON.stringify({ name: 'Test Student', email: 'student@example.com' }),
  });
  assert.equal(partialUpdate.status, 200);
  assert.equal(api.data.students[0].address, 'Old address');

  const clearUpdate = await fetch(api.baseUrl, {
    method: 'PUT',
    headers: studentHeaders(),
    body: JSON.stringify({
      name: 'Test Student',
      email: 'student@example.com',
      address: '',
      dateOfBirth: null,
      gender: null,
      qualification: null,
      college: null,
      gatePaper: null,
      gateAttemptYear: null,
    }),
  });
  assert.equal(clearUpdate.status, 200);
  assert.equal(api.data.students[0].address, '');
  assert.equal(api.data.students[0].dateOfBirth, '');
  assert.equal(api.data.students[0].gender, '');
});

test('profile PUT rejects invalid required and optional fields without persisting changes', async (t) => {
  const api = await startProfileApi();
  t.after(api.close);
  const invalidInputs = [
    { name: ' ', email: 'student@example.com' },
    { name: 'Student', email: 'not-an-email' },
    { name: 'Student', email: 'student@example.com', dateOfBirth: '2025-02-30' },
    { name: 'Student', email: 'student@example.com', dateOfBirth: '2999-01-01' },
    { name: 'Student', email: 'student@example.com', gender: 'Unknown' },
    { name: 'Student', email: 'student@example.com', qualification: 42 },
    { name: 'Student', email: 'student@example.com', gateAttemptYear: '20XX' },
    { name: 'Student', email: 'student@example.com', gateAttemptYear: '1900' },
  ];

  for (const profile of invalidInputs) {
    const response = await fetch(api.baseUrl, {
      method: 'PUT',
      headers: studentHeaders(),
      body: JSON.stringify(profile),
    });
    assert.equal(response.status, 400);
  }
  assert.equal(api.data.users[0].name, 'Test Student');
  assert.equal(api.data.students[0].address, 'Old address');
});

test('profile PUT rejects an email already assigned to another account', async (t) => {
  const api = await startProfileApi();
  t.after(api.close);

  const response = await fetch(api.baseUrl, {
    method: 'PUT',
    headers: studentHeaders(),
    body: JSON.stringify({ name: 'Test Student', email: 'OTHER@example.com' }),
  });
  assert.equal(response.status, 409);
  assert.equal(api.data.users[0].email, 'student@example.com');
});

test('profile endpoints require an authenticated student and never fall back to another record', async (t) => {
  const api = await startProfileApi();
  t.after(api.close);

  const unauthenticated = await fetch(api.baseUrl);
  assert.equal(unauthenticated.status, 401);

  const admin = await fetch(api.baseUrl, { headers: studentHeaders('admin-user') });
  assert.equal(admin.status, 403);

  const missingStudent = await fetch(api.baseUrl, { headers: studentHeaders('missing-user') });
  assert.equal(missingStudent.status, 401);

  const ownerUpdate = await fetch(api.baseUrl, {
    method: 'PUT',
    headers: studentHeaders('student-user-2'),
    body: JSON.stringify({
      name: 'Other Student',
      email: 'other@example.com',
      address: 'Second account only',
      studentId: 'student-record-1',
    }),
  });
  assert.equal(ownerUpdate.status, 200);
  assert.equal(api.data.students[0].address, 'Old address');
  assert.equal(api.data.students[1].address, 'Second account only');
});

test('profile database failures return safe temporary-unavailability responses', async (t) => {
  const api = await startProfileApi({ loadError: new Error('private database connection detail') });
  t.after(api.close);

  const response = await fetch(api.baseUrl, { headers: studentHeaders() });
  const body = await response.json();
  assert.equal(response.status, 503);
  assert.match(body.message, /temporarily unavailable/i);
  assert.equal(JSON.stringify(body).includes('private database connection detail'), false);
});

test('profile save database failures do not report success or expose internal details', async (t) => {
  const api = await startProfileApi({ persistError: new Error('private database connection detail') });
  t.after(api.close);

  const response = await fetch(api.baseUrl, {
    method: 'PUT',
    headers: studentHeaders(),
    body: JSON.stringify({ name: 'Updated Student', email: 'updated@example.com' }),
  });
  const body = await response.json();
  assert.equal(response.status, 503);
  assert.match(body.message, /temporarily unavailable/i);
  assert.equal(JSON.stringify(body).includes('private database connection detail'), false);
  assert.equal(api.data.users[0].email, 'student@example.com');
});

test('authentication middleware returns a safe service error when its database is unavailable', async () => {
  const token = jwt.sign(
    { id: 'student-user-1', role: 'STUDENT', sessionVersion: 0 },
    JWT_SECRET,
    { expiresIn: '1m', issuer: 'kinetiq-academy', audience: 'kinetiq-app' }
  );
  const req = { headers: { authorization: `Bearer ${token}` } };
  let statusCode;
  let responseBody;
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(body) {
      responseBody = body;
      return this;
    },
  };

  await authenticateToken(req, res, () => assert.fail('Database failure must stop authentication.'));
  assert.equal(statusCode, 503);
  assert.match(responseBody.message, /temporarily unavailable/i);
  assert.equal(JSON.stringify(responseBody).includes('MONGODB_URI'), false);
});

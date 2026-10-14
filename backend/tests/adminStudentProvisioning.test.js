import assert from 'node:assert/strict';
import test from 'node:test';
import bcrypt from 'bcryptjs';
import {
  AdminStudentProvisioningError,
  provisionAdminStudent,
} from '../services/adminStudentProvisioning.js';

function createDatabase() {
  return { users: [], students: [], courses: [] };
}

test('admin-created student accounts use unique GATE courses and a bcrypt password hash', async () => {
  const subjects = [
    ['Chemistry', 'GATE-CY'],
    ['Physics', 'GATE-PH'],
    ['ME', 'GATE-ME'],
    ['CSE', 'GATE-CSE'],
    ['ECE', 'GATE-ECE'],
  ];

  for (const [subject, courseCode] of subjects) {
    const db = createDatabase();
    const student = await provisionAdminStudent(db, {
      name: 'New Student',
      email: 'NEW.STUDENT@example.com',
      phone: '+91 98765 43210',
      password: 'PrivateStudentPass1',
      subject,
    }, {
      hashPassword: (password) => bcrypt.hash(password, 4),
      makeId: (() => { let id = 0; return () => `id-${++id}`; })(),
      now: () => new Date('2026-10-12T10:00:00.000Z'),
    });

    assert.equal(db.users.length, 1);
    assert.equal(db.students.length, 1);
    assert.equal(db.courses.length, 1);
    assert.equal(db.users[0].role, 'STUDENT');
    assert.equal(db.users[0].email, 'new.student@example.com');
    assert.equal(db.users[0].phone, '9876543210');
    assert.equal(await bcrypt.compare('PrivateStudentPass1', db.users[0].passwordHash), true);
    assert.equal(Object.hasOwn(student, 'passwordHash'), false);
    assert.equal(student.courseCode, courseCode);
    assert.equal(student.courseId, db.courses[0].id);
  }
});

test('admin student provisioning rejects invalid details and duplicate email or phone without mutation', async () => {
  const db = createDatabase();
  const input = {
    name: 'New Student',
    email: 'new.student@example.com',
    phone: '9876543210',
    password: 'PrivateStudentPass1',
    subject: 'Chemistry',
  };
  const options = { hashPassword: async () => 'test-hash' };

  await assert.rejects(
    provisionAdminStudent(db, { ...input, subject: 'GATE-EE' }, options),
    (error) => error instanceof AdminStudentProvisioningError && error.status === 400
  );
  await assert.rejects(
    provisionAdminStudent(db, { ...input, password: 'short' }, options),
    (error) => error instanceof AdminStudentProvisioningError && error.status === 400
  );
  assert.equal(db.users.length, 0);
  assert.equal(db.students.length, 0);

  await provisionAdminStudent(db, input, options);
  await assert.rejects(
    provisionAdminStudent(db, { ...input, email: 'NEW.STUDENT@example.com', phone: '9876543211' }, options),
    (error) => error instanceof AdminStudentProvisioningError && error.status === 409
  );
  await assert.rejects(
    provisionAdminStudent(db, { ...input, email: 'other@example.com' }, options),
    (error) => error instanceof AdminStudentProvisioningError && error.status === 409
  );
  assert.equal(db.users.length, 1);
  assert.equal(db.students.length, 1);
});

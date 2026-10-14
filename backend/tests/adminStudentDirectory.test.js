import assert from 'node:assert/strict';
import test from 'node:test';
import { filterAdminStudents } from '../utils/adminStudentDirectory.js';

test('empty MongoDB collections produce an empty student directory', () => {
  assert.deepEqual(filterAdminStudents({ students: [] }), []);
  assert.deepEqual(filterAdminStudents({}), []);
});

test('student directory filters actual records by search, exam, normalized subject, and payment', () => {
  const database = {
    students: [
      {
        id: 'std-1',
        name: 'Alex Student',
        email: 'alex@example.test',
        phone: '9876543210',
        exam: 'GATE',
        subject: 'Mechanical Engineering',
        accountStatus: 'Active',
        paymentStatus: 'Pending',
      },
      {
        id: 'std-2',
        name: 'Sam Student',
        email: 'sam@example.test',
        phone: '9876543211',
        exam: 'GATE',
        subject: 'Physics',
        accountStatus: 'Inactive',
      },
    ],
    payments: [
      { id: 'payment-1', studentId: 'std-1', status: 'Payment Verified', paymentDate: '2026-10-01' },
      { id: 'payment-2', studentId: 'std-2', status: 'Payment Pending', paymentDate: '2026-10-02' },
    ],
    enrollments: [],
    courses: [],
  };

  const filtered = filterAdminStudents(database, {
    search: 'ALEX@',
    exam: 'GATE',
    subject: 'ME',
    paymentStatus: 'Paid',
    accountStatus: 'Active',
  });

  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].id, 'std-1');
  assert.equal(filtered[0].paymentStatus, 'Payment Verified');
  assert.deepEqual(
    filterAdminStudents(database, { subject: 'CSE' }),
    []
  );
  assert.deepEqual(
    filterAdminStudents(database, { paymentStatus: 'Pending' }).map((student) => student.id),
    ['std-2']
  );
});

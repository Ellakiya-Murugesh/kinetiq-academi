import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { normalizeMobile } from '../db.js';
import { ensureGateCourse, getGateCourse } from '../utils/gateEnrollment.js';

const ADMIN_STUDENT_COURSES = {
  Chemistry: 'GATE-CY',
  Physics: 'GATE-PH',
  ME: 'GATE-ME',
  'Mechanical Engineering': 'GATE-ME',
  CSE: 'GATE-CSE',
  'Computer Science Engineering (CSE)': 'GATE-CSE',
  ECE: 'GATE-ECE',
  'Electronics and Communication Engineering (ECE)': 'GATE-ECE',
};

export class AdminStudentProvisioningError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export async function provisionAdminStudent(db, input, {
  hashPassword = (password) => bcrypt.hash(password, 10),
  makeId = randomUUID,
  now = () => new Date(),
} = {}) {
  const name = String(input?.name || '').trim();
  const email = String(input?.email || '').trim().toLowerCase();
  const phone = normalizeMobile(input?.phone);
  const password = typeof input?.password === 'string' ? input.password : '';
  const subjectInput = String(input?.subject || 'Chemistry').trim();
  const course = getGateCourse(ADMIN_STUDENT_COURSES[subjectInput]);

  if (!name || name.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    phone.length !== 10 || password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) {
    throw new AdminStudentProvisioningError(
      400,
      'Provide a name, valid email, 10-digit phone number, and a password between 8 and 72 bytes.'
    );
  }
  if (!course) {
    throw new AdminStudentProvisioningError(400, 'Choose one of the supported GATE subjects.');
  }

  const hasEmail = (record) => String(record.email || '').trim().toLowerCase() === email;
  const hasPhone = (record) => normalizeMobile(record.mobile ?? record.phone) === phone;
  if (db.users.some(hasEmail) || db.students.some(hasEmail)) {
    throw new AdminStudentProvisioningError(409, 'An account already exists with this email address.');
  }
  if (db.users.some(hasPhone) || db.students.some(hasPhone)) {
    throw new AdminStudentProvisioningError(409, 'An account already exists with this phone number.');
  }

  const userId = `usr-student-${makeId()}`;
  const studentId = `std-${makeId()}`;
  const createdAt = now().toISOString();
  const newUser = {
    id: userId,
    email,
    phone,
    passwordHash: await hashPassword(password),
    name,
    role: 'STUDENT',
    createdAt,
    status: 'ACTIVE',
  };
  const newStudent = {
    id: studentId,
    userId,
    name,
    email,
    phone,
    exam: 'GATE',
    subject: course.subject,
    courseId: course.id,
    courseCode: course.code,
    courseName: course.courseName,
    enrollmentDate: createdAt.split('T')[0],
    paymentStatus: 'Paid',
    accountStatus: 'Active',
    progress: 0,
    classesAttended: 0,
    totalClasses: 40,
    materialsAccessed: 0,
    testsCompleted: 0,
    averageScore: 0,
    refundEligible: false,
    refundStatus: 'Not Eligible Yet',
  };

  ensureGateCourse(db, course);
  db.users.push(newUser);
  db.students.unshift(newStudent);
  return newStudent;
}

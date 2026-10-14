import assert from 'node:assert/strict';
import test from 'node:test';
import { buildAdminDashboard } from '../utils/adminDashboard.js';

const now = new Date('2026-10-14T12:00:00.000Z');

test('empty MongoDB collections produce zero counts and empty chart datasets', () => {
  const dashboard = buildAdminDashboard({
    students: [],
    courses: [],
    enrollments: [],
    payments: [],
    refunds: [],
    enquiries: [],
    liveSessions: [],
    lessonProgress: [],
  }, now);

  assert.deepEqual(dashboard.stats, {
    totalStudents: 0,
    activeStudents: 0,
    activeEnrollments: 0,
    totalRevenue: 0,
    verifiedPayments: 0,
    pendingPayments: 0,
    refundRequests: 0,
    guidanceEnquiries: 0,
    upcomingLiveClasses: 0,
    onTrackStudents: 0,
    onTrackPercentage: 0,
  });
  assert.deepEqual(dashboard.analytics.monthlyEnrollments, []);
  assert.deepEqual(dashboard.analytics.monthlyRevenue, []);
  assert.deepEqual(dashboard.analytics.examWise, []);
  assert.deepEqual(dashboard.analytics.subjectWise, []);
  assert.deepEqual(dashboard.analytics.courseProgress, [
    { name: 'On Track (60%+)', value: 0 },
    { name: 'Moderate (30-59%)', value: 0 },
    { name: 'Needs Attention (<30%)', value: 0 },
  ]);
});

test('dashboard metrics reflect real student, enrollment, payment, and lesson records', () => {
  const database = {
    students: [{
      id: 'student-1',
      courseId: 'course-1',
      accountStatus: 'Active',
      exam: 'GATE',
      subject: 'Chemistry',
    }],
    courses: [{
      id: 'course-1',
      status: 'Published',
      modules: [{
        id: 'module-1',
        status: 'Published',
        lessons: [{ id: 'lesson-1', title: 'Lesson 1', status: 'Published' }],
      }],
    }],
    enrollments: [{
      id: 'enrollment-1',
      studentId: 'student-1',
      courseId: 'course-1',
      courseStatus: 'Active',
      paymentStatus: 'Paid',
      enrollmentDate: '2026-10-02',
    }],
    payments: [{
      id: 'payment-1',
      studentId: 'student-1',
      courseId: 'course-1',
      status: 'Paid',
      amount: 1200,
      paymentDate: '2026-10-03',
    }],
    lessonProgress: [{
      id: 'progress-1',
      studentId: 'student-1',
      courseId: 'course-1',
      moduleId: 'module-1',
      lessonId: 'lesson-1',
      completedAt: '2026-10-04T00:00:00.000Z',
    }],
    refunds: [],
    enquiries: [],
    liveSessions: [],
  };

  const dashboard = buildAdminDashboard(database, now);
  assert.equal(dashboard.stats.totalStudents, 1);
  assert.equal(dashboard.stats.activeStudents, 1);
  assert.equal(dashboard.stats.activeEnrollments, 1);
  assert.equal(dashboard.stats.totalRevenue, 1200);
  assert.equal(dashboard.stats.verifiedPayments, 1);
  assert.equal(dashboard.stats.onTrackStudents, 1);
  assert.equal(dashboard.stats.onTrackPercentage, 100);
  assert.equal(dashboard.analytics.examWise[0].name, 'GATE');
  assert.equal(dashboard.analytics.subjectWise[0].name, 'Chemistry');
  assert.equal(dashboard.analytics.monthlyEnrollments.find((item) => item.month === 'Oct').enrollments, 1);
  assert.equal(dashboard.analytics.monthlyRevenue.find((item) => item.month === 'Oct').revenue, 1200);
});

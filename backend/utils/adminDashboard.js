import { getStudentCourseProgress } from '../routes/studentCourse.js';

export function buildAdminDashboard(database, now = new Date()) {
  const records = (name) => Array.isArray(database?.[name]) ? database[name] : [];
  const students = records('students');
  const enrollments = records('enrollments');
  const payments = records('payments');
  const courses = records('courses');
  const refunds = records('refunds');
  const enquiries = records('enquiries');
  const liveSessions = records('liveSessions');
  const firstMonth = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const months = Array.from({ length: 6 }, (_, index) =>
    new Date(firstMonth.getFullYear(), firstMonth.getMonth() + index, 1)
  );
  const monthKey = (value) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? null
      : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  };
  const monthlyCounts = (items, dateFields, valueField = null) => {
    const monthKeys = new Set(months.map(monthKey));
    const datedItems = items.filter((record) =>
      dateFields.some((field) => monthKeys.has(monthKey(record[field])))
    );
    if (!datedItems.length) return [];

    return months.map((month) => {
      const key = monthKey(month);
      const itemsInMonth = datedItems.filter((record) =>
        dateFields.some((field) => monthKey(record[field]) === key)
      );
      return {
        month: month.toLocaleString('en-US', { month: 'short' }),
        ...(valueField
          ? { [valueField]: itemsInMonth.reduce((total, record) => total + (Number(record.amount) || 0), 0) }
          : { enrollments: itemsInMonth.length }),
      };
    });
  };
  const countBy = (items, field) => {
    const counts = new Map();
    for (const record of items) {
      const name = String(record[field] || 'Unspecified');
      counts.set(name, (counts.get(name) || 0) + 1);
    }
    return [...counts].map(([name, count]) => ({ name, count }));
  };
  const isPaid = (payment) => ['paid', 'payment verified'].includes(String(payment.status || '').toLowerCase());
  const isPending = (payment) => ['pending', 'payment pending', 'payment verification pending']
    .includes(String(payment.status || '').toLowerCase());
  const activeStatuses = new Set(['active', 'approved', 'confirmed']);
  const openRefundStatuses = new Set(['pending', 'under review', 'approved']);
  const today = now.toISOString().slice(0, 10);
  const activeEnrollments = enrollments.filter((enrollment) =>
    activeStatuses.has(String(enrollment.courseStatus || enrollment.status || '').toLowerCase()) &&
    isPaid({ status: enrollment.paymentStatus })
  );
  const paidPayments = payments.filter(isPaid);
  const progressValues = students.flatMap((student) => {
    const enrollment = enrollments.find((record) =>
      record.studentId === student.id &&
      (!student.courseId || record.courseId === student.courseId)
    );
    const courseId = student.courseId || enrollment?.courseId;
    const course = courses.find((record) => record.id === courseId);
    if (!course) return [];
    const progress = getStudentCourseProgress(database, student, course);
    return progress.totalLessons > 0 ? [progress.overallProgress] : [];
  });
  const onTrackStudents = progressValues.filter((progress) => progress >= 60).length;

  return {
    stats: {
      totalStudents: students.length,
      activeStudents: students.filter((student) =>
        String(student.accountStatus || '').toLowerCase() === 'active'
      ).length,
      activeEnrollments: activeEnrollments.length,
      totalRevenue: paidPayments.reduce((total, payment) => total + (Number(payment.amount) || 0), 0),
      verifiedPayments: paidPayments.length,
      pendingPayments: payments.filter(isPending).length,
      refundRequests: refunds.filter((refund) =>
        openRefundStatuses.has(String(refund.status || '').toLowerCase())
      ).length,
      guidanceEnquiries: enquiries.filter((enquiry) =>
        ['new', 'pending', 'contacted'].includes(String(enquiry.status || '').toLowerCase())
      ).length,
      upcomingLiveClasses: liveSessions.filter((session) =>
        session.status === 'Published' && String(session.date || '') >= today
      ).length,
      onTrackStudents,
      onTrackPercentage: progressValues.length
        ? Math.round((onTrackStudents / progressValues.length) * 100)
        : 0,
    },
    analytics: {
      monthlyEnrollments: monthlyCounts(enrollments, ['enrollmentDate']),
      monthlyRevenue: monthlyCounts(paidPayments, ['date', 'paymentDate'], 'revenue'),
      examWise: countBy(students, 'exam'),
      subjectWise: countBy(students, 'subject'),
      courseProgress: [
        { name: 'On Track (60%+)', value: onTrackStudents },
        { name: 'Moderate (30-59%)', value: progressValues.filter((progress) => progress >= 30 && progress < 60).length },
        { name: 'Needs Attention (<30%)', value: progressValues.filter((progress) => progress < 30).length },
      ],
    },
  };
}

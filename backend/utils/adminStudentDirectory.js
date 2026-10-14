function normalize(value) {
  return String(value ?? '').trim().toLowerCase();
}

function canonicalSubject(value) {
  const subject = normalize(value).replace(/[\s_-]+/g, ' ');
  const aliases = {
    cy: 'chemistry',
    'gate cy': 'chemistry',
    ph: 'physics',
    'gate ph': 'physics',
    me: 'me',
    mechanical: 'me',
    'mechanical engineering': 'me',
    'gate me': 'me',
    cse: 'cse',
    'computer science engineering': 'cse',
    'computer science engineering (cse)': 'cse',
    'gate cse': 'cse',
    ece: 'ece',
    'electronics and communication engineering': 'ece',
    'electronics and communication engineering (ece)': 'ece',
    'gate ece': 'ece',
  };
  return aliases[subject] || subject;
}

function paymentBucket(status) {
  const value = normalize(status);
  if (['paid', 'payment verified', 'verified'].includes(value)) return 'paid';
  if (['pending', 'payment pending', 'payment verification pending'].includes(value)) return 'pending';
  return value;
}

function latestStudentPayment(database, student) {
  const enrollment = (Array.isArray(database.enrollments) ? database.enrollments : [])
    .find((record) => record.studentId === student.id);
  const courseId = student.courseId || enrollment?.courseId;
  const allPayments = Array.isArray(database.payments) ? database.payments : [];
  const linkedPayment = enrollment?.paymentId
    ? allPayments.find((payment) =>
      payment.id === enrollment.paymentId &&
      payment.studentId === student.id &&
      (!payment.courseId || payment.courseId === courseId)
    )
    : null;
  if (linkedPayment) return linkedPayment.status || enrollment?.paymentStatus || student.paymentStatus || '';

  const payments = allPayments
    .filter((payment) => payment.studentId === student.id)
    .filter((payment) => !courseId || !payment.courseId || payment.courseId === courseId)
    .sort((left, right) =>
      String(right.paymentSubmittedAt || right.paymentDate || right.date || '')
        .localeCompare(String(left.paymentSubmittedAt || left.paymentDate || left.date || ''))
    );
  if (payments.length) return payments[0].status;

  return enrollment?.paymentStatus || student.paymentStatus || '';
}

export function filterAdminStudents(database, query = {}) {
  const search = normalize(query.search);
  const exam = normalize(query.exam);
  const subject = normalize(query.subject);
  const paymentStatus = paymentBucket(query.paymentStatus);
  const accountStatus = normalize(query.accountStatus);

  return (Array.isArray(database.students) ? database.students : []).filter((student) => {
    if (!student || typeof student !== 'object') return false;

    const studentPaymentStatus = latestStudentPayment(database, student);
    if (search) {
      const searchableFields = [student.name, student.email, student.phone, student.id];
      if (!searchableFields.some((value) => normalize(value).includes(search))) return false;
    }
    if (exam && exam !== 'all' && normalize(student.exam) !== exam) return false;
    if (subject && subject !== 'all' && canonicalSubject(student.subject) !== canonicalSubject(subject)) return false;
    if (paymentStatus && paymentStatus !== 'all' && paymentBucket(studentPaymentStatus) !== paymentStatus) return false;
    if (accountStatus && accountStatus !== 'all' && normalize(student.accountStatus) !== accountStatus) return false;
    return true;
  }).map((student) => ({
    ...student,
    paymentStatus: latestStudentPayment(database, student),
  }));
}

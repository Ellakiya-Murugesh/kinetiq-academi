export const GATE_COURSE_CATALOG_ID = '100-day-comprehensive';
export const GATE_COURSE_FEE = 10000;
export const GATE_COURSE_SUBJECTS = ['Chemistry', 'Physics', 'CSE', 'ECE', 'EE', 'ME', 'CE'];

const GATE_PAPER_DETAILS = {
  Chemistry: { code: 'GATE-CY', title: 'GATE Chemistry' },
  Physics: { code: 'GATE-PH', title: 'GATE Physics' },
  CSE: { code: 'GATE-CSE', title: 'GATE Computer Science & Information Technology' },
  ECE: { code: 'GATE-ECE', title: 'GATE Electronics & Communication Engineering' },
  EE: { code: 'GATE-EE', title: 'GATE Electrical Engineering' },
  ME: { code: 'GATE-ME', title: 'GATE Mechanical Engineering' },
  CE: { code: 'GATE-CE', title: 'GATE Civil Engineering' },
};

export function getGateCourse(subjectOrCode) {
  // Keep this strict allowlist server-side; never derive a course or fee from client input.
  const subject = GATE_COURSE_SUBJECTS.find((candidate) =>
    candidate === subjectOrCode || GATE_PAPER_DETAILS[candidate].code === subjectOrCode
  );
  if (!subject) return null;

  const courseName = `${GATE_PAPER_DETAILS[subject].title} — 100 Day Program`;
  return {
    id: `gate-${subject.toLowerCase()}-100-day`,
    catalogId: GATE_COURSE_CATALOG_ID,
    code: GATE_PAPER_DETAILS[subject].code,
    name: courseName,
    courseName,
    exam: 'GATE',
    subject,
    fee: GATE_COURSE_FEE,
    duration: '100 Days Intensive',
  };
}

export function ensureGateCourse(db, course) {
  let record = db.courses.find((item) => item.id === course.id);
  if (!record) {
    record = {
      ...course,
      startDate: 'November 1',
      status: 'Active',
      enrolledCount: 0,
    };
    db.courses.push(record);
  } else {
    Object.assign(record, {
      code: course.code,
      name: course.name,
      courseName: course.courseName,
      exam: course.exam,
      subject: course.subject,
      fee: course.fee,
      duration: course.duration,
    });
  }
  return record;
}

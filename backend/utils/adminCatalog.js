import { randomUUID } from 'node:crypto';

const COURSE_SUBJECTS = new Set([
  'Chemistry',
  'Physics',
  'Mechanical Engineering',
  'Computer Science Engineering (CSE)',
  'Electronics and Communication Engineering (ECE)',
  'CSE',
  'ECE',
  'ME',
  'CE',
]);
const COURSE_STATUSES = new Set(['Draft', 'Published']);
const SESSION_STATUSES = new Set(['Draft', 'Published', 'Cancelled']);

function isDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

function isTime(value) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function validWebUrl(value) {
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) && Boolean(url.hostname);
  } catch {
    return false;
  }
}

function normalizedModules(value, existingCourse) {
  if (!Array.isArray(value)) return { error: 'Course modules must be a list.' };
  const moduleIds = new Set();
  const modules = [];

  for (const module of value) {
    const title = typeof module?.title === 'string' ? module.title.trim() : '';
    if (!title) return { error: 'Every course module needs a title.' };
    const id = typeof module.id === 'string' && module.id.trim() ? module.id.trim() : randomUUID();
    if (moduleIds.has(id)) return { error: 'Course module IDs must be unique.' };
    moduleIds.add(id);
    const legacyModuleStatus = ['Completed', 'In Progress', 'Upcoming'].includes(module.status);
    const status = legacyModuleStatus
      ? 'Published'
      : module.status ?? (existingCourse ? 'Published' : 'Draft');
    if (!['Draft', 'Published'].includes(status)) {
      return { error: `Module "${title}" must be Draft or Published.` };
    }
    if (!Array.isArray(module.lessons)) return { error: `Lessons for "${title}" must be a list.` };

    const lessonIds = new Set();
    const lessons = [];
    for (const lesson of module.lessons) {
      const lessonTitle = typeof lesson?.title === 'string' ? lesson.title.trim() : '';
      if (!lessonTitle) return { error: `Every lesson in "${title}" needs a title.` };
      const lessonId = typeof lesson.id === 'string' && lesson.id.trim()
        ? lesson.id.trim()
        : randomUUID();
      if (lessonIds.has(lessonId)) return { error: `Lesson IDs in "${title}" must be unique.` };
      lessonIds.add(lessonId);
      const legacyLessonStatus = ['Completed', 'In Progress', 'Upcoming', 'Not Completed'].includes(lesson.status);
      const lessonStatus = legacyLessonStatus
        ? 'Published'
        : lesson.status ?? (existingCourse ? 'Published' : 'Draft');
      if (!['Draft', 'Published'].includes(lessonStatus)) {
        return { error: `Lesson "${lessonTitle}" must be Draft or Published.` };
      }
      lessons.push({ ...lesson, id: lessonId, title: lessonTitle, status: lessonStatus });
    }
    modules.push({ ...module, id, title, status, lessons });
  }

  return { modules };
}

export function normalizeCoursePayload(body, existing = null) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: 'Course details are required.' };
  }
  const value = (key, fallback = '') => body[key] === undefined ? (existing?.[key] ?? fallback) : body[key];
  const name = typeof value('name') === 'string' ? value('name').trim() : '';
  const exam = value('exam', 'GATE');
  const subject = value('subject');
  const description = typeof value('description') === 'string' ? value('description').trim() : '';
  const duration = typeof value('duration') === 'string' ? value('duration').trim() : '';
  const requestedStartDate = value('startDate');
  let startDate = typeof requestedStartDate === 'string' ? requestedStartDate.trim() : '';
  const hasExplicitStatus = body.status !== undefined;
  const requestedStatus = hasExplicitStatus ? body.status : existing?.status || 'Draft';
  const preserveLegacyActive = !hasExplicitStatus && existing?.status === 'Active';
  const status = preserveLegacyActive
    ? 'Active'
    : typeof requestedStatus === 'string' && requestedStatus.trim().toLowerCase() === 'active'
      ? 'Draft'
      : requestedStatus;
  const fee = Number(value('fee'));
  const refundAmount = Number(value('refundAmount', 0));

  if (!name) return { error: 'Course name is required.' };
  if (exam !== 'GATE') return { error: 'Only GATE courses can be managed here.' };
  if (!COURSE_SUBJECTS.has(subject) && subject !== existing?.subject) {
    return { error: 'Select a supported GATE subject.' };
  }
  if (!description) return { error: 'Course description is required.' };
  if (!duration) return { error: 'Course duration is required.' };
  if (!isDate(startDate)) {
    if (existing && (!startDate || startDate === existing.startDate) &&
        typeof existing.startDate === 'string' && existing.startDate.trim()) {
      startDate = existing.startDate;
    } else {
      return { error: 'Enter a valid course start date.' };
    }
  }
  if (!Number.isFinite(fee) || fee < 0) return { error: 'Course fee must be zero or greater.' };
  if (!Number.isFinite(refundAmount) || refundAmount < 0) {
    return { error: 'Refund amount must be zero or greater.' };
  }
  if (!COURSE_STATUSES.has(status) && !preserveLegacyActive) {
    return { error: 'Course status must be Draft or Published.' };
  }

  const modulesResult = normalizedModules(value('modules', []), Boolean(existing));
  if (modulesResult.error) return modulesResult;
  const hasPublishedLesson = modulesResult.modules.some((module) =>
    module.status === 'Published' &&
    module.lessons.some((lesson) => lesson.status === 'Published')
  );
  if (status === 'Published' && !hasPublishedLesson) {
    return { error: 'Publish a module with at least one published lesson before publishing this course.' };
  }

  return {
    course: {
      ...(existing || {}),
      name,
      exam,
      subject,
      description,
      duration,
      startDate,
      fee,
      refundAmount,
      status,
      modules: modulesResult.modules,
    },
  };
}

export function normalizeLiveSessionPayload(body, courses, existing = null) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: 'Live session details are required.' };
  }
  const value = (key, fallback = '') => body[key] === undefined ? (existing?.[key] ?? fallback) : body[key];
  const title = typeof value('title') === 'string' ? value('title').trim() : '';
  const courseId = typeof value('courseId') === 'string' ? value('courseId').trim() : '';
  const date = value('date');
  const startTime = value('startTime');
  const endTime = value('endTime');
  const meetingLink = typeof value('meetingLink') === 'string' ? value('meetingLink').trim() : '';
  const status = value('status', 'Draft');

  if (!title) return { error: 'Session title is required.' };
  if (!courseId && !existing) return { error: 'Select a course for this session.' };
  const course = courseId ? courses.find((item) => item.id === courseId) : null;
  if (courseId && !course) return { error: 'Select an existing course.' };
  if (typeof date !== 'string' || !isDate(date)) return { error: 'Enter a valid session date.' };
  if (typeof startTime !== 'string' || !isTime(startTime)) return { error: 'Enter a valid start time.' };
  if (typeof endTime !== 'string' || !isTime(endTime) || endTime <= startTime) {
    return { error: 'End time must be later than the start time.' };
  }
  if (!SESSION_STATUSES.has(status)) return { error: 'Choose Draft, Published, or Cancelled.' };
  if (status === 'Published' && course && !['Published', 'Active'].includes(course.status)) {
    return { error: 'Publish the selected course before publishing its live session.' };
  }
  if (status === 'Published' && !validWebUrl(meetingLink)) {
    return { error: 'A valid meeting link is required before publishing.' };
  }
  if (meetingLink && !validWebUrl(meetingLink)) return { error: 'Enter a valid meeting link.' };

  return {
    session: {
      ...(existing || {}),
      title,
      courseId: course?.id || existing?.courseId || '',
      courseName: course?.name || existing?.courseName || '',
      exam: course?.exam || existing?.exam || 'GATE',
      subject: course?.subject || existing?.subject || '',
      faculty: typeof value('faculty') === 'string' ? value('faculty').trim() : '',
      date,
      startTime,
      endTime,
      meetingLink,
      description: typeof value('description') === 'string' ? value('description').trim() : '',
      status,
    },
  };
}

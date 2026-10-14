import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeCoursePayload, normalizeLiveSessionPayload } from '../utils/adminCatalog.js';

const course = {
  id: 'course-chem',
  name: 'GATE Chemistry',
  exam: 'GATE',
  subject: 'Chemistry',
  description: 'A verified chemistry course.',
  duration: '100 days',
  startDate: '2026-11-01',
  fee: 10000,
  refundAmount: 2000,
  status: 'Draft',
  modules: [{ id: 'module-1', title: 'Foundations', lessons: [{ id: 'lesson-1', title: 'Atomic structure' }] }],
};
const publishedCourse = { ...course, status: 'Published' };

test('course normalization requires complete details and published curriculum before publication', () => {
  const invalid = normalizeCoursePayload({ ...course, modules: [], status: 'Published' });
  assert.match(invalid.error, /published lesson/);

  const valid = normalizeCoursePayload({
    ...course,
    id: undefined,
    modules: [{
      title: 'Foundations',
      status: 'Published',
      lessons: [{ title: 'Atomic structure', status: 'Published' }],
    }],
    status: 'Published',
  });
  assert.equal(valid.course.name, course.name);
  assert.equal(valid.course.status, 'Published');
  assert.ok(valid.course.modules[0].id);
  assert.ok(valid.course.modules[0].lessons[0].id);
  assert.equal(valid.course.modules[0].status, 'Published');
  assert.equal(valid.course.modules[0].lessons[0].status, 'Published');
});

test('new curriculum defaults to draft and cannot publish until a lesson is published', () => {
  const draft = normalizeCoursePayload({
    ...course,
    id: undefined,
    modules: [{ title: 'Foundations', lessons: [{ title: 'Atomic structure' }] }],
  });
  assert.equal(draft.course.modules[0].status, 'Draft');
  assert.equal(draft.course.modules[0].lessons[0].status, 'Draft');
  assert.match(normalizeCoursePayload({
    ...course,
    id: undefined,
    modules: [{ title: 'Foundations', lessons: [{ title: 'Atomic structure' }] }],
    status: 'Published',
  }).error, /published lesson/);
});

test('course partial updates preserve its curriculum and reject invalid subjects', () => {
  const update = normalizeCoursePayload({ status: 'Draft' }, course);
  assert.equal(update.course.modules[0].lessons[0].id, 'lesson-1');
  assert.equal(normalizeCoursePayload({ subject: 'CSIR NET' }, course).error, 'Select a supported GATE subject.');
});

test('metadata edits preserve a legacy Active status while explicit status updates use Draft or Published', () => {
  const legacyCourse = {
    ...course,
    status: 'Active',
    modules: [{
      id: 'legacy-module',
      title: 'Foundations',
      status: 'Published',
      lessons: [{ id: 'legacy-lesson', title: 'Atomic structure', status: 'Published' }],
    }],
  };
  const metadataUpdate = normalizeCoursePayload({ description: 'Updated course details.' }, legacyCourse);
  assert.equal(metadataUpdate.course.status, 'Active');
  assert.equal(metadataUpdate.course.description, 'Updated course details.');
  assert.equal(metadataUpdate.course.modules.length, 1);
  assert.equal(metadataUpdate.course.modules[0].lessons[0].id, 'legacy-lesson');

  const legacyStatusUpdate = normalizeCoursePayload({ ...legacyCourse, status: 'Active' }, legacyCourse);
  assert.equal(legacyStatusUpdate.course.status, 'Draft');

  const explicitDraft = normalizeCoursePayload({ status: 'Draft' }, legacyCourse);
  assert.equal(explicitDraft.course.status, 'Draft');
});

test('legacy courses require a published lesson before an explicit publish', () => {
  const legacyCourse = { ...course, status: 'Active', modules: [] };
  const result = normalizeCoursePayload({ status: 'Published' }, legacyCourse);
  assert.match(result.error, /published lesson/);
});

test('legacy runtime progress labels on syllabus entries remain editable as published curriculum', () => {
  const legacyCourse = {
    ...course,
    modules: [{
      id: 'legacy-module',
      title: 'Foundations',
      status: 'Completed',
      lessons: [{ id: 'legacy-lesson', title: 'Atomic structure', status: 'Not Completed' }],
    }],
  };
  const update = normalizeCoursePayload({ status: 'Draft' }, legacyCourse);
  assert.equal(update.course.modules[0].status, 'Published');
  assert.equal(update.course.modules[0].lessons[0].status, 'Published');
});

test('live session requires an existing course, valid schedule, and real meeting URL before publishing', () => {
  const missingLink = normalizeLiveSessionPayload({
    title: 'Quantum chemistry',
    courseId: course.id,
    date: '2026-11-02',
    startTime: '18:00',
    endTime: '19:00',
    status: 'Published',
  }, [publishedCourse]);
  assert.match(missingLink.error, /valid meeting link/);

  const session = normalizeLiveSessionPayload({
    title: 'Quantum chemistry',
    courseId: course.id,
    date: '2026-11-02',
    startTime: '18:00',
    endTime: '19:00',
    meetingLink: 'https://meet.example.test/chemistry',
    status: 'Published',
  }, [publishedCourse]);
  assert.equal(session.session.courseName, course.name);
  assert.equal(session.session.subject, course.subject);
  assert.equal(session.session.status, 'Published');
});

test('live session rejects invalid dates, reversed times, missing courses, and placeholder links', () => {
  const base = {
    title: 'Class',
    courseId: course.id,
    date: '2026-11-02',
    startTime: '19:00',
    endTime: '18:00',
    meetingLink: 'https://meet.example.test/class',
    status: 'Published',
  };
  assert.match(normalizeLiveSessionPayload(base, [publishedCourse]).error, /End time/);
  assert.match(normalizeLiveSessionPayload({ ...base, date: '2026-02-30' }, [publishedCourse]).error, /valid session date/);
  assert.match(normalizeLiveSessionPayload({ ...base, courseId: 'missing' }, [publishedCourse]).error, /existing course/);
  assert.match(normalizeLiveSessionPayload({ ...base, meetingLink: '[LIVE CLASS LINK]', endTime: '20:00' }, [publishedCourse]).error, /valid meeting link/);
});

test('session cancellation is a valid retained state', () => {
  const result = normalizeLiveSessionPayload({
    status: 'Cancelled',
  }, [publishedCourse], {
    title: 'Scheduled class',
    courseId: course.id,
    date: '2026-11-02',
    startTime: '18:00',
    endTime: '19:00',
    meetingLink: 'https://meet.example.test/class',
    status: 'Published',
  });
  assert.equal(result.session.status, 'Cancelled');
});

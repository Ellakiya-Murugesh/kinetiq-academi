import express from 'express';
import { randomUUID } from 'node:crypto';
import { getDb, saveDb } from '../db.js';

function isCoursePublished(status) {
  if (status == null || status === '') return true;
  return ['active', 'published'].includes(String(status).trim().toLowerCase());
}

function isCurriculumPublished(status) {
  if (status == null || status === '') return true;
  return !['draft', 'unpublished'].includes(String(status).trim().toLowerCase());
}

function getCourse(db, student) {
  const enrollments = Array.isArray(db.enrollments) ? db.enrollments : [];
  const enrollment = enrollments.find((record) =>
    record.studentId === student.id &&
    (!student.courseId || record.courseId === student.courseId)
  ) || null;
  const courseId = student.courseId || enrollment?.courseId;
  return {
    enrollment,
    courseId,
    course: courseId
      ? (Array.isArray(db.courses) ? db.courses : []).find((record) => record.id === courseId) || null
      : null,
  };
}

function hasCourseAccess(student, enrollment, payment) {
  const paymentStatus = payment?.status ?? enrollment?.paymentStatus ?? student.paymentStatus;
  const paymentVerified = ['paid', 'payment verified'].includes(
    String(paymentStatus || '').trim().toLowerCase()
  );
  const enrollmentStatus = String(enrollment?.courseStatus || '').trim().toLowerCase();
  const enrollmentActive = !enrollmentStatus || ['active', 'enrolled'].includes(enrollmentStatus);
  return paymentVerified && enrollmentActive;
}

function getCourseLessons(course) {
  const modules = Array.isArray(course?.modules) ? course.modules : [];
  if (!isCoursePublished(course?.status)) return [];
  return modules.filter((module) =>
    module &&
    typeof module === 'object' &&
    typeof module.id === 'string' &&
    module.id.trim() &&
    isCurriculumPublished(module.status)
  ).flatMap((module) =>
    getCourseModuleLessons(module).filter((lesson) => isCurriculumPublished(lesson.status)).map((lesson) => ({
      ...lesson,
      moduleId: module.id.trim(),
      moduleTitle: module.title,
    }))
  );
}

function getCourseModuleLessons(module) {
  if (!Array.isArray(module?.lessons)) return [];
  const seen = new Set();
  return module.lessons.flatMap((lesson) => {
    if (!lesson || typeof lesson !== 'object' || Array.isArray(lesson)) return [];
    const id = typeof lesson.id === 'string' ? lesson.id.trim() : '';
    const title = typeof lesson.title === 'string' ? lesson.title.trim() : '';
    if (!id || !title || seen.has(id)) return [];
    seen.add(id);
    return [{ ...lesson, id, title }];
  });
}

function getPayment(db, student, enrollment, courseId) {
  if (!courseId) return null;
  const payments = Array.isArray(db.payments) ? db.payments : [];
  const linkedPayment = enrollment?.paymentId
    ? payments.find((record) =>
      record.id === enrollment.paymentId &&
      record.studentId === student.id &&
      (!record.courseId || record.courseId === courseId)
    )
    : null;
  if (linkedPayment) return linkedPayment;

  return payments
    .filter((record) => record.studentId === student.id && record.courseId === courseId)
    .sort((left, right) =>
      String(right.paymentSubmittedAt || right.paymentDate || right.date || '')
        .localeCompare(String(left.paymentSubmittedAt || left.paymentDate || left.date || ''))
    )[0] || null;
}

export function getStudentCourseProgress(db, student, course) {
  const modules = isCoursePublished(course?.status) && Array.isArray(course?.modules)
    ? course.modules.filter((module) =>
      module &&
      typeof module === 'object' &&
      typeof module.id === 'string' &&
      module.id.trim() &&
      isCurriculumPublished(module.status)
    )
    : [];
  const studentProgress = Array.isArray(db.lessonProgress) ? db.lessonProgress : [];
  const courseLessons = getCourseLessons(course);
  const completedIds = new Set(studentProgress
    .filter((record) =>
      record.studentId === student.id &&
      record.courseId === course.id &&
      typeof record.completedAt === 'string' &&
      Number.isFinite(Date.parse(record.completedAt))
    )
    .map((record) => `${record.moduleId}:${record.lessonId}`));
  const lessonCount = courseLessons.length;
  const completedLessonCount = courseLessons.filter((lesson) =>
    completedIds.has(`${lesson.moduleId}:${lesson.id}`)
  ).length;

  return {
    modules: modules.map((module) => {
      const moduleId = module.id.trim();
      const lessons = getCourseModuleLessons(module).filter((lesson) => isCurriculumPublished(lesson.status))
        .map((lesson) => ({
          ...lesson,
          completed: completedIds.has(`${moduleId}:${lesson.id}`),
        }));
      const completedLessons = lessons.filter((lesson) => lesson.completed).length;
      const totalLessons = lessons.length;
      return {
        ...module,
        id: moduleId,
        lessons,
        totalLessons,
        completedLessons,
        status: totalLessons > 0 && completedLessons === totalLessons
          ? 'Completed'
          : completedLessons > 0
            ? 'In Progress'
            : 'Upcoming',
      };
    }),
    totalLessons: lessonCount,
    completedLessons: completedLessonCount,
    overallProgress: lessonCount > 0
      ? Math.round((completedLessonCount / lessonCount) * 100)
      : 0,
  };
}

export function createStudentCourseRouter({
  loadDatabase = getDb,
  persistDatabase = saveDb,
  makeId = randomUUID,
  logError = (message) => console.error(message),
} = {}) {
  const router = express.Router();

  router.get('/course', async (req, res) => {
    try {
      const db = await loadDatabase();
      const student = req.student;
      const { enrollment, courseId, course } = getCourse(db, student);
      const payment = getPayment(db, student, enrollment, courseId);
      const hasAccess = course && hasCourseAccess(student, enrollment, payment);
      const progress = hasAccess ? getStudentCourseProgress(db, student, course) : null;

      res.set('Cache-Control', 'no-store');
      return res.json({
        course: hasAccess
          ? { ...course, modules: progress.modules }
          : null,
        accessStatus: course && !hasAccess
          ? 'access-pending'
          : course
            ? 'available'
            : 'unassigned',
        student: {
          id: student.id,
          exam: student.exam,
          subject: student.subject,
        },
        enrollment: enrollment
          ? {
            enrollmentDate: enrollment.enrollmentDate,
            paymentStatus: enrollment.paymentStatus,
            courseStatus: enrollment.courseStatus,
          }
          : null,
        payment: payment ? { status: payment.status } : null,
        modules: progress?.modules || [],
        progress: progress
          ? { completedLessons: progress.completedLessons, totalLessons: progress.totalLessons }
          : { completedLessons: 0, totalLessons: 0 },
        overallProgress: progress?.overallProgress || 0,
      });
    } catch (error) {
      const diagnostic = error?.code || error?.name || 'unknown database error';
      logError(`Student course load failed (${diagnostic}).`);
      return res.status(503).json({
        message: 'Your course information is temporarily unavailable. Please try again.',
      });
    }
  });

  router.post('/course/modules/:moduleId/lessons/:lessonId/complete', async (req, res) => {
    try {
      const db = await loadDatabase();
      const student = req.student;
      const { enrollment, courseId, course } = getCourse(db, student);
      const payment = getPayment(db, student, enrollment, courseId);
      if (!course || !courseId) {
        return res.status(409).json({ message: 'Enroll in a course before completing lessons.' });
      }
      if (!hasCourseAccess(student, enrollment, payment)) {
        return res.status(403).json({
          message: 'Course content is available after payment verification and enrollment activation.',
        });
      }

      const lesson = getCourseLessons(course).find((item) =>
        item.id === req.params.lessonId && item.moduleId === req.params.moduleId
      );
      if (!lesson) {
        return res.status(404).json({ message: 'Lesson not found in your enrolled course.' });
      }

      if (!Array.isArray(db.lessonProgress)) db.lessonProgress = [];
      const existing = db.lessonProgress.find((record) =>
        record.studentId === student.id &&
        record.courseId === courseId &&
        record.moduleId === lesson.moduleId &&
        record.lessonId === lesson.id &&
        record.completedAt
      );
      let alreadyCompleted = Boolean(existing);
      if (!existing) {
        db.lessonProgress.push({
          id: `lesson-progress-${makeId()}`,
          studentId: student.id,
          courseId,
          moduleId: lesson.moduleId,
          lessonId: lesson.id,
          completedAt: new Date().toISOString(),
        });
        try {
          await persistDatabase(db);
        } catch (error) {
          if (error?.code !== 11000) throw error;
          const latest = await loadDatabase();
          const concurrentlyCompleted = (Array.isArray(latest.lessonProgress) ? latest.lessonProgress : [])
            .some((record) =>
              record.studentId === student.id &&
              record.courseId === courseId &&
              record.moduleId === lesson.moduleId &&
              record.lessonId === lesson.id &&
              record.completedAt
            );
          if (!concurrentlyCompleted) throw error;
          db.lessonProgress = latest.lessonProgress;
          alreadyCompleted = true;
        }
      }

      const progress = getStudentCourseProgress(db, student, course);
      return res.json({
        message: alreadyCompleted ? 'Lesson was already completed.' : 'Lesson marked as completed.',
        modules: progress.modules,
        progress: {
          completedLessons: progress.completedLessons,
          totalLessons: progress.totalLessons,
          overallProgress: progress.overallProgress,
        },
      });
    } catch (error) {
      const diagnostic = error?.code || error?.name || 'unknown database error';
      logError(`Student lesson completion failed (${diagnostic}).`);
      return res.status(503).json({
        message: 'Lesson progress could not be saved. Please try again.',
      });
    }
  });

  return router;
}

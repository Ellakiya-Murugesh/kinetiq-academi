import express from 'express';
import { getDb } from '../db.js';
import { getStudentCourseProgress } from './studentCourse.js';

function getRecords(database, collectionName) {
  const records = database?.[collectionName];
  if (!Array.isArray(records)) {
    const error = new Error('Student dashboard data is unavailable.');
    error.code = 'STUDENT_DASHBOARD_DATA_UNAVAILABLE';
    throw error;
  }
  return records;
}

function getOptionalRecords(database, collectionName) {
  const records = database?.[collectionName];
  return Array.isArray(records) ? records : [];
}

function canonicalSubject(subject) {
  const value = String(subject || '').trim().toLowerCase().replace(/[\s_-]+/g, ' ');
  const aliases = {
    cse: 'cse',
    'gate cse': 'cse',
    'computer science engineering': 'cse',
    'computer science engineering (cse)': 'cse',
    'computer science and engineering': 'cse',
    'computer science & information technology': 'cse',
    it: 'it',
    'information technology': 'it',
    me: 'me',
    'gate me': 'me',
    mechanical: 'me',
    'mechanical engineering': 'me',
    ece: 'ece',
    'gate ece': 'ece',
    'electronics and communication engineering': 'ece',
    'electronics and communication engineering (ece)': 'ece',
    chemistry: 'chemistry',
    'gate cy': 'chemistry',
    physics: 'physics',
    ph: 'physics',
    'gate ph': 'physics',
  };
  return aliases[value] || value;
}

function safeDiagnostic(error) {
  return String(error?.code || error?.name || 'STUDENT_DASHBOARD_ERROR')
    .replace(/[^A-Za-z0-9_-]/g, '')
    .slice(0, 48);
}

function isVisibleAnnouncement(announcement, student) {
  if (!announcement || typeof announcement !== 'object' || !student) return false;
  const audience = String(announcement.audience || '');
  const exam = student.exam || 'GATE';
  const subject = student.subject || student.gatePaper;
  const status = String(announcement.status || '').toLowerCase();
  if (status !== 'active' && status !== 'published') return false;
  if (announcement.studentId && announcement.studentId !== student.id) return false;
  if (announcement.courseId && announcement.courseId !== student.courseId) return false;
  if (announcement.batchId && announcement.batchId !== student.batchId) return false;
  return audience.toLowerCase() === 'all students' ||
    audience.toLowerCase() === `${exam} students`.toLowerCase() ||
    Boolean(subject && canonicalSubject(audience) === canonicalSubject(subject)) ||
    Boolean(student.batch && audience.toLowerCase() === String(student.batch).toLowerCase());
}

function publicAnnouncement(announcement) {
  return {
    id: announcement.id,
    title: announcement.title,
    message: announcement.message || announcement.content || announcement.description || '',
    publishDate: announcement.publishDate || announcement.date || '',
    category: announcement.category || 'General',
    priority: announcement.priority || 'Medium',
    keywords: Array.isArray(announcement.keywords) ? announcement.keywords : [],
  };
}

function getSyllabusProgress(database, student, course) {
  const progress = course
    ? getStudentCourseProgress(database, student, course).overallProgress
    : 0;

  return {
    percentage: progress,
    status: progress === 0
      ? 'Not Yet Started'
      : progress === 100
        ? 'Completed'
        : 'In Progress',
  };
}

export function createStudentDashboardRouter({
  loadDatabase = getDb,
  logError = (message) => console.error(message),
} = {}) {
  const router = express.Router();

  router.get('/dashboard', async (req, res) => {
    try {
      const database = await loadDatabase();
      const student = req.student;
      if (!student) return res.status(404).json({ message: 'Student profile not found.' });

      const courses = getOptionalRecords(database, 'courses');
      const liveSessions = getOptionalRecords(database, 'liveSessions');
      const results = getOptionalRecords(database, 'results');
      const announcements = getOptionalRecords(database, 'announcements');
      const enrollments = getOptionalRecords(database, 'enrollments');
      const courseId = student.courseId || enrollments.find((record) => record.studentId === student.id)?.courseId;
      const course = courses.find((record) => record.id === courseId) || null;
      const exam = student.exam || 'GATE';
      const subject = student.subject || student.gatePaper || '';
      const upcomingClass = liveSessions.find((session) =>
        session.status === 'Published' &&
        (session.exam === exam || session.exam === 'All Competitive Exams') &&
        (session.subject === subject || session.subject === 'Chemistry')
      ) || null;
      const recentResults = results
        .filter((result) => result.studentId === student.id)
        .slice(0, 3);
      const visibleAnnouncements = announcements
        .filter((announcement) => isVisibleAnnouncement(announcement, student))
        .slice(0, 3)
        .map(publicAnnouncement);

      return res.json({
        student,
        syllabusProgress: getSyllabusProgress(database, student, course),
        course,
        upcomingClass,
        recentResults,
        announcements: visibleAnnouncements,
      });
    } catch (error) {
      logError(`Student dashboard load failed (${safeDiagnostic(error)}).`);
      return res.status(503).json({
        message: 'The student dashboard is temporarily unavailable. Please try again.',
      });
    }
  });

  router.get('/announcements', async (req, res) => {
    try {
      const database = await loadDatabase();
      const student = req.student;
      if (!student) return res.status(404).json({ message: 'Student profile not found.' });

      const announcements = getRecords(database, 'announcements')
        .filter((announcement) => isVisibleAnnouncement(announcement, student))
        .map(publicAnnouncement);
      return res.json(announcements);
    } catch (error) {
      logError(`Student announcements load failed (${safeDiagnostic(error)}).`);
      return res.status(503).json({
        message: 'Announcements are temporarily unavailable. Please try again.',
      });
    }
  });

  return router;
}

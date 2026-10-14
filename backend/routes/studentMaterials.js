import express from 'express';
import { getDb } from '../db.js';

function safeDiagnostic(error) {
  return String(error?.code || error?.name || 'STUDENT_MATERIALS_ERROR')
    .replace(/[^A-Za-z0-9_-]/g, '')
    .slice(0, 48);
}

function normalizedValue(value) {
  return String(value ?? '').trim().toLowerCase().replace(/[\s_-]+/g, ' ');
}

export function isSafeMaterialFileUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return false;
  const fileUrl = value.trim();
  if (fileUrl.startsWith('/') && !fileUrl.startsWith('//') && !fileUrl.includes('\\')) {
    try {
      return !decodeURIComponent(fileUrl).split(/[/?#]/).includes('..') &&
        !/[\u0000-\u001F\u007F]/.test(fileUrl);
    } catch {
      return false;
    }
  }

  try {
    const parsed = new URL(fileUrl);
    return parsed.protocol === 'https:' && Boolean(parsed.hostname);
  } catch {
    return false;
  }
}

function isMaterialForExam(material, student) {
  const materialExam = normalizedValue(material.exam);
  const studentExam = normalizedValue(student.exam || 'GATE');
  return materialExam === studentExam ||
    materialExam === 'all' ||
    materialExam === 'all competitive exams';
}

function hasMaterialAccess(material, student) {
  if (material.courseId && material.courseId !== student.courseId) return false;

  const accessLevel = normalizedValue(material.accessLevel);
  if (accessLevel === 'public') return true;
  return accessLevel === 'enrolled students only' && Boolean(student.courseId);
}

export function selectStudentMaterials(database, student) {
  if (!Array.isArray(database?.materials)) return [];

  return database.materials
    .filter((material) =>
      material &&
      material.status === 'Published' &&
      isSafeMaterialFileUrl(material.fileUrl) &&
      isMaterialForExam(material, student) &&
      hasMaterialAccess(material, student)
    )
    .map((material) => ({
      id: material.id,
      title: material.title || '',
      exam: material.exam || '',
      subject: material.subject || '',
      category: material.category || 'Study Notes',
      description: material.description || '',
      fileUrl: material.fileUrl.trim(),
      fileSize: material.fileSize || '',
      pages: material.pages ?? null,
      accessLevel: material.accessLevel,
    }));
}

export function createStudentMaterialsRouter({
  loadDatabase = getDb,
  logError = (message) => console.error(message),
} = {}) {
  const router = express.Router();

  router.get('/materials', async (req, res) => {
    try {
      const database = await loadDatabase();
      if (!req.student) return res.status(404).json({ message: 'Student profile not found.' });
      return res.json(selectStudentMaterials(database, req.student));
    } catch (error) {
      logError(`Student materials load failed (${safeDiagnostic(error)}).`);
      return res.status(503).json({
        message: 'Study materials are temporarily unavailable. Please try again.',
      });
    }
  });

  return router;
}

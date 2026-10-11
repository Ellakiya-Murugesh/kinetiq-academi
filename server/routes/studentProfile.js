import express from 'express';
import { getDb, saveDb } from '../db.js';
import { requireStudent } from '../middleware/auth.js';

const GENDERS = new Set(['Female', 'Male', 'Non-binary', 'Prefer not to say']);
const OPTIONAL_TEXT_LIMITS = {
  address: 2000,
  qualification: 200,
  college: 200,
  gatePaper: 120,
};

function dateValue(value) {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return typeof value === 'string' ? value : '';
}

function validateOptionalFields(body, student) {
  const fields = {
    dateOfBirth: dateValue(student.dateOfBirth),
    gender: student.gender || '',
    address: student.address || '',
    qualification: student.qualification || '',
    college: student.college || '',
    gatePaper: student.gatePaper || '',
    gateAttemptYear: student.gateAttemptYear ? String(student.gateAttemptYear) : '',
  };

  for (const [field, maxLength] of Object.entries(OPTIONAL_TEXT_LIMITS)) {
    if (!(field in body)) continue;
    if (body[field] === null || body[field] === '') {
      fields[field] = '';
      continue;
    }
    if (typeof body[field] !== 'string') {
      return { error: `${field} must be text.` };
    }
    const value = body[field].trim();
    if (value.length > maxLength) {
      return { error: `${field} must be ${maxLength} characters or fewer.` };
    }
    fields[field] = value;
  }

  if ('dateOfBirth' in body) {
    const value = body.dateOfBirth;
    if (value !== '' && value !== null) {
      if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return { error: 'Enter a valid date of birth.' };
      }
      const date = new Date(`${value}T00:00:00.000Z`);
      if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
        return { error: 'Enter a valid date of birth.' };
      }
      if (date > new Date(new Date().toISOString().slice(0, 10))) {
        return { error: 'Date of birth cannot be in the future.' };
      }
      fields.dateOfBirth = value;
    } else {
      fields.dateOfBirth = '';
    }
  }

  if ('gender' in body) {
    const value = body.gender;
    if (value !== null && value !== '' && !GENDERS.has(value)) {
      return { error: 'Select a valid gender option.' };
    }
    fields.gender = value || '';
  }

  if ('gateAttemptYear' in body) {
    const value = body.gateAttemptYear;
    const currentYear = new Date().getFullYear();
    if (
      value !== null &&
      (typeof value !== 'string' ||
        (value !== '' &&
          (!/^\d{4}$/.test(value) ||
            Number(value) < currentYear - 1 ||
            Number(value) > currentYear + 5)))
    ) {
      return { error: 'Select a valid GATE attempt year.' };
    }
    fields.gateAttemptYear = value || '';
  }

  return { fields };
}

function safeProfileFailure(res, operation, error) {
  const diagnostic = error?.code || error?.name || 'unknown database error';
  console.error(`Student profile ${operation} failed (${diagnostic}).`);
  return res.status(503).json({
    message: 'Your profile is temporarily unavailable. Please try again shortly.',
  });
}

function profileResponse(student, user) {
  return {
    ...student,
    name: user.name || student.name || '',
    email: user.email || student.email || '',
    phone: user.phone || user.mobile || student.phone || student.mobile || '',
    dateOfBirth: dateValue(student.dateOfBirth),
    gender: student.gender || '',
    address: student.address || '',
    qualification: student.qualification || '',
    college: student.college || '',
    gatePaper: student.gatePaper || '',
    gateAttemptYear: student.gateAttemptYear ? String(student.gateAttemptYear) : '',
  };
}

export function createStudentProfileRouter({
  authenticateStudent = requireStudent,
  loadDatabase = getDb,
  persistDatabase = saveDb,
} = {}) {
  const router = express.Router();
  router.use(authenticateStudent);

  router.get('/', async (req, res) => {
    let db;
    try {
      db = await loadDatabase();
    } catch (error) {
      return safeProfileFailure(res, 'load', error);
    }

    const student = db.students.find((record) =>
      record.userId === req.user.id && record.id === req.student.id
    );
    const user = db.users.find((record) => record.id === req.user.id && record.role === 'STUDENT');
    if (!student || !user) {
      return res.status(404).json({ message: 'Student profile not found.' });
    }

    return res.json({
      student: profileResponse(student, user),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone || user.mobile || '',
        role: user.role,
      },
    });
  });

  router.put('/', async (req, res) => {
    const body = req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return res.status(400).json({ message: 'Enter valid profile details.' });
    }
    if (typeof body.name !== 'string' || !body.name.trim() || body.name.trim().length > 120) {
      return res.status(400).json({ message: 'Enter your name (up to 120 characters).' });
    }
    if (
      typeof body.email !== 'string' ||
      body.email.trim().length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim())
    ) {
      return res.status(400).json({ message: 'Enter a valid email address.' });
    }

    let db;
    try {
      db = await loadDatabase();
    } catch (error) {
      return safeProfileFailure(res, 'save', error);
    }

    const studentIndex = db.students.findIndex((record) =>
      record.userId === req.user.id && record.id === req.student.id
    );
    const userIndex = db.users.findIndex((record) =>
      record.id === req.user.id && record.role === 'STUDENT'
    );
    if (studentIndex === -1 || userIndex === -1) {
      return res.status(404).json({ message: 'Student profile not found.' });
    }

    const name = body.name.trim();
    const email = body.email.trim();
    if (db.users.some((record) =>
      record.id !== req.user.id &&
      typeof record.email === 'string' &&
      record.email.toLowerCase() === email.toLowerCase()
    )) {
      return res.status(409).json({ message: 'That email address is already in use.' });
    }

    const optional = validateOptionalFields(body, db.students[studentIndex]);
    if (optional.error) return res.status(400).json({ message: optional.error });

    const existingStudent = db.students[studentIndex];
    const updatedStudent = {
      ...existingStudent,
      name,
      email,
      ...optional.fields,
    };
    const existingUser = db.users[userIndex];
    const updatedUser = { ...existingUser, name, email };
    db.students[studentIndex] = updatedStudent;
    db.users[userIndex] = updatedUser;

    try {
      await persistDatabase(db);
    } catch (error) {
      if (error?.code === 'WRITE_CONFLICT') {
        return res.status(409).json({ message: 'Your profile changed in another request. Reload and try again.' });
      }
      if (error?.code === 11000) {
        return res.status(409).json({ message: 'That email address is already in use.' });
      }
      return safeProfileFailure(res, 'save', error);
    }

    return res.json({
      message: 'Profile updated successfully.',
      student: profileResponse(updatedStudent, updatedUser),
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone || updatedUser.mobile || '',
        role: updatedUser.role,
      },
    });
  });

  return router;
}

export interface FacultyMember {
  id: number;
  name: string;
  qualification: string;
  institution: string;
  subject: string;
  achievement: string;
  photo: string;
  bio: string;
}

export const faculty: FacultyMember[] = [
  {
    id: 1,
    name: '[FACULTY NAME]',
    qualification: '[QUALIFICATION — e.g., PhD in Chemistry]',
    institution: '[INSTITUTION NAME]',
    subject: 'Chemistry',
    achievement: '[RANK / ACHIEVEMENT — VERIFY BEFORE PUBLISHING]',
    photo: '[REPLACE WITH FACULTY PHOTO]',
    bio: '[REPLACE WITH FACULTY BIO] — A brief description of teaching experience and expertise areas.',
  },
  {
    id: 2,
    name: '[FACULTY NAME]',
    qualification: '[QUALIFICATION — e.g., PhD in Physics]',
    institution: '[INSTITUTION NAME]',
    subject: 'Physics',
    achievement: '[RANK / ACHIEVEMENT — VERIFY BEFORE PUBLISHING]',
    photo: '[REPLACE WITH FACULTY PHOTO]',
    bio: '[REPLACE WITH FACULTY BIO] — A brief description of teaching experience and expertise areas.',
  },
  {
    id: 3,
    name: '[FACULTY NAME]',
    qualification: '[QUALIFICATION]',
    institution: '[INSTITUTION NAME]',
    subject: 'Chemistry',
    achievement: '[RANK / ACHIEVEMENT — VERIFY BEFORE PUBLISHING]',
    photo: '[REPLACE WITH FACULTY PHOTO]',
    bio: '[REPLACE WITH FACULTY BIO] — A brief description of teaching experience and expertise areas.',
  },
  {
    id: 4,
    name: '[FACULTY NAME]',
    qualification: '[QUALIFICATION]',
    institution: '[INSTITUTION NAME]',
    subject: 'Physics',
    achievement: '[RANK / ACHIEVEMENT — VERIFY BEFORE PUBLISHING]',
    photo: '[REPLACE WITH FACULTY PHOTO]',
    bio: '[REPLACE WITH FACULTY BIO] — A brief description of teaching experience and expertise areas.',
  },
];

export interface LiveSession {
  id: string;
  title: string;
  topic: string;
  subject: 'Chemistry' | 'Physics';
  exam: 'GATE';
  faculty: string;
  date: string;
  time: string;
  status: 'upcoming' | 'live' | 'recorded';
  joinUrl?: string;
  recordingUrl?: string;
  duration: string;
}

export const upcomingSessions: LiveSession[] = [];

export const recordedSessions: LiveSession[] = [];

export interface Course {
  id: string;
  title: string;
  badge: string;
  startDate: string;
  duration: string;
  price: string;
  originalPrice: string;
  description: string;
  features: string[];
  schedule: { day: string; activity: string }[];
  targetExams: string[];
  subjects: string[];
}

export const courses: Course[] = [
  {
    id: '100-day-comprehensive',
    title: '100-Day Online Live Coaching Program',
    badge: 'Flagship Intensive',
    startDate: 'November 1',
    duration: '100 Days Intensive',
    price: '₹10,000',
    originalPrice: '₹15,000',
    description: 'A structured, high-intensity live coaching program designed to build strong theoretical fundamentals, master problem-solving techniques, and maximize test performance in Chemistry and Physics.',
    features: [
      'Daily Live Online Interactive Classes (2 hours daily)',
      '5 Days Live Classes + 1 Dedicated Test/Revision Day per week',
      'Structured Day-by-Day 100-Day Roadmap',
      'Comprehensive Digital Study Notes & Formula Sheets',
      'Weekly Unit Tests & Full-Length Exam Mock Series',
      'Interactive Doubt-Solving Sessions with Mentors',
      'Recorded Class Sessions [IF AVAILABLE]',
      'Student Performance Tracking & Analytics [OPTIONAL]',
    ],
    schedule: [
      { day: 'Monday', activity: 'Live Concept Lecture & Core Theory' },
      { day: 'Tuesday', activity: 'Live Problem-Solving & Numerical Applications' },
      { day: 'Wednesday', activity: 'Advanced Topics & PYQ Breakdown' },
      { day: 'Thursday', activity: 'Live Class & Speed Techniques' },
      { day: 'Friday', activity: 'Live Class & Weekly Concept Synthesis' },
      { day: 'Saturday', activity: 'Dedicated Test / In-Depth Review' },
      { day: 'Sunday', activity: 'Self Study / Recovery / Doubt Backlog' },
    ],
    targetExams: ['GATE', 'UGC NET', 'CSIR NET'],
    subjects: ['Chemistry', 'Physics'],
  },
];

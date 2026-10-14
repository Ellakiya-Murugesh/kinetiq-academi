export interface Exam {
  id: string;
  name: string;
  fullName: string;
  description: string;
  subjects: string[];
  icon: string;
  color: string;
  benefits: string[];
  chemistryTopics: string[];
  physicsTopics: string[];
  examPattern: string;
  prepStrategy: string;
  careerOpportunities: string[];
}

export const exams: Exam[] = [
  {
    id: 'gate',
    name: 'GATE',
    fullName: 'Graduate Aptitude Test in Engineering',
    description: 'Prepare for GATE with structured concepts, problem solving, and weekly tests in Chemistry and Physics.',
    subjects: ['Chemistry', 'Physics', 'CSE & IT', 'Mechanical', 'ECE'],
    icon: 'GraduationCap',
    color: 'blue',
    benefits: [
      'Eligibility for M.Tech/M.E. admissions at IITs, NITs, and other institutions',
      'PSU recruitment opportunities',
      'Research fellowship eligibility',
      'International higher education opportunities',
    ],
    chemistryTopics: [
      'Physical Chemistry',
      'Organic Chemistry',
      'Inorganic Chemistry',
      'Analytical Chemistry',
      'Polymer Chemistry',
      'Spectroscopy',
      'Chemical Engineering Basics',
      'Mathematics for Chemistry',
    ],
    physicsTopics: [
      'Classical Mechanics',
      'Electromagnetic Theory',
      'Quantum Mechanics',
      'Thermodynamics & Statistical Mechanics',
      'Optics',
      'Atomic & Molecular Physics',
      'Solid State Physics',
      'Nuclear & Particle Physics',
      'Mathematical Physics',
    ],
    examPattern: '[VERIFY WITH LATEST OFFICIAL NOTIFICATION] GATE typically consists of multiple-choice and numerical answer type questions. The exam duration is generally 3 hours with 65 questions carrying 100 marks.',
    prepStrategy: 'Focus on building strong fundamentals first. Cover the complete syllabus systematically, practice previous year questions, and take regular mock tests. Our 100-day plan divides preparation into concept building (Days 1-60), problem practice (Days 61-85), and revision with mock tests (Days 86-100).',
    careerOpportunities: [
      'M.Tech/M.E. admissions at premier institutions',
      'Direct PhD opportunities at research institutions',
      'PSU recruitment (subject to GATE score and eligibility)',
      'Research positions at national laboratories',
    ],
  },
];

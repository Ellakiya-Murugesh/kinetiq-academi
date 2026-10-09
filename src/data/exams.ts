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
    description: 'Prepare for GATE with structured concepts, problem solving and weekly tests.',
    subjects: ['Chemistry', 'Physics'],
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
  {
    id: 'ugc-net',
    name: 'UGC NET',
    fullName: 'University Grants Commission National Eligibility Test',
    description: 'Prepare for NET and build the foundation required for teaching and research opportunities.',
    subjects: ['Chemistry', 'Physics'],
    icon: 'BookOpen',
    color: 'emerald',
    benefits: [
      'Eligibility for Assistant Professor positions',
      'JRF (Junior Research Fellowship) qualification',
      'Career in academia and teaching',
      'Research opportunities at universities',
    ],
    chemistryTopics: [
      'Inorganic Chemistry',
      'Organic Chemistry',
      'Physical Chemistry',
      'Analytical Chemistry',
      'Spectroscopy & Instrumentation',
      'Polymer Chemistry',
      'Bio-inorganic Chemistry',
      'Environmental Chemistry',
    ],
    physicsTopics: [
      'Mathematical Physics',
      'Classical Mechanics',
      'Electromagnetic Theory',
      'Quantum Mechanics',
      'Thermodynamics & Statistical Physics',
      'Electronics',
      'Atomic & Molecular Physics',
      'Nuclear & Particle Physics',
    ],
    examPattern: '[VERIFY WITH LATEST OFFICIAL NOTIFICATION] UGC NET generally consists of two papers conducted in a single session. Paper I tests teaching/research aptitude, and Paper II is subject-specific.',
    prepStrategy: 'Balance preparation between Paper I (teaching aptitude) and Paper II (subject knowledge). Focus on conceptual clarity, cover the complete UGC syllabus, and practice with previous year papers. Our program provides dedicated sessions for both papers.',
    careerOpportunities: [
      'Assistant Professor positions at colleges and universities',
      'JRF for pursuing research (subject to eligibility)',
      'Academic and teaching career pathways',
      'Research positions at academic institutions',
    ],
  },
  {
    id: 'csir-net',
    name: 'CSIR NET',
    fullName: 'Council of Scientific and Industrial Research NET',
    description: 'Focused preparation for JRF and research-oriented competitive examinations.',
    subjects: ['Chemistry', 'Physics'],
    icon: 'Atom',
    color: 'violet',
    benefits: [
      'JRF (Junior Research Fellowship) with monthly stipend',
      'Lectureship eligibility',
      'Research career at CSIR laboratories',
      'PhD admission support at research institutions',
    ],
    chemistryTopics: [
      'Inorganic Chemistry',
      'Organic Chemistry', 
      'Physical Chemistry',
      'Interdisciplinary Topics',
      'Chemical Kinetics',
      'Electrochemistry',
      'Photochemistry',
      'Surface Chemistry',
    ],
    physicsTopics: [
      'Mathematical Methods',
      'Classical Mechanics',
      'Electromagnetic Theory',
      'Quantum Mechanics',
      'Thermodynamics & Statistical Mechanics',
      'Electronics & Experimental Methods',
      'Atomic & Molecular Physics',
      'Condensed Matter Physics',
      'Nuclear & Particle Physics',
    ],
    examPattern: '[VERIFY WITH LATEST OFFICIAL NOTIFICATION] CSIR NET typically has three parts: Part A (General Aptitude), Part B (Subject-based MCQs), and Part C (Higher-value subject questions). Total duration is generally 3 hours.',
    prepStrategy: 'Start with Part B concepts for a solid foundation, then advance to Part C problem-solving. Part A requires aptitude practice. Our 100-day program covers all three parts with dedicated problem-solving sessions for Part C.',
    careerOpportunities: [
      'JRF with fellowship for pursuing PhD research',
      'Lectureship/Assistant Professor eligibility',
      'Research positions at CSIR laboratories',
      'PhD admissions at research institutions',
    ],
  },
];

export interface GateCourse {
  code: string;
  title: string;
  label: string;
  description: string;
}

export const GATE_COURSES: GateCourse[] = [
  {
    code: 'GATE-CY',
    title: 'GATE Chemistry',
    label: 'Chemistry',
    description: 'Strengthen your core chemistry fundamentals, problem-solving speed, and exam strategy for the GATE Chemistry paper.',
  },
  {
    code: 'GATE-PH',
    title: 'GATE Physics',
    label: 'Physics',
    description: 'Build conceptual clarity across physics fundamentals, derivations, and numerical problem-solving for GATE.',
  },
  {
    code: 'GATE-ME',
    title: 'GATE Mechanical Engineering',
    label: 'Mechanical Engineering',
    description: 'Master core mechanical engineering topics with focused GATE preparation and weekly performance review.',
  },
  {
    code: 'GATE-CSE',
    title: 'GATE Computer Science Engineering (CSE)',
    label: 'Computer Science Engineering (CSE)',
    description: 'Prepare strategically for CSE topics with structured mentoring, regular tests, and concept reinforcement.',
  },
  {
    code: 'GATE-ECE',
    title: 'GATE Electronics and Communication Engineering (ECE)',
    label: 'Electronics and Communication Engineering (ECE)',
    description: 'Develop confidence in core ECE subjects with a disciplined, exam-oriented preparation plan.',
  },
];

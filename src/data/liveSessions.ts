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

export const upcomingSessions: LiveSession[] = [
  {
    id: 'live-1',
    title: 'GATE Quantum Operators & Angular Momentum',
    topic: 'Operator algebra, eigenvalues, and hermiticity in quantum chemistry',
    subject: 'Chemistry',
    exam: 'GATE',
    faculty: '[FACULTY NAME]',
    date: 'Upcoming Monday',
    time: '06:00 PM - 08:00 PM IST',
    status: 'upcoming',
    joinUrl: '[LIVE CLASS LINK]',
    duration: '120 mins',
  },
  {
    id: 'live-2',
    title: 'Lagrangian Formalism & Small Oscillations in Classical Mechanics',
    topic: 'Generalized coordinates, Euler-Lagrange equations, and normal modes',
    subject: 'Physics',
    exam: 'GATE',
    faculty: '[FACULTY NAME]',
    date: 'Upcoming Tuesday',
    time: '06:30 PM - 08:30 PM IST',
    status: 'upcoming',
    joinUrl: '[LIVE CLASS LINK]',
    duration: '120 mins',
  },
  {
    id: 'live-3',
    title: 'Stereochemistry & Pericyclic Reactions Masterclass',
    topic: 'Woodward-Hoffmann rules, sigmatropic shifts, and frontier molecular orbitals',
    subject: 'Chemistry',
    exam: 'GATE',
    faculty: '[FACULTY NAME]',
    date: 'Upcoming Wednesday',
    time: '06:00 PM - 08:00 PM IST',
    status: 'upcoming',
    joinUrl: '[LIVE CLASS LINK]',
    duration: '120 mins',
  },
  {
    id: 'live-4',
    title: 'Electrodynamics Boundary Value Problems & Waveguides',
    topic: 'TE/TM modes in rectangular waveguides and skin depth derivations',
    subject: 'Physics',
    exam: 'GATE',
    faculty: '[FACULTY NAME]',
    date: 'Upcoming Thursday',
    time: '07:00 PM - 09:00 PM IST',
    status: 'upcoming',
    joinUrl: '[LIVE CLASS LINK]',
    duration: '120 mins',
  },
  {
    id: 'live-5',
    title: 'Weekly Revision & Comprehensive Unit Test Discussion',
    topic: 'Live solution breakdown for Saturday mock test review with doubt clearing',
    subject: 'Chemistry',
    exam: 'GATE',
    faculty: '[FACULTY NAME]',
    date: 'Upcoming Saturday',
    time: '10:00 AM - 01:00 PM IST',
    status: 'upcoming',
    joinUrl: '[LIVE CLASS LINK]',
    duration: '180 mins',
  },
];

export const recordedSessions: LiveSession[] = [
  {
    id: 'rec-1',
    title: 'Chemical Thermodynamics & Maxwell Relations Solved PYQs',
    topic: 'Thermodynamic potentials, chemical potential, and phase equilibrium',
    subject: 'Chemistry',
    exam: 'GATE',
    faculty: '[FACULTY NAME]',
    date: 'October 2, 2026',
    time: 'Completed',
    status: 'recorded',
    recordingUrl: '[RECORDING LINK]',
    duration: '115 mins',
  },
  {
    id: 'rec-2',
    title: 'Thermodynamics & Canonical Ensembles in Statistical Physics',
    topic: 'Microcanonical vs canonical distributions, partition functions, and density of states',
    subject: 'Physics',
    exam: 'GATE',
    faculty: '[FACULTY NAME]',
    date: 'September 28, 2026',
    time: 'Completed',
    status: 'recorded',
    recordingUrl: '[RECORDING LINK]',
    duration: '124 mins',
  },
  {
    id: 'rec-3',
    title: 'GATE Chemistry PYQ Breakdown: Spectroscopy & Dynamics',
    topic: 'NMR patterns, energy level transitions, and conceptual problem solving',
    subject: 'Chemistry',
    exam: 'GATE',
    faculty: '[FACULTY NAME]',
    date: 'September 24, 2026',
    time: 'Completed',
    status: 'recorded',
    recordingUrl: '[RECORDING LINK]',
    duration: '95 mins',
  },
  {
    id: 'rec-4',
    title: 'NMR & Mass Spectrometry Structural Elucidation Techniques',
    topic: '1H-NMR splitting, chemical shift predictions, and fragmentation pathways',
    subject: 'Chemistry',
    exam: 'GATE',
    faculty: '[FACULTY NAME]',
    date: 'September 20, 2026',
    time: 'Completed',
    status: 'recorded',
    recordingUrl: '[RECORDING LINK]',
    duration: '110 mins',
  },
  {
    id: 'rec-5',
    title: 'Solid State Physics: Crystal Lattices & X-Ray Diffraction',
    topic: 'Bragg law, structure factor, reciprocal lattice vectors, and Miller indices',
    subject: 'Physics',
    exam: 'GATE',
    faculty: '[FACULTY NAME]',
    date: 'September 15, 2026',
    time: 'Completed',
    status: 'recorded',
    recordingUrl: '[RECORDING LINK]',
    duration: '105 mins',
  },
];

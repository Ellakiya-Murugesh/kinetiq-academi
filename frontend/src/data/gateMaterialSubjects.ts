export const GATE_MATERIAL_SUBJECTS = [
  { value: 'CSE', label: 'CSE' },
  { value: 'IT', label: 'IT' },
  { value: 'ME', label: 'Mechanical Engineering' },
  { value: 'ECE', label: 'ECE' },
  { value: 'Chemistry', label: 'Chemistry' },
  { value: 'Physics', label: 'Physics' },
] as const;

export type GateMaterialSubject = typeof GATE_MATERIAL_SUBJECTS[number]['value'];

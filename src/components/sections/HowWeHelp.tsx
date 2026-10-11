import React from 'react';
import { FeatureCard } from '../ui/FeatureCard';
import {
  GraduationCap,
  Award,
  CheckSquare2,
  FileQuestion,
  Sparkles
} from 'lucide-react';

export const HowWeHelp: React.FC = () => {
  const features = [
    {
      number: '01',
      title: 'Expert-Led Classes',
      description: 'Learn from experienced educators with strong subject command and structured teaching for GATE-focused problem solving.',
      icon: GraduationCap,
    },
    {
      number: '02',
      title: 'Subject-Focused Guidance',
      description: 'Receive direction aligned with your GATE branch, concept depth, and exam pattern priorities.',
      icon: Award,
      badge: 'GATE Preparation',
    },
    {
      number: '03',
      title: 'Weekly Tests & Mock Exams',
      description: 'Use a disciplined weekly rhythm with classwork, unit tests, and full-length mock exam analysis for improvement.',
      icon: CheckSquare2,
    },
    {
      number: '04',
      title: 'Study Materials & Doubt Support',
      description: 'Access structured notes, PYQ-based practice, revision sheets, and live doubt-solving to keep preparation consistent.',
      icon: FileQuestion,
    },
  ];

  return (
    <section className="section-padding bg-gray-50/70 border-b border-gray-100">
      <div className="container-max">
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 text-primary-600 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Proven Coaching Framework</span>
          </div>

          <h2 className="section-heading">
            How We Support Your GATE Preparation
          </h2>

          <p className="mx-auto max-w-3xl text-base font-semibold leading-relaxed text-gray-600 sm:text-lg">
            Learn from GATE Top Rankers from IIT Madras – Expert-Led Preparation for Your Success
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {features.map((f) => (
            <FeatureCard key={f.number} {...f} />
          ))}
        </div>
      </div>
    </section>
  );
};

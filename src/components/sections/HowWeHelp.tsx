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
      description: 'Learn from experienced educators and IITian faculty with specialized mastery in Chemistry and Physics pedagogy.',
      icon: GraduationCap,
    },
    {
      number: '02',
      title: 'Subject-Focused Guidance',
      description: 'Focused guidance in Chemistry and Physics, with concepts and practice aligned to your GATE subject.',
      icon: Award,
      badge: 'GATE Preparation',
    },
    {
      number: '03',
      title: 'Weekly Tests (5+1 Model)',
      description: '5 days of intensive live classes followed by 1 dedicated full-length mock test and analytical review day every single week.',
      icon: CheckSquare2,
    },
    {
      number: '04',
      title: 'Study Materials & Doubt Sessions',
      description: 'Access curated PDF formula sheets, topic-wise practice questions, and dedicated live doubt-solving sessions.',
      icon: FileQuestion,
    },
  ];

  return (
    <section className="section-padding bg-gray-50/70 border-b border-gray-100">
      <div className="container-max">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 text-primary-600 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Proven Coaching Framework</span>
          </div>

          <h2 className="section-heading">
            How We Support Your GATE Preparation
          </h2>

          <p className="section-subheading mx-auto">
            Our coaching combines expert-led classes, regular tests, curated study materials, and doubt-solving sessions to support your GATE preparation.
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

import React from 'react';
import { exams } from '../../data/exams';
import { ExamCard } from '../ui/ExamCard';
import { BookOpen } from 'lucide-react';

export const ExamSelector: React.FC = () => {
  return (
    <section id="exams" className="section-padding bg-gray-50/70 border-b border-gray-100">
      <div className="container-max">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 text-primary-600 text-xs font-bold uppercase tracking-wider">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Targeted Competitive Tracks</span>
          </div>

          <h2 className="section-heading">
            Choose Your Exam
          </h2>

          <p className="section-subheading mx-auto">
            Comprehensive curriculum design tailored specifically for master&apos;s graduates and final-year students preparing in Chemistry and Physics.
          </p>
        </div>

        {/* 3 Exam Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {exams.map((exam) => (
            <ExamCard key={exam.id} exam={exam} />
          ))}
        </div>
      </div>
    </section>
  );
};

import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, BookOpen, Atom, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Exam } from '../../data/exams';

interface ExamCardProps {
  exam: Exam;
}

export const ExamCard: React.FC<ExamCardProps> = ({ exam }) => {
  const getIcon = () => {
    switch (exam.icon) {
      case 'GraduationCap':
        return <GraduationCap className="w-7 h-7 text-primary-500" />;
      case 'BookOpen':
        return <BookOpen className="w-7 h-7 text-emerald-500" />;
      case 'Atom':
        return <Atom className="w-7 h-7 text-violet-500" />;
      default:
        return <GraduationCap className="w-7 h-7 text-primary-500" />;
    }
  };

  const getAccentBg = () => {
    switch (exam.color) {
      case 'emerald':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100 group-hover:border-emerald-300';
      case 'violet':
        return 'bg-violet-50 text-violet-700 border-violet-100 group-hover:border-violet-300';
      default:
        return 'bg-primary-50 text-primary-700 border-primary-100 group-hover:border-primary-300';
    }
  };

  return (
    <div className="card group p-6 sm:p-8 flex flex-col justify-between hover:border-primary-200 transition-all duration-300">
      <div>
        {/* Header with Icon and Subjects */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center group-hover:scale-110 group-hover:bg-white group-hover:shadow-md transition-all duration-300">
            {getIcon()}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            {exam.subjects.map((sub) => (
              <span
                key={sub}
                className="text-xs font-semibold px-2.5 py-1 rounded-full bg-navy-50 text-navy-600 border border-navy-100"
              >
                {sub}
              </span>
            ))}
          </div>
        </div>

        {/* Title and Full Name */}
        <h3 className="text-2xl font-black text-navy-500 group-hover:text-primary-500 transition-colors mb-1">
          {exam.name}
        </h3>
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
          {exam.fullName}
        </p>

        {/* Description */}
        <p className="text-gray-600 text-sm leading-relaxed mb-6">
          {exam.description}
        </p>

        {/* Benefits bullets */}
        <div className="space-y-2 mb-6 pt-4 border-t border-gray-100">
          {exam.benefits.slice(0, 3).map((benefit, idx) => (
            <div key={idx} className="flex items-start gap-2 text-xs text-gray-600">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>{benefit}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
        <Link
          to={`/exams?tab=${exam.id}`}
          className="inline-flex items-center gap-2 text-sm font-bold text-primary-500 hover:text-primary-700 transition-colors group/link"
        >
          <span>View Exam Details</span>
          <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
        </Link>
        <Link
          to="/payment"
          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-primary-50 hover:text-primary-600 transition-colors"
        >
          Enroll Now
        </Link>
      </div>
    </div>
  );
};

import React from 'react';
import { Link } from 'react-router-dom';
import { Course } from '../../data/courses';
import {
  Calendar,
  Clock,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  BookOpen
} from 'lucide-react';

interface CourseCardProps {
  course: Course;
}

export const CourseCard: React.FC<CourseCardProps> = ({ course }) => {
  return (
    <div className="card border-2 border-primary-500 overflow-hidden shadow-xl">
      {/* Header bar */}
      <div className="bg-primary-500 text-white px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs sm:text-sm font-bold uppercase tracking-wider">
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>{course.badge}</span>
        </div>
        <span className="text-xs bg-white/20 px-2.5 py-0.5 rounded-full font-semibold">
          {course.duration}
        </span>
      </div>

      <div className="p-6 sm:p-10 space-y-8">
        {/* Title and Intro */}
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {course.targetExams.map((e) => (
              <span
                key={e}
                className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-navy-50 text-navy-600 border border-navy-100"
              >
                {e}
              </span>
            ))}
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-primary-50 text-primary-600 border border-primary-100">
              Chemistry &amp; Physics
            </span>
          </div>

          <h3 className="text-2xl sm:text-3xl font-black text-navy-500">
            {course.title}
          </h3>
          <p className="text-gray-600 text-sm sm:text-base mt-2 leading-relaxed">
            {course.description}
          </p>
        </div>

        {/* Pricing */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-primary-50/70 to-blue-50/70 border border-primary-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
              Enrollment Fee
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl sm:text-4xl font-black text-navy-500">
                {course.price}
              </span>
              <span className="text-sm text-gray-400 line-through">
                {course.originalPrice}
              </span>
            </div>
          </div>

          <Link
            to="/payment"
            className="btn-primary py-3 px-8 text-sm font-bold shadow-md shadow-primary-500/25 flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <span>Enroll Now</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Features Checklist */}
        <div>
          <h4 className="text-sm font-extrabold uppercase tracking-wider text-navy-500 mb-4 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary-500" />
            <span>Comprehensive Program Inclusions</span>
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {course.features.map((feat, idx) => (
              <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-gray-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>{feat}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly Schedule Table */}
        <div className="pt-4 border-t border-gray-100">
          <h4 className="text-sm font-extrabold uppercase tracking-wider text-navy-500 mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary-500" />
            <span>Weekly Structured Routine (5+1 Model)</span>
          </h4>

          <div className="overflow-x-auto rounded-2xl border border-gray-200">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-gray-50 text-navy-500 font-bold border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4 w-1/3">Day of the Week</th>
                  <th className="py-3 px-4">Scheduled Activity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {course.schedule.map((row, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                    <td className="py-3 px-4 font-semibold text-navy-500 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-primary-500"></span>
                      {row.day}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {row.activity}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../utils/api';
import { BookOpen, CheckCircle2, Clock, Check, PlayCircle, FileText, ChevronDown } from 'lucide-react';

export const StudentCoursePage: React.FC = () => {
  const [courseData, setCourseData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expandedModule, setExpandedModule] = useState<string>('mod-1');

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setLoading(true);
        const res = await apiRequest('/api/student/course');
        setCourseData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, []);

  if (loading) {
    return <div className="py-12 text-center text-xs text-gray-400">Loading course curriculum...</div>;
  }

  const course = courseData?.course;
  const modules = courseData?.modules || [];
  const overallProgress = courseData?.overallProgress || 64;

  if (!course) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
        <BookOpen className="w-8 h-8 text-primary-500 mx-auto mb-3" />
        <h1 className="text-xl font-bold text-navy-500">No course assigned yet</h1>
        <p className="text-sm text-gray-500 mt-2">Your course curriculum will appear here after enrollment.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-navy-500">
          Course Curriculum &amp; Learning Roadmap
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Detailed module breakdowns, lesson checklists, lecture notes, and syllabus tracking.
        </p>
      </div>

      {/* Course Overview Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary-600 bg-primary-50 px-2.5 py-0.5 rounded-full border border-primary-100">
              {course?.exam} • {course?.subject} Track
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-navy-500 mt-1">
              {course?.name}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Duration: <strong>{course?.duration || '100 Days Intensive'}</strong> • Starts: <strong>{course?.startDate || 'Nov 1, 2026'}</strong>
            </p>
          </div>

          <div className="w-full md:w-64 space-y-1">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-navy-500">Curriculum Progress</span>
              <span className="text-primary-600">{overallProgress}%</span>
            </div>
            <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-primary-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-4">
          {course?.description ||
            'Structured day-by-day roadmap covering fundamental concept building, problem solving, derivations, and full-length weekly CBT examinations.'}
        </p>
      </div>

      {/* Module Breakdown Accordions */}
      <div className="space-y-4">
        <h3 className="font-bold text-base text-navy-500">
          Syllabus Modules (5 Core Sections)
        </h3>

        {modules.map((mod: any) => {
          const isExpanded = expandedModule === mod.id;
          return (
            <div
              key={mod.id}
              className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm transition-all"
            >
              <button
                type="button"
                onClick={() => setExpandedModule(isExpanded ? '' : mod.id)}
                className="w-full p-5 text-left flex items-center justify-between gap-4 hover:bg-gray-50/70 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                      mod.status === 'Completed'
                        ? 'bg-emerald-50 text-emerald-600'
                        : mod.status === 'In Progress'
                        ? 'bg-primary-50 text-primary-600'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {mod.status === 'Completed' ? <Check className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm sm:text-base text-navy-500">
                      {mod.title}
                    </h4>
                    <p className="text-[11px] text-gray-400">
                      {mod.completedLessons} of {mod.totalLessons} lessons completed • Status: {mod.status}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                      mod.status === 'Completed'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : mod.status === 'In Progress'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'bg-gray-100 text-gray-600 border-gray-200'
                    }`}
                  >
                    {mod.status}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  />
                </div>
              </button>

              {isExpanded && (
                <div className="p-5 pt-0 border-t border-gray-100 bg-gray-50/40 space-y-3">
                  <h5 className="text-[11px] font-bold uppercase tracking-wider text-gray-500 pt-3">
                    Subtopics &amp; Classroom Lectures
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {mod.topics.map((t: string, idx: number) => (
                      <div
                        key={idx}
                        className="p-2.5 bg-white rounded-xl border border-gray-200 flex items-center gap-2 text-navy-500 font-medium"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>{t}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StudentCoursePage;

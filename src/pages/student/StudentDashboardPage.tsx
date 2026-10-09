import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import {
  AlertCircle,
  BookOpen,
  Video,
  FileQuestion,
  Award,
  Bell,
  Sparkles,
  ArrowRight,
  Clock,
  Calendar,
  CheckCircle2,
  Radio,
  Play
} from 'lucide-react';

export const StudentDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const res = await apiRequest('/api/student/dashboard');
        setData(res);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not load your student dashboard.');
        console.error('Failed to load student dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-64 bg-gray-200 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-64 bg-white rounded-3xl border border-gray-200 animate-pulse" />
          <div className="h-64 bg-white rounded-3xl border border-gray-200 animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <section className="mx-auto max-w-2xl rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-900" role="alert">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <h1 className="font-bold">Could not load your dashboard</h1>
            <p className="mt-1 text-sm">{error}</p>
            <p className="mt-2 text-sm">Please sign in again to continue.</p>
            <Link className="mt-4 inline-flex rounded-lg bg-navy-500 px-4 py-2 text-sm font-bold text-white hover:bg-navy-600" to="/login">
              Student Login
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const student = data?.student;
  const course = data?.course;
  const upcomingClass = data?.upcomingClass;
  const upcomingTest = data?.upcomingTest;
  const recentResults = data?.recentResults || [];
  const announcements = data?.announcements || [];
  const syllabusProgress = course?.studentProgress ?? student?.progress ?? 0;

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Welcome Hero Banner */}
      <div className="bg-gradient-to-r from-amber-100 via-yellow-50 to-orange-100 rounded-3xl p-6 sm:p-8 text-navy-500 border border-amber-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-amber-800 text-xs font-bold border border-amber-200">
            <Sparkles className="w-3.5 h-3.5 text-orange-500" />
            <span>Target: {student?.exam || 'GATE'} {student?.subject || 'Chemistry'} (2026 Batch)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black">
            Welcome back, {user?.name || student?.name || 'Aspirant'}!
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 max-w-xl leading-relaxed">
            {course
            ? 'You are enrolled in the 100-Day Intensive preparation program. Stay disciplined with your daily 5+1 routine to build a strong GATE preparation plan.'
              : 'Choose your GATE Chemistry or Physics course to begin your 100-Day Intensive preparation program.'}
          </p>
        </div>

        <div className="bg-white/80 rounded-2xl p-4 border border-amber-200 text-center sm:text-right shrink-0 relative z-10">
          <span className="text-[10px] uppercase font-bold text-amber-800 block">Syllabus Completion</span>
          <span className="text-3xl sm:text-4xl font-black">{syllabusProgress}% Completed</span>
          <div className="w-36 bg-amber-100 h-2 rounded-full mt-2 overflow-hidden mx-auto sm:ml-auto">
            <div
              className="bg-amber-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${syllabusProgress}%` }}
            />
          </div>
          {syllabusProgress === 0 && (
            <span className="mt-2 block text-[10px] text-gray-500">No syllabus progress recorded yet.</span>
          )}
        </div>
      </div>

      {/* Main Grid: Left Column (Course + Next Live + Next Test) + Right Column (Results + Notices) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        {/* Left Column (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Card 1: My Course Overview */}
          <div className="card p-6 border border-amber-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-600" />
                <h2 className="font-bold text-base text-navy-500">
                  My Enrolled Program
                </h2>
              </div>
              <Link
                to="/student/course"
                className="text-xs font-bold text-amber-800 hover:text-orange-700 flex items-center gap-1"
              >
                <span>View Full Curriculum</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-extrabold text-xl text-navy-500">
                  {course?.name || 'No course assigned yet'}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  {course ? `Start Date: ${course.startDate} • Duration: ${course.duration}` : 'Course details will appear after enrollment.'}
                </p>
              </div>

              {!course ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                  <p className="text-sm text-gray-700">No active course is linked to your account yet. Select your subject and complete the UPI payment process to request enrollment.</p>
                  <Link to="/student/enroll" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-amber-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-amber-800">
                    <span>Enroll in a GATE course</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              ) : (
              /* Progress metrics */
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Live Classes</span>
                  <span className="text-base font-black text-navy-500">{course?.classesAttended || 26} / {course?.totalClasses || 40}</span>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Materials Read</span>
                  <span className="text-base font-black text-navy-500">{course?.materialsAccessed || 18} Modules</span>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Tests Taken</span>
                  <span className="text-base font-black text-navy-500">{course?.testsCompleted || 5} Tests</span>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Average Score</span>
                  <span className="text-base font-black text-emerald-600">{course?.averageScore || 76.5}%</span>
                </div>
              </div>
              )}
            </div>
          </div>

          {/* Card 2: Upcoming Class */}
          <div className="card p-6 border border-amber-100 bg-gradient-to-br from-white to-orange-50/40">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-red-600 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                <span>Next Scheduled Class</span>
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                Live Today
              </span>
            </div>

            <div className="space-y-3">
              <h3 className="font-bold text-lg text-navy-500">
                {upcomingClass?.title || 'Quantum Operators & Commutator Algebra'}
              </h3>

              <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-amber-600" />
                  {upcomingClass?.date || 'Today'}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  {upcomingClass?.startTime || '18:00'} - {upcomingClass?.endTime || '20:00'} IST
                </span>
                <span>Faculty: <strong>{upcomingClass?.faculty || '[FACULTY NAME]'}</strong></span>
              </div>

              <div className="pt-2 flex items-center justify-between gap-3">
                <a
                  href="#[LIVE-CLASS-LINK]"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('Connecting to Live Class: [LIVE CLASS LINK] — Class stream opens 15 mins prior to class.');
                  }}
                  className="inline-flex items-center gap-2 rounded-xl border-b-2 border-amber-700 bg-amber-500 px-6 py-2.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-orange-500"
                >
                  <Video className="w-4 h-4" />
                  <span>Join Live Classroom</span>
                </a>

                <Link
                  to="/student/live-sessions"
                  className="text-xs font-semibold text-gray-500 hover:text-navy-500"
                >
                  View All Recordings →
                </Link>
              </div>
            </div>
          </div>

          {/* Card 3: Upcoming Test */}
          <div className="card p-6 border border-amber-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 flex items-center gap-1.5">
                <FileQuestion className="w-3.5 h-3.5" />
                <span>Weekly Assessment Engine</span>
              </span>
              <span className="text-xs text-gray-400">
                Available Now
              </span>
            </div>

            <div className="space-y-3">
              <h3 className="font-bold text-base text-navy-500">
                {upcomingTest?.name || 'Unit Test #1: Quantum Mechanics & Operators'}
              </h3>

              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>Duration: <strong>{upcomingTest?.duration || 60} mins</strong></span>
                <span>•</span>
                <span>Marks: <strong>{upcomingTest?.totalMarks || 30} marks</strong></span>
                <span>•</span>
                <span>Questions: <strong>{upcomingTest?.totalQuestions || 15}</strong></span>
              </div>

              <div className="pt-2">
                <Link
                  to="/student/tests"
                  className="inline-flex items-center gap-2 rounded-xl border border-amber-300 bg-white px-5 py-2 text-xs font-bold text-amber-800 transition-colors hover:bg-amber-50"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Launch CBT Test Interface</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Results & Announcements */}
        <div className="lg:col-span-4 space-y-6">
          {/* Card: Recent Results */}
          <div className="card p-5 border border-amber-100 space-y-3">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <h3 className="font-bold text-sm text-navy-500 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-600" />
                <span>Recent Test Scores</span>
              </h3>
              <Link to="/student/results" className="text-[11px] font-bold text-amber-800 hover:text-orange-700 hover:underline">
                All Results
              </Link>
            </div>

            {recentResults.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">No tests submitted yet.</p>
            ) : (
              <div className="space-y-2.5">
                {recentResults.map((res: any) => (
                  <div key={res.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs">
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="font-bold text-navy-500 truncate max-w-[180px]">{res.testName}</span>
                      <span className="font-mono font-black text-emerald-600">{res.percentage}%</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-gray-500">
                      <span>Score: {res.score} / {res.totalMarks}</span>
                      <span>{res.attemptDate}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card: Announcements */}
          <div className="card p-5 border border-amber-100 space-y-3">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <h3 className="font-bold text-sm text-navy-500 flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-amber-500" />
                <span>Batch Notices</span>
              </h3>
              <Link to="/student/announcements" className="text-[11px] font-bold text-amber-800 hover:text-orange-700 hover:underline">
                View All
              </Link>
            </div>

            <div className="space-y-3">
              {announcements.slice(0, 3).map((anc: any) => (
                <div key={anc.id} className="text-xs border-b border-gray-100 pb-2 last:border-b-0 last:pb-0">
                  <span className="font-bold text-navy-500 block">{anc.title}</span>
                  <p className="text-gray-500 text-[11px] line-clamp-2 mt-0.5 leading-relaxed">{anc.message}</p>
                  <span className="text-[10px] text-gray-400 mt-1 block">{anc.publishDate}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default StudentDashboardPage;

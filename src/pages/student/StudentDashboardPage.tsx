import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ApiRequestError, apiRequest } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import {
  BookOpen,
  Video,
  Bell,
  ArrowRight,
  Clock,
  Calendar,
  Radio,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  message: string;
  publishDate: string;
}

interface DashboardData {
  student?: {
    name?: string;
    progress?: number | string | null;
  };
  syllabusProgress?: {
    percentage: number;
    status: string;
  };
  course?: {
    name?: string;
    startDate?: string;
    duration?: string;
  } | null;
  upcomingClass?: {
    title?: string;
    date?: string;
    startTime?: string;
    endTime?: string;
    faculty?: string;
    link?: string;
  } | null;
}

export const StudentDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState('');
  const [dashboardNeedsLogin, setDashboardNeedsLogin] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(true);
  const [announcementsError, setAnnouncementsError] = useState('');
  const [announcementsNeedLogin, setAnnouncementsNeedLogin] = useState(false);

  const fetchDashboard = useCallback(async () => {
    setDashboardLoading(true);
    setDashboardError('');
    setDashboardNeedsLogin(false);
    try {
      const response = await apiRequest('/api/student/dashboard');
      if (!response || typeof response !== 'object' || !('student' in response)) {
        throw new Error('Invalid dashboard response.');
      }
      setData(response);
    } catch (error) {
      const authorizationFailure = error instanceof ApiRequestError && [401, 403].includes(error.status);
      setDashboardNeedsLogin(authorizationFailure);
      setDashboardError(authorizationFailure
        ? 'Your student session is no longer authorized. Sign in again to load your dashboard.'
        : 'We could not load your dashboard details. Please try again.');
    } finally {
      setDashboardLoading(false);
    }
  }, []);

  const fetchAnnouncements = useCallback(async () => {
    setAnnouncementsLoading(true);
    setAnnouncementsError('');
    setAnnouncementsNeedLogin(false);
    try {
      const response = await apiRequest<Announcement[]>('/api/student/announcements');
      if (!Array.isArray(response)) {
        throw new Error('Invalid announcements response.');
      }
      setAnnouncements(response);
    } catch (error) {
      const authorizationFailure = error instanceof ApiRequestError && [401, 403].includes(error.status);
      setAnnouncementsNeedLogin(authorizationFailure);
      setAnnouncementsError(authorizationFailure
        ? 'Your student session is no longer authorized. Sign in again to view batch notices.'
        : 'Announcements are temporarily unavailable. Please try again.');
    } finally {
      setAnnouncementsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchDashboard();
    void fetchAnnouncements();
  }, [fetchDashboard, fetchAnnouncements]);

  if (dashboardLoading) {
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

  const student = data?.student;
  const course = data?.course;
  const upcomingClass = data?.upcomingClass;
  const rawProgress = Number(data?.syllabusProgress?.percentage ?? student?.progress ?? 0);
  const syllabusProgress = Number.isFinite(rawProgress) && rawProgress >= 0 && rawProgress <= 100
    ? rawProgress
    : 0;
  const syllabusStatus = data?.syllabusProgress?.status
    || (syllabusProgress === 0
      ? 'Not Yet Started'
      : syllabusProgress === 100
        ? 'Completed'
        : 'In Progress');

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Welcome Hero Banner */}
      {dashboardError && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <span className="flex items-center gap-2"><AlertCircle className="h-4 w-4 shrink-0" />{dashboardError}</span>
          {dashboardNeedsLogin
            ? <Link to="/login" className="font-bold underline underline-offset-2">Sign in</Link>
            : <button type="button" onClick={() => void fetchDashboard()} className="font-bold underline underline-offset-2">Retry</button>}
        </div>
      )}
      <div className="bg-gradient-to-r from-amber-100 via-yellow-50 to-orange-100 rounded-3xl p-6 sm:p-8 text-navy-500 border border-amber-200 shadow-sm">
        <div className="space-y-2 relative z-10">
          <h1 className="text-2xl sm:text-3xl font-black">
            Welcome back, {user?.name || student?.name || 'Aspirant'}!
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 max-w-xl leading-relaxed">
            Your learning resources, upcoming classes, and important announcements are available here.
          </p>
        </div>
      </div>

      <section aria-labelledby="syllabus-completion-heading" className="card space-y-3 border border-amber-100 p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-amber-600" />
            <h2 id="syllabus-completion-heading" className="font-bold text-sm text-navy-500">Syllabus Completion</h2>
          </div>
          <span className="text-sm font-bold text-amber-800">{syllabusProgress}%</span>
        </div>
        <div
          role="progressbar"
          aria-label="Syllabus completion"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={syllabusProgress}
          className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100"
        >
          <div
            className="h-full rounded-full bg-amber-500 transition-all duration-500"
            style={{ width: `${syllabusProgress}%` }}
          />
        </div>
        <p className="text-xs text-gray-600">Status: <strong>{syllabusStatus}</strong></p>
      </section>

      {/* Main Grid: Course and class information with announcements */}
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

            </div>
          </div>

          {/* Card 2: Upcoming Class */}
          <div className="card p-6 border border-amber-100 bg-gradient-to-br from-white to-orange-50/40">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-red-600 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                <span>Next Scheduled Class</span>
              </span>
            </div>

            <div className="space-y-3">
              <h3 className="font-bold text-lg text-navy-500">
                {upcomingClass?.title || 'No upcoming class scheduled'}
              </h3>

              {upcomingClass && (
                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-amber-600" />
                    {upcomingClass.date}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    {upcomingClass.startTime} - {upcomingClass.endTime} IST
                  </span>
                  {upcomingClass.faculty && <span>Faculty: <strong>{upcomingClass.faculty}</strong></span>}
                </div>
              )}

              <div className="pt-2 flex items-center justify-between gap-3">
                {upcomingClass?.link ? (
                  <a href={upcomingClass.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border-b-2 border-amber-700 bg-amber-500 px-6 py-2.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-orange-500">
                    <Video className="w-4 h-4" />
                    <span>Join Live Classroom</span>
                  </a>
                ) : <span className="text-xs text-gray-500">Class link will appear when available.</span>}

                <Link
                  to="/student/live-sessions"
                  className="text-xs font-semibold text-gray-500 hover:text-navy-500"
                >
                  View All Recordings →
                </Link>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Announcements */}
        <div className="lg:col-span-4 space-y-6">
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
              {announcementsLoading ? (
                <div role="status" className="flex items-center justify-center gap-2 py-5 text-xs text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading announcements…
                </div>
              ) : announcementsError ? (
                <div role="alert" className="space-y-3 py-3 text-center">
                  <p className="text-xs text-rose-700">{announcementsError}</p>
                  {announcementsNeedLogin
                    ? <Link to="/login" className="text-xs font-bold text-amber-800 underline underline-offset-2">Sign in</Link>
                    : <button type="button" onClick={() => void fetchAnnouncements()} className="text-xs font-bold text-amber-800 underline underline-offset-2">Retry</button>}
                </div>
              ) : announcements.length === 0 ? (
                <p className="py-5 text-center text-xs text-gray-500">No announcements available yet.</p>
              ) : announcements.slice(0, 3).map((anc) => (
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

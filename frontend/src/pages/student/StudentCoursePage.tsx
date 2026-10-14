import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ApiRequestError, apiRequest } from '../../utils/api';
import { AlertCircle, BookOpen, Check, ChevronDown, RefreshCw } from 'lucide-react';

interface CourseModule {
  id?: string;
  title?: string;
  totalLessons?: unknown;
  completedLessons?: unknown;
  status?: string;
  topics?: unknown;
  lessons?: CourseLesson[];
}

interface CourseLesson {
  id: string;
  title: string;
  completed?: boolean;
}

interface DisplayCourseModule extends CourseModule {
  id: string;
  totalLessons: number;
  completedLessons: number;
  status: string;
  topics: string[];
  lessons: CourseLesson[];
}

interface StudentCourseResponse {
  accessStatus?: 'available' | 'access-pending' | 'unassigned';
  course?: {
    id?: string;
    name?: string;
    courseName?: string;
    exam?: string;
    subject?: string;
    duration?: string;
    startDate?: string;
    description?: string;
    modules?: CourseModule[];
  } | null;
  student?: {
    exam?: string;
    subject?: string;
  };
  enrollment?: {
    enrollmentDate?: string;
    paymentStatus?: string;
    courseStatus?: string;
  } | null;
  payment?: { status?: string } | null;
  modules?: CourseModule[];
  progress?: { completedLessons: number; totalLessons: number };
  overallProgress?: unknown;
}

interface CompleteLessonResponse {
  modules: CourseModule[];
  progress: {
    completedLessons: number;
    totalLessons: number;
    overallProgress: number;
  };
}

const normalizeLessonCount = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
};

const getModuleStatus = (module: CourseModule): string => {
  const totalLessons = normalizeLessonCount(module?.totalLessons);
  const completedLessons = normalizeLessonCount(module?.completedLessons);

  if (totalLessons > 0 && completedLessons >= totalLessons) return 'Completed';
  if (completedLessons > 0) return 'In Progress';
  return 'Upcoming';
};

const isModuleComplete = (module: CourseModule): boolean => {
  const totalLessons = normalizeLessonCount(module?.totalLessons);
  const completedLessons = normalizeLessonCount(module?.completedLessons);
  return totalLessons > 0 && completedLessons >= totalLessons;
};

export const StudentCoursePage: React.FC = () => {
  const [courseData, setCourseData] = useState<StudentCourseResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [needsLogin, setNeedsLogin] = useState(false);
  const [expandedModule, setExpandedModule] = useState<string>('');
  const [completingLessonId, setCompletingLessonId] = useState('');
  const [lessonError, setLessonError] = useState('');

  const fetchCourse = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    setNeedsLogin(false);
    try {
      const response = await apiRequest<StudentCourseResponse>('/api/student/course', { cache: 'no-store' });
      setCourseData(response);
    } catch (error) {
      setCourseData(null);
      setNeedsLogin(error instanceof ApiRequestError && [401, 403].includes(error.status));
      setLoadError(error instanceof Error
        ? error.message
        : 'Your course information is temporarily unavailable. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const completeLesson = async (moduleId: string, lessonId: string) => {
    setCompletingLessonId(`${moduleId}:${lessonId}`);
    setLessonError('');
    try {
      const response = await apiRequest<CompleteLessonResponse>(
        `/api/student/course/modules/${encodeURIComponent(moduleId)}/lessons/${encodeURIComponent(lessonId)}/complete`,
        { method: 'POST' },
      );
      setCourseData((current) => current ? {
        ...current,
        modules: response.modules,
        course: current.course ? { ...current.course, modules: response.modules } : null,
        progress: {
          completedLessons: response.progress.completedLessons,
          totalLessons: response.progress.totalLessons,
        },
        overallProgress: response.progress.overallProgress,
      } : current);
    } catch (error) {
      setLessonError(error instanceof Error ? error.message : 'Lesson completion could not be saved.');
    } finally {
      setCompletingLessonId('');
    }
  };

  const modules = useMemo<DisplayCourseModule[]>(() => {
    const sourceModules = Array.isArray(courseData?.modules) ? courseData.modules : [];
    return sourceModules
      .filter((module): module is CourseModule => Boolean(module && typeof module === 'object'))
      .map((module, index) => ({
        ...module,
        id: module.id || `course-module-${index}`,
        totalLessons: normalizeLessonCount(module.totalLessons),
        completedLessons: normalizeLessonCount(module.completedLessons),
        status: getModuleStatus(module),
        topics: Array.isArray(module.topics) ? module.topics.filter((topic): topic is string => typeof topic === 'string') : [],
        lessons: Array.isArray(module.lessons)
          ? module.lessons.filter((lesson): lesson is CourseLesson =>
            Boolean(lesson && typeof lesson.id === 'string' && typeof lesson.title === 'string')
          )
          : [],
      }));
  }, [courseData?.modules]);

  const visibleModules = useMemo(
    () => modules.filter((module) => !isModuleComplete(module)),
    [modules],
  );
  const totalLessons = modules.reduce((total, module) => total + module.totalLessons, 0);
  const totalCompletedLessons = modules.reduce(
    (total, module) => total + Math.min(module.completedLessons, module.totalLessons),
    0,
  );
  const overallProgress = totalLessons > 0
    ? Math.min(100, Math.max(0, Math.round((totalCompletedLessons / totalLessons) * 100)))
    : 0;

  useEffect(() => {
    void fetchCourse();
  }, [fetchCourse]);

  useEffect(() => {
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') void fetchCourse();
    };
    window.addEventListener('focus', refreshWhenVisible);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    return () => {
      window.removeEventListener('focus', refreshWhenVisible);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, [fetchCourse]);

  useEffect(() => {
    if (!visibleModules.length) {
      setExpandedModule('');
      return;
    }

    setExpandedModule((current) => {
      if (current && visibleModules.some((module) => module.id === current)) {
        return current;
      }
      return visibleModules[0].id;
    });
  }, [visibleModules]);

  const course = courseData?.course;

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center gap-3 text-sm text-gray-500" role="status">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600" />
        Loading your course...
      </div>
    );
  }

  if (loadError) {
    return (
      <section className="mx-auto max-w-2xl rounded-2xl border border-rose-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
          <div>
            <h1 className="text-lg font-bold text-navy-500">Course information could not be loaded</h1>
            <p role="alert" className="mt-2 text-sm text-gray-600">{loadError}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button type="button" onClick={() => void fetchCourse()} className="btn-primary inline-flex items-center gap-2 text-sm">
                <RefreshCw className="h-4 w-4" />
                Try again
              </button>
              {needsLogin && <Link to="/login" className="btn-secondary text-sm">Sign in again</Link>}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!course) {
    if (courseData?.accessStatus === 'access-pending') {
      const paymentStatus = courseData.payment?.status || courseData.enrollment?.paymentStatus;
      return (
        <section className="mx-auto max-w-2xl rounded-2xl border border-amber-200 bg-white p-6 text-center shadow-sm sm:p-8">
          <AlertCircle className="mx-auto mb-3 h-8 w-8 text-amber-600" />
          <h1 className="text-xl font-bold text-navy-500">Course access is pending</h1>
          <p className="mt-2 text-sm text-gray-600">
            Course content will be available after payment verification and enrollment activation.
          </p>
          {(paymentStatus || courseData.enrollment?.courseStatus) && (
            <div className="mt-4 flex flex-wrap justify-center gap-2 text-xs">
              {paymentStatus && <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5">Payment: {paymentStatus}</span>}
              {courseData.enrollment?.courseStatus && <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5">Enrollment: {courseData.enrollment.courseStatus}</span>}
            </div>
          )}
          <Link to="/student/payments" className="btn-primary mt-5 inline-flex text-sm">View Payments</Link>
        </section>
      );
    }

    return (
      <section className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
        <BookOpen className="mx-auto mb-3 h-8 w-8 text-primary-500" />
        <h1 className="text-xl font-bold text-navy-500">No course assigned yet</h1>
        <p className="mt-2 text-sm text-gray-500">Choose a GATE course to begin your enrollment.</p>
        <Link to="/student/enroll" className="btn-primary mt-5 inline-flex text-sm">Enroll in a Course</Link>
      </section>
    );
  }

  const subject = course.subject || courseData?.student?.subject;
  const paymentStatus = courseData?.payment?.status;
  const enrollmentStatus = courseData?.enrollment?.courseStatus;
  const enrollmentDate = courseData?.enrollment?.enrollmentDate;

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-navy-500">
            Course Curriculum &amp; Learning Roadmap
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Your assigned GATE course, curriculum progress, and learning resources.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void fetchCourse()}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-navy-500 hover:bg-gray-50"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh course
        </button>
      </div>

      {/* Course Overview Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary-600 bg-primary-50 px-2.5 py-0.5 rounded-full border border-primary-100">
              {[course.exam || courseData?.student?.exam, subject].filter(Boolean).join(' • ')}{subject ? ' Track' : ''}
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-navy-500 mt-1">
              {course.name || course.courseName}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {course.duration && <>Duration: <strong>{course.duration}</strong></>}
              {course.duration && course.startDate && ' • '}
              {course.startDate && <>Starts: <strong>{course.startDate}</strong></>}
              {!course.duration && !course.startDate && enrollmentDate && <>Enrolled: <strong>{enrollmentDate}</strong></>}
            </p>
            {(paymentStatus || enrollmentStatus) && (
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] font-semibold text-gray-700">
                  Payment: {paymentStatus || 'No payment record found'}
                </span>
                {enrollmentStatus && <span className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] font-semibold text-gray-700">Enrollment: {enrollmentStatus}</span>}
              </div>
            )}
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
          {course.description || 'Course curriculum and learning materials assigned to your account.'}
        </p>
        <Link to="/student/materials" className="inline-flex items-center gap-2 text-sm font-bold text-primary-700 hover:text-primary-800">
          Access course materials <ChevronDown className="h-4 w-4 -rotate-90" />
        </Link>
      </div>

      {/* Module Breakdown Accordions */}
      <div className="space-y-4">
        <h3 className="font-bold text-base text-navy-500">Course Curriculum</h3>

        {lessonError && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{lessonError}</p>}
        {modules.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
            The curriculum has not been published for this course yet. Course materials already assigned to you are available in{' '}
            <Link to="/student/materials" className="font-semibold text-primary-700 underline">Study Materials</Link>.
          </div>
        ) : visibleModules.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
            All modules are complete. Your next learning path will appear here when new content is assigned.
          </div>
        ) : visibleModules.map((mod) => {
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
                  {mod.lessons.length > 0 ? (
                    <div className="space-y-2 pt-3">
                      <h5 className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Lessons</h5>
                      {mod.lessons.map((lesson) => (
                        <div key={lesson.id} className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-3">
                          <span className="text-sm font-medium text-navy-500">{lesson.title}</span>
                          <button
                            type="button"
                            disabled={lesson.completed || Boolean(completingLessonId)}
                            onClick={() => void completeLesson(mod.id, lesson.id)}
                            className={`shrink-0 rounded-lg px-3 py-2 text-xs font-bold ${
                              lesson.completed
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-primary-50 text-primary-700 hover:bg-primary-100 disabled:cursor-wait disabled:opacity-60'
                            }`}
                          >
                            {lesson.completed ? 'Completed' : completingLessonId === `${mod.id}:${lesson.id}` ? 'Saving...' : 'Mark complete'}
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : mod.topics.length > 0 ? (
                    <div className="space-y-2 pt-3">
                      <h5 className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Course topics</h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {mod.topics.map((topic, index) => (
                          <div
                            key={`${topic}-${index}`}
                            className="p-2.5 bg-white rounded-xl border border-gray-200 flex items-center gap-2 text-navy-500 font-medium"
                          >
                            <BookOpen className="w-3.5 h-3.5 text-primary-500 shrink-0" />
                            <span>{topic}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="pt-3 text-xs text-gray-500">Lessons have not been added to this module yet.</p>
                  )}
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

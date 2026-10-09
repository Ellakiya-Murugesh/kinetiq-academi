import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, ArrowRight, BookOpen, LoaderCircle } from 'lucide-react';
import { apiRequest } from '../../utils/api';

interface GateCourseOption {
  id: string;
  code: string;
  name: string;
  courseName: string;
  subject: string;
  fee: number;
  duration: string;
}

interface EnrollmentOptions {
  courseId: string;
  title: string;
  exam: string;
  fee: number;
  duration: string;
  subjects: string[];
  courses: GateCourseOption[];
  student: { name: string; id: string };
}

export const StudentEnrollmentPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [options, setOptions] = useState<EnrollmentOptions | null>(null);
  const [subject, setSubject] = useState('Chemistry');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const requestedCourseCode = searchParams.get('course');

  useEffect(() => {
    apiRequest<EnrollmentOptions>('/api/student/enrollment/options')
      .then((data) => {
        setOptions(data);
        const requestedCourse = data.courses.find((course) => course.code === requestedCourseCode);
        setSubject(
          requestedCourse?.subject ??
          (data.subjects.includes(subject) ? subject : data.subjects[0] || ''),
        );
      })
      .catch((requestError) => setError(requestError.message || 'Could not load course options.'))
      .finally(() => setLoading(false));
  }, [requestedCourseCode]);

  const selectedCourse = options?.courses.find((course) => course.subject === subject);

  const startEnrollment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!options || !selectedCourse || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const response = await apiRequest<{ payment: { id: string } }>('/api/student/enrollments', {
        method: 'POST',
        body: JSON.stringify({ courseId: options.courseId, courseCode: selectedCourse.code }),
      });
      navigate(`/student/payment/${encodeURIComponent(response.payment.id)}`);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not start enrollment.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex min-h-64 items-center justify-center gap-3 text-gray-600" role="status"><LoaderCircle className="h-5 w-5 animate-spin" />Loading available courses...</div>;
  }

  return (
    <main className="mx-auto w-full max-w-4xl space-y-6">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-700">Course enrollment</p>
        <h1 className="mt-2 text-2xl font-black text-navy-500 sm:text-3xl">Choose your GATE course</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
          Choose your GATE branch or subject for the 100-Day Online Live Coaching Program. Your enrollment is confirmed after the payment is reviewed by Kinetiq Academi.
        </p>
      </header>

      {error && <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}

      {!options ? (
        <section className="rounded-2xl border border-gray-200 bg-white p-6">
          <p className="text-sm text-gray-700">Course options are temporarily unavailable.</p>
          <Link className="mt-4 inline-flex text-sm font-bold text-primary-700" to="/student/dashboard">Return to dashboard</Link>
        </section>
      ) : (
        <form onSubmit={startEnrollment} className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-2xl border border-amber-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="flex items-start gap-3">
              <span className="rounded-xl bg-amber-50 p-3 text-amber-700"><BookOpen className="h-5 w-5" /></span>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-amber-700">{options.exam} | {selectedCourse?.duration || options.duration}</p>
                <h2 className="mt-1 text-xl font-extrabold text-navy-500">{selectedCourse?.courseName || options.title}</h2>
                <p className="mt-2 text-sm text-gray-600">Live coaching and structured preparation for your selected GATE subject.</p>
              </div>
            </div>
            {requestedCourseCode && selectedCourse ? (
              <p className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-navy-500">
                Selected course: {selectedCourse.courseName} <span className="ml-1 text-xs text-amber-800">({selectedCourse.code})</span>
              </p>
            ) : (
              <fieldset className="mt-7">
                <legend className="mb-3 text-sm font-bold text-navy-500">Choose a course</legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  {options.courses.map((course) => (
                    <label key={course.code} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-colors ${subject === course.subject ? 'border-amber-500 bg-amber-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <input type="radio" name="subject" value={course.subject} checked={subject === course.subject} onChange={() => setSubject(course.subject)} className="h-4 w-4 accent-amber-600" />
                      <span className="text-sm font-bold text-navy-500">{course.courseName} <span className="block text-xs font-medium text-gray-500">{course.code}</span></span>
                    </label>
                  ))}
                </div>
              </fieldset>
            )}
            <p className="mt-6 rounded-xl bg-blue-50 p-4 text-xs leading-5 text-blue-900">
              After continuing, you will receive the academy UPI QR code and payment instructions. Your course access remains pending until an administrator verifies the payment.
            </p>
          </section>

          <aside className="flex flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
            <h2 className="text-base font-extrabold text-navy-500">Enrollment summary</h2>
            <dl className="mt-5 space-y-4 text-sm">
              <div className="flex justify-between gap-3"><dt className="text-gray-500">Student</dt><dd className="text-right font-semibold text-navy-500">{options.student.name}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-gray-500">Registration ID</dt><dd className="text-right font-semibold text-navy-500">{options.student.id}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-gray-500">Course</dt><dd className="text-right font-semibold text-navy-500">{selectedCourse?.courseName || `GATE ${subject}`}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-gray-500">Course code</dt><dd className="text-right font-semibold text-navy-500">{selectedCourse?.code || '—'}</dd></div>
              <div className="border-t border-gray-100 pt-4 flex justify-between gap-3"><dt className="font-bold text-gray-700">Course fee</dt><dd className="text-lg font-black text-navy-500">₹{(selectedCourse?.fee ?? options.fee).toLocaleString('en-IN')}</dd></div>
            </dl>
            <button disabled={submitting || !subject} className="btn-primary mt-7 inline-flex w-full items-center justify-center gap-2 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60">
              {submitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              {submitting ? 'Submitting enrollment...' : 'Submit Enrollment'}
            </button>
            <p className="mt-3 text-center text-xs text-gray-500">No course fee is charged online. Pay directly using the QR code.</p>
            <Link to="/student/dashboard" className="mt-4 text-center text-xs font-bold text-primary-700 hover:underline">Back to dashboard</Link>
          </aside>
        </form>
      )}
    </main>
  );
};

export default StudentEnrollmentPage;

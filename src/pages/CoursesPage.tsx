import React from 'react';
import { SEO } from '../components/ui/SEO';
import { courses } from '../data/courses';
import { CourseCard } from '../components/ui/CourseCard';
import { CountdownTimer } from '../components/ui/CountdownTimer';
import { Sparkles, Calendar, BookOpen, Clock, ShieldCheck, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const CoursesPage: React.FC = () => {
  const mainCourse = courses[0];

  return (
    <>
      <SEO
        title="100-Day Online Live Coaching Program — Chemistry & Physics"
        description="Explore Kinetiq Academi’s 100-day online GATE coaching program in Chemistry and Physics, with live classes, structured study resources, previous-year questions, mock tests and guided revision."
        structuredData={{
          '@type': 'Course',
          '@id': 'https://www.kinetiqacademy.in/courses#gate-course',
          name: '100-Day Online Live Coaching Program for GATE Chemistry and Physics',
          description: 'A structured 100-day online live coaching program in Chemistry and Physics with concept classes, study resources, previous-year questions, tests and revision.',
          provider: { '@id': 'https://www.kinetiqacademy.in/#organization' },
          hasCourseInstance: {
            '@type': 'CourseInstance',
            courseMode: 'online',
            courseWorkload: 'P100D',
          },
        }}
      />

      {/* Top Banner with Countdown */}
      <section className="bg-gradient-to-b from-primary-50/70 via-white to-white py-14 sm:py-20 border-b border-gray-100">
        <div className="container-max">
          <div className="max-w-4xl mx-auto text-center space-y-4 mb-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-50 text-primary-600 text-xs sm:text-sm font-bold border border-primary-200">
              <Sparkles className="w-4 h-4 text-primary-500 animate-spin-slow" />
              <span>Flagship 100-Day Intensive Cohort</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-black text-navy-500 tracking-tight">
              100-Day Online Live Coaching Program
            </h1>

            <p className="text-base sm:text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto">
              Our structured, fast-paced curriculum designed to cover complete exam syllabi for GATE, UGC NET, and CSIR NET in Chemistry and Physics.
            </p>
          </div>

          {/* Countdown Card */}
          <div className="max-w-2xl mx-auto">
            <CountdownTimer variant="card" />
          </div>
        </div>
      </section>

      {/* Course Detail Card Section */}
      <section className="section-padding bg-gray-50/60 border-b border-gray-100">
        <div className="container-max max-w-5xl">
          <CourseCard course={mainCourse} />
        </div>
      </section>

      {/* Deep-Dive into Weekly Methodology */}
      <section className="section-padding bg-white">
        <div className="container-max max-w-5xl">
          <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
            <h2 className="section-heading">
              How Your 100 Days Unfold
            </h2>
            <p className="section-subheading mx-auto">
              Consistent, disciplined pace with built-in rest, revision and self-study cycles.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card p-6 border-l-4 border-l-primary-500 space-y-3">
              <span className="text-xs font-black uppercase tracking-wider text-primary-600">
                Phase 1 (Days 1–50)
              </span>
              <h3 className="text-lg font-bold text-navy-500">
                Theoretical Foundations &amp; Derivations
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Core concept building, operator algebra in Chemistry, tensor calculus in Physics, and thorough textbook syllabus assimilation.
              </p>
            </div>

            <div className="card p-6 border-l-4 border-l-emerald-500 space-y-3">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-600">
                Phase 2 (Days 51–80)
              </span>
              <h3 className="text-lg font-bold text-navy-500">
                PYQs &amp; NAT Numerical Workshops
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Last 10-year question breakdown, rapid speed tricks, multi-concept synthesis, and error analysis logs.
              </p>
            </div>

            <div className="card p-6 border-l-4 border-l-violet-500 space-y-3">
              <span className="text-xs font-black uppercase tracking-wider text-violet-600">
                Phase 3 (Days 81–100)
              </span>
              <h3 className="text-lg font-bold text-navy-500">
                Full Simulation Mock Series
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Timed 3-hour computer-based exam rehearsals, formula sheet memorization drills, and stress management coaching.
              </p>
            </div>
          </div>

          {/* Bottom CTA Banner */}
          <div className="mt-12 p-8 rounded-3xl bg-navy-900 text-white text-center space-y-4 shadow-xl">
            <h3 className="text-2xl font-bold">
              Ready to Commit to Your 100-Day Transformation?
            </h3>
            <p className="text-sm text-gray-400 max-w-xl mx-auto">
              Seats are filled on a first-come, first-served basis. Secure your spot in the upcoming cohort today.
            </p>
            <div className="pt-2">
              <Link to="/payment" className="btn-primary px-8 py-3.5 text-sm font-bold shadow-lg">
                Enroll Now — ₹10,000
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default CoursesPage;

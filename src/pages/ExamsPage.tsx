import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { SEO } from '../components/ui/SEO';
import { exams } from '../data/exams';
import {
  GraduationCap,
  BookOpen,
  Atom,
  CheckCircle2,
  ChevronDown,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  FileText,
  Clock,
  Briefcase
} from 'lucide-react';

export const ExamsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'gate';
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [activeSubject, setActiveSubject] = useState<'Chemistry' | 'Physics'>('Chemistry');

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['gate'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };

  const currentExam = exams.find((e) => e.id === activeTab) || exams[0];

  return (
    <>
      <SEO
        title={`${currentExam.name} Exam Syllabus, Pattern & Strategy`}
        description={`Explore comprehensive syllabus breakdown, exam pattern, preparation strategy and career pathways for ${currentExam.name} in Chemistry and Physics.`}
      />

      {/* Header Banner */}
      <section className="bg-gradient-to-b from-primary-50/60 to-white py-14 sm:py-20 border-b border-gray-100">
        <div className="container-max text-center max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 text-primary-600 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Curriculum &amp; Exam Intelligence</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-black text-navy-500">
            Exam Overview &amp; Strategy
          </h1>

          <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
            Detailed syllabus blueprints, topic weightage, exam patterns, and academic pathways for GATE preparation across key science and engineering branches.
          </p>

          <div className="flex items-center justify-center gap-2 sm:gap-4 pt-6 flex-wrap">
            <button
              type="button"
              onClick={() => handleTabChange('gate')}
              className="px-5 py-3 rounded-2xl font-bold text-sm sm:text-base transition-all duration-200 flex items-center gap-2 bg-primary-500 text-white shadow-lg shadow-primary-500/30 scale-105"
            >
              <span>GATE</span>
            </button>
          </div>
        </div>
      </section>

      {/* Main Tab Content Area */}
      <section className="section-padding bg-white">
        <div className="container-max">
          {/* Exam Overview Summary Card */}
          <div className="card p-6 sm:p-8 mb-10 bg-gradient-to-br from-white to-gray-50/80 border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <span className="text-xs font-extrabold uppercase tracking-widest text-primary-600">
                  Target Examination Track
                </span>
                <h2 className="text-3xl font-black text-navy-500">
                  {currentExam.fullName} ({currentExam.name})
                </h2>
                <p className="text-gray-600 text-sm max-w-2xl">
                  {currentExam.description}
                </p>
              </div>

              {/* Subject Selector Switcher */}
              <div className="flex items-center gap-2 p-1.5 bg-gray-200/70 rounded-2xl self-start md:self-auto">
                <button
                  type="button"
                  onClick={() => setActiveSubject('Chemistry')}
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
                    activeSubject === 'Chemistry'
                      ? 'bg-white text-navy-500 shadow-md'
                      : 'text-gray-600 hover:text-navy-500'
                  }`}
                >
                  Chemistry Section
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSubject('Physics')}
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
                    activeSubject === 'Physics'
                      ? 'bg-white text-navy-500 shadow-md'
                      : 'text-gray-600 hover:text-navy-500'
                  }`}
                >
                  Physics Section
                </button>
              </div>
            </div>
          </div>

          {/* Grid: Left Column (Syllabus & Core Topics) + Right Column (Pattern, Strategy & Opportunities) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Syllabus & Core Topics */}
            <div className="lg:col-span-7 space-y-6">
              {/* Core Topics Checklist */}
              <div className="card p-6 sm:p-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-navy-500 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary-500" />
                    <span>{currentExam.name} {activeSubject}: Core Topics</span>
                  </h3>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary-50 text-primary-600">
                    Comprehensive
                  </span>
                </div>

                <p className="text-xs text-gray-500 mb-6">
                  Key high-weightage modules prioritized in our 100-day structured live lecture schedule:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(activeSubject === 'Chemistry'
                    ? currentExam.chemistryTopics
                    : currentExam.physicsTopics
                  ).map((topic, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex items-start gap-2.5 text-xs sm:text-sm text-navy-500"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="font-medium">{topic}</span>
                    </div>
                  ))}
                </div>

                {/* Syllabus Disclaimer Tag */}
                <div className="mt-6 p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    <strong>Official Notice:</strong> [VERIFY WITH LATEST OFFICIAL NOTIFICATION] Always cross-check candidate brochure issued by organizing bodies for minor syllabus revisions.
                  </span>
                </div>
              </div>

              {/* Preparation Strategy Box */}
              <div className="card p-6 sm:p-8 space-y-4">
                <h3 className="text-xl font-bold text-navy-500 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary-500" />
                  <span>100-Day Recommended Preparation Strategy</span>
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {currentExam.prepStrategy}
                </p>
                <div className="p-4 rounded-xl bg-primary-50/60 border border-primary-100 space-y-2">
                  <p className="text-xs font-bold text-primary-700">
                    Structured 3-Phase Strategy:
                  </p>
                  <ul className="text-xs text-gray-700 space-y-1 list-disc list-inside">
                    <li><strong>Days 1–60:</strong> Core conceptual modules, formula derivation, and primary notes.</li>
                    <li><strong>Days 61–85:</strong> Problem-solving workshops, speed techniques, and past 10 years PYQs.</li>
                    <li><strong>Days 86–100:</strong> High-pressure mock tests, computer-based simulation, and error review.</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Right Column: Pattern, Opportunities & CTA */}
            <div className="lg:col-span-5 space-y-6">
              {/* Exam Pattern Box */}
              <div className="card p-6 sm:p-8 space-y-3">
                <h3 className="text-xl font-bold text-navy-500 flex items-center gap-2">
                  <Atom className="w-5 h-5 text-primary-500" />
                  <span>Exam Pattern Overview</span>
                </h3>
                <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-700 leading-relaxed font-mono">
                  {currentExam.examPattern}
                </div>
                <p className="text-[11px] text-gray-400 italic">
                  Exam structure, marking scheme, and sectional time limits are subject to official notifications.
                </p>
              </div>

              {/* Career & Research Opportunities */}
              <div className="card p-6 sm:p-8 space-y-4">
                <h3 className="text-xl font-bold text-navy-500 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-primary-500" />
                  <span>Career &amp; Research Pathways</span>
                </h3>
                <div className="space-y-2.5">
                  {currentExam.careerOpportunities.map((opp, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-gray-700">
                      <div className="w-2 h-2 rounded-full bg-primary-500 shrink-0 mt-1.5" />
                      <span>{opp}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Enroll Box for this exam */}
              <div className="card p-6 sm:p-8 bg-gradient-to-br from-primary-500 to-primary-600 text-white space-y-4 shadow-xl">
                <span className="text-xs uppercase font-extrabold tracking-widest text-primary-100">
                  Ready to Start?
                </span>
                <h4 className="text-2xl font-black text-white">
                  Join the 100-Day {currentExam.name} ({activeSubject}) Batch
                </h4>
                <p className="text-xs text-primary-100 leading-relaxed">
                  Get full syllabus coverage, weekly mock exams, and focused guidance for your exam preparation.
                </p>
                <div className="pt-2">
                  <Link
                    to="/payment"
                    className="w-full btn-white py-3 text-sm font-bold flex items-center justify-center gap-2"
                  >
                    <span>Enroll Now — ₹10,000</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default ExamsPage;

import React from 'react';
import { SEO } from '../components/ui/SEO';
import { faculty } from '../data/faculty';
import { FacultyCard } from '../components/ui/FacultyCard';
import { BRAND_NAME } from '../config/brand';
import {
  Target,
  Compass,
  Sparkles,
  BookOpen,
  Users,
  Video,
  CheckCircle2,
  HelpCircle,
  FolderDown,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const AboutPage: React.FC = () => {
  const whyLearnPoints = [
    {
      title: 'Structured Preparation',
      desc: 'Day-by-day roadmap covering high-yield concepts, syllabus milestones, and structured revision.',
      icon: Target,
    },
    {
      title: 'Expert Guidance',
      desc: 'Mentorship led by experienced faculty with strong academic achievements in Chemistry and Physics.',
      icon: Users,
    },
    {
      title: 'Live Learning',
      desc: 'Interactive two-way live sessions with real-time concept questions and classroom interaction.',
      icon: Video,
    },
    {
      title: 'Practice & Testing',
      desc: 'Weekly unit tests and computer-based mock examinations replicating national exam environments.',
      icon: CheckCircle2,
    },
    {
      title: 'Doubt Support',
      desc: 'Dedicated doubt resolution sessions so no conceptual obstacle goes unresolved before exam day.',
      icon: HelpCircle,
    },
    {
      title: 'Study Resources',
      desc: 'Curated PDF lecture notes, formula reference sheets, and categorized previous-year question banks.',
      icon: FolderDown,
    },
  ];

  return (
    <>
      <SEO
        title="About Us — Mission, Vision & Faculty"
        description={`Learn about ${BRAND_NAME}, our mission to empower competitive exam aspirants in Chemistry and Physics, and meet our academic mentors.`}
      />

      {/* Hero Header */}
      <section className="bg-gradient-to-b from-primary-50/60 to-white py-16 md:py-24 border-b border-gray-100">
        <div className="container-max text-center max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 text-primary-600 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Academic Excellence &amp; Transparency</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-navy-500">
            About {BRAND_NAME}
          </h1>
          <p className="text-lg text-gray-600 leading-relaxed">
            Empowering students across India to prepare strategically for GATE in Chemistry, Physics, Mechanical Engineering, Computer Science Engineering, and Electronics and Communication Engineering (ECE).
          </p>
        </div>
      </section>

      {/* Mission & Vision Section */}
      <section className="section-padding bg-white border-b border-gray-100">
        <div className="container-max">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            {/* Mission Box */}
            <div className="card p-8 sm:p-10 border-primary-100 bg-gradient-to-br from-white to-primary-50/30 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-primary-500 text-white flex items-center justify-center shadow-lg shadow-primary-500/25">
                <Target className="w-7 h-7" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-navy-500">
                Our Mission
              </h2>
              <blockquote className="text-gray-700 text-base sm:text-lg leading-relaxed italic border-l-4 border-primary-500 pl-4">
                &ldquo;To make high-quality competitive-exam preparation structured, accessible and outcome-focused for students pursuing academic and research careers.&rdquo;
              </blockquote>
              <p className="text-xs text-gray-500 leading-relaxed pt-2">
                We believe in demystifying high-level science competitive examinations through disciplined conceptual clarity rather than rote memorization.
              </p>
            </div>

            {/* Vision Box */}
            <div className="card p-8 sm:p-10 border-emerald-100 bg-gradient-to-br from-white to-emerald-50/30 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/25">
                <Compass className="w-7 h-7" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-navy-500">
                Our Vision
              </h2>
              <blockquote className="text-gray-700 text-base sm:text-lg leading-relaxed italic border-l-4 border-emerald-500 pl-4">
                &ldquo;To help students build strong fundamentals, develop problem-solving ability and confidently pursue their academic goals.&rdquo;
              </blockquote>
              <p className="text-xs text-gray-500 leading-relaxed pt-2">
                Nurturing a community of capable research scholars, university educators, and scientific innovators for Indian premier research institutions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Learn With Us? */}
      <section className="section-padding bg-gray-50/70 border-b border-gray-100">
        <div className="container-max">
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 text-primary-600 text-xs font-bold uppercase tracking-wider">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Core Strengths</span>
            </div>
            <h2 className="section-heading">
              Why Learn With Us?
            </h2>
            <p className="section-subheading mx-auto">
              Our 6-pillar educational blueprint designed to maximize score trajectory during the 100-day preparation window.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {whyLearnPoints.map((point, idx) => {
              const Icon = point.icon;
              return (
                <div key={idx} className="card p-6 sm:p-8 space-y-3 hover:border-primary-300">
                  <div className="w-12 h-12 rounded-2xl bg-primary-50 text-primary-500 flex items-center justify-center shadow-sm">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-navy-500">
                    {point.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                    {point.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Faculty / Team Section */}
      <section className="section-padding bg-white border-b border-gray-100">
        <div className="container-max">
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 text-primary-600 text-xs font-bold uppercase tracking-wider">
              <Users className="w-3.5 h-3.5" />
              <span>Academic Faculty &amp; Mentors</span>
            </div>
            <h2 className="section-heading">
              Learn From Experienced Mentors
            </h2>
            <p className="section-subheading mx-auto">
              Classes conducted by subject specialists in Chemistry and Physics. Placeholders below preserve academic verification standards.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {faculty.map((member) => (
              <FacultyCard key={member.id} member={member} />
            ))}
          </div>

          {/* Ethics note */}
          <div className="mt-12 p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 max-w-2xl mx-auto flex items-start gap-3 text-xs text-amber-900">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p>
              <strong>Academic Integrity Policy:</strong> {BRAND_NAME} strictly refrains from publishing unverified faculty rankings or unverified institutional claims. All mentor bios are updated following formal academic credentials auditing.
            </p>
          </div>

          {/* CTA Box */}
          <div className="mt-16 text-center">
            <Link to="/payment" className="btn-primary px-8 py-3.5 text-sm font-bold shadow-lg">
              Start Learning With Our Faculty
            </Link>
          </div>
        </div>
      </section>
    </>
  );
};

export default AboutPage;

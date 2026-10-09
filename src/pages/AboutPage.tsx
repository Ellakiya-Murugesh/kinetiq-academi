import React from 'react';
import { SEO } from '../components/ui/SEO';
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
            Empowering students across India to prepare strategically for GATE, UGC NET, and CSIR NET in Chemistry and Physics.
          </p>
        </div>
      </section>

      {/* Story / Philosophy Section */}
      <section className="section-padding bg-white border-b border-gray-100">
        <div className="container-max">
          <div className="card p-8 sm:p-10 lg:p-12 border-primary-100 bg-gradient-to-br from-white to-primary-50/30">
            <div className="max-w-4xl mx-auto space-y-8">
              <div className="text-center space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 text-primary-600 text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Learn from Achievers</span>
                </div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-navy-500 leading-tight">
                  Learn from Achievers. Prepare with Purpose. Build Your Future.
                </h2>
              </div>

              <div className="space-y-5 text-gray-700 text-base sm:text-lg leading-relaxed">
                <p>
                  We are a learning and mentorship platform created to help ambitious students transform their academic goals into meaningful career opportunities.
                </p>
                <p>
                  Our classes are led by <strong className="text-navy-500">GATE-qualified professionals, top rank holders, researchers, and experienced mentors</strong> who bring strong academic knowledge along with practical insights from their own journeys. We focus not only on helping students prepare for competitive examinations, but also on building the clarity, confidence, and technical foundation required for long-term success.
                </p>
                <p>
                  Our approach goes beyond conventional classroom teaching. Along with <strong className="text-navy-500">GATE and competitive examination preparation</strong>, we provide personalized guidance for students planning their next academic or research journey, including <strong className="text-navy-500">M.Tech, MS, PhD, research positions, fellowships, internships, and opportunities in leading institutions and research organizations</strong>.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="space-y-3">
                  <h3 className="text-xl font-black text-navy-500">What We Offer</h3>
                  <ul className="space-y-3 text-sm sm:text-base text-gray-700">
                    <li className="flex gap-3"><CheckCircle2 className="w-5 h-5 text-primary-500 shrink-0 mt-0.5" /><span><strong className="text-navy-500">GATE &amp; Competitive Exam Preparation</strong> – Concept-focused classes, problem-solving strategies, previous-year question analysis, and exam-oriented preparation.</span></li>
                    <li className="flex gap-3"><CheckCircle2 className="w-5 h-5 text-primary-500 shrink-0 mt-0.5" /><span><strong className="text-navy-500">Expert-Led Learning</strong> – Learn directly from GATE-qualified members, top rank holders, researchers, and subject experts.</span></li>
                    <li className="flex gap-3"><CheckCircle2 className="w-5 h-5 text-primary-500 shrink-0 mt-0.5" /><span><strong className="text-navy-500">Higher Studies Guidance</strong> – Guidance for selecting suitable M.Tech, MS, and PhD programs based on your interests and career goals.</span></li>
                    <li className="flex gap-3"><CheckCircle2 className="w-5 h-5 text-primary-500 shrink-0 mt-0.5" /><span><strong className="text-navy-500">PhD &amp; Research Guidance</strong> – Support with research direction, identifying research areas, approaching potential supervisors, research proposals, and academic opportunities.</span></li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xl font-black text-navy-500">What We Offer</h3>
                  <ul className="space-y-3 text-sm sm:text-base text-gray-700">
                    <li className="flex gap-3"><CheckCircle2 className="w-5 h-5 text-primary-500 shrink-0 mt-0.5" /><span><strong className="text-navy-500">Research Career Guidance</strong> – Insights into research positions, fellowships, internships, laboratories, universities, and R&amp;D career pathways.</span></li>
                    <li className="flex gap-3"><CheckCircle2 className="w-5 h-5 text-primary-500 shrink-0 mt-0.5" /><span><strong className="text-navy-500">Application &amp; Profile Guidance</strong> – Assistance in building a strong academic profile, preparing CVs, statements of purpose, research proposals, and applications.</span></li>
                    <li className="flex gap-3"><CheckCircle2 className="w-5 h-5 text-primary-500 shrink-0 mt-0.5" /><span><strong className="text-navy-500">Personal Mentorship</strong> – Practical guidance from people who have experienced the academic and competitive journey themselves.</span></li>
                  </ul>
                </div>
              </div>

              <div className="space-y-4 border-t border-gray-200 pt-6">
                <h3 className="text-xl font-black text-navy-500">Our Philosophy</h3>
                <p className="text-gray-700 text-base sm:text-lg leading-relaxed">
                  We believe that <strong className="text-navy-500">the right guidance at the right stage can change a student's entire career trajectory</strong>.
                </p>
                <p className="text-gray-700 text-base sm:text-lg leading-relaxed">
                  Instead of simply teaching what to study, we help students understand <strong className="text-navy-500">why they are studying it, where it can take them, and how to plan the next step</strong>.
                </p>
                <p className="text-gray-700 text-base sm:text-lg leading-relaxed">
                  Whether your goal is to <strong className="text-navy-500">clear GATE, secure a top rank, pursue an MS or PhD abroad, enter a research laboratory, obtain a fellowship, or build a career in R&amp;D</strong>, our aim is to provide the knowledge, mentorship, and direction needed to move forward with confidence.
                </p>
              </div>

              <div className="border-t border-gray-200 pt-6 space-y-4">
                <h3 className="text-xl font-black text-navy-500">Our Vision</h3>
                <p className="text-xl sm:text-2xl font-bold text-primary-600 leading-relaxed">
                  To build a community where knowledge is shared by achievers, guidance is accessible to every aspiring student, and academic ambition is transformed into real-world opportunity.
                </p>
                <p className="text-lg font-bold text-navy-500 tracking-wide">
                  Learn. Prepare. Research. Achieve.
                </p>
              </div>
            </div>
          </div>
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

      {/* CTA Box */}
      <section className="section-padding bg-white border-b border-gray-100">
        <div className="container-max text-center">
          <Link to="/payment" className="btn-primary px-8 py-3.5 text-sm font-bold shadow-lg">
            Start Learning With Our Faculty
          </Link>
        </div>
      </section>
    </>
  );
};

export default AboutPage;

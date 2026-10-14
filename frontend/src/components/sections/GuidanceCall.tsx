import React from 'react';
import { ContactForm } from '../ui/ContactForm';
import { PhoneCall, CheckCircle, Headphones, Compass, ShieldAlert } from 'lucide-react';

export const GuidanceCall: React.FC = () => {
  return (
    <section id="guidance" className="section-padding bg-gray-50/80 border-b border-gray-100">
      <div className="container-max">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Guidance Value Proposition */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 text-primary-600 text-xs font-bold uppercase tracking-wider">
              <Headphones className="w-3.5 h-3.5" />
              <span>One-on-One Mentorship Session</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-navy-500 leading-tight">
              Book a Guidance Call <span className="text-primary-500">with an Expert</span>
            </h2>

            <p className="text-gray-600 text-base sm:text-lg leading-relaxed">
              Not sure which exam or preparation strategy is right for you? Speak with our academic team to analyze your target milestones and syllabus readiness.
            </p>

            {/* Benefits Bullets */}
            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-white border border-gray-100 shadow-sm">
                <div className="w-8 h-8 rounded-xl bg-primary-50 text-primary-500 flex items-center justify-center shrink-0 mt-0.5">
                  <Compass className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-navy-500">
                    Understand How to Approach Your Target Exam
                  </h4>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Evaluate syllabus weightage, high-frequency question patterns, and realistic preparation timelines.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-white border border-gray-100 shadow-sm">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-navy-500">
                    Explore Available Payment Options
                  </h4>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Get full clarity on course fees, installment structures, and enrollment requirements.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-white border border-gray-100 shadow-sm">
                <div className="w-8 h-8 rounded-xl bg-violet-50 text-violet-500 flex items-center justify-center shrink-0 mt-0.5">
                  <PhoneCall className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-navy-500">
                    Learn About Our Teaching Methodology
                  </h4>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Experience our 5+1 weekly structure, live doubt clearing forums, and full syllabus test review workflows.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-primary-50/50 border border-primary-100 text-xs text-primary-800">
              ⚡ <strong>15-Minute Free Consultation:</strong> Our mentors provide personalized academic guidance without aggressive sales pitches.
            </div>
          </div>

          {/* Right Column: Embedded Guidance Form */}
          <div className="lg:col-span-6">
            <ContactForm mode="guidance" />
          </div>
        </div>
      </div>
    </section>
  );
};

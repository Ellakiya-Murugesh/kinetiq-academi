import React from 'react';
import {
  GraduationCap,
  Sparkles,
  Building,
  Briefcase,
  Compass,
  FlaskConical,
} from 'lucide-react';

export const WhyPrepare: React.FC = () => {
  const opportunities = [
    {
      title: 'M.Tech & ME Admissions',
      desc: 'Use your GATE performance as one of the key eligibility criteria for postgraduate admissions in engineering and science programs.',
      icon: GraduationCap,
    },
    {
      title: 'Research Pathways',
      desc: 'Build a foundation for research opportunities, laboratory work, and advanced study across science and engineering domains.',
      icon: FlaskConical,
    },
    {
      title: 'PhD Admissions',
      desc: 'Explore postgraduate and doctoral opportunities in IITs, NITs, IISc, and other universities subject to institutional eligibility and selection procedures.',
      icon: Building,
    },
    {
      title: 'Career Opportunities',
      desc: 'A strong GATE profile can support postgraduate study, research roles, and public-sector career pathways depending on your target domain and performance.',
      icon: Briefcase,
    },
    {
      title: 'Expert Guidance',
      desc: 'Get structured guidance on preparation strategy, subject prioritization, and academic planning for your GATE journey.',
      icon: Compass,
    },
  ];

  return (
    <section className="section-padding bg-white border-b border-gray-100">
      <div className="container-max">
        <div className="grid grid-cols-1 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 text-primary-600 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Gateway to Indian Academia</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-navy-500 leading-tight">
              More Than an Exam —{' '}
              <span className="text-primary-500">It&apos;s a Career Opportunity</span>
            </h2>

            <p className="text-gray-600 text-base sm:text-lg leading-relaxed">
              A strong GATE score can open pathways for postgraduate study, research exposure, and career development across science and engineering fields. Your preparation outcomes depend on your performance, institutional requirements, and the eligibility criteria of each programme or role.
            </p>

            {/* Structured Opportunities List */}
            <div className="space-y-4 pt-2">
              {opportunities.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div
                    key={idx}
                    className="p-4 sm:p-5 rounded-2xl bg-gray-50 border border-gray-100 hover:border-primary-200 hover:bg-primary-50/20 transition-all flex items-start gap-4"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white shadow-sm border border-gray-200 flex items-center justify-center text-primary-500 shrink-0 mt-0.5">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-navy-500 mb-1">
                        {item.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="text-[11px] text-gray-400 italic pt-2">
              * Note: Qualifying examinations provide eligibility for application; final selections and admissions are strictly governed by respective institution admission policies and interviews.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

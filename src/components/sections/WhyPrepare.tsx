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
      title: 'Direct PhD Opportunities',
      desc: 'Explore PhD opportunities after qualifying relevant examinations and meeting institutional eligibility requirements.',
      icon: GraduationCap,
    },
    {
      title: 'JRF & Research Opportunities',
      desc: 'Access research-oriented opportunities and fellowships where applicable across CSIR and UGC sponsored projects.',
      icon: FlaskConical,
    },
    {
      title: 'PhD Admissions',
      desc: 'Explore opportunities across IITs, NITs, IISc, and other universities, subject to their eligibility and admission requirements.',
      icon: Building,
    },
    {
      title: 'Career Opportunities',
      desc: 'GATE can support different academic, research and career pathways depending on the qualification.',
      icon: Briefcase,
    },
    {
      title: 'Expert Guidance',
      desc: 'Get structured guidance on preparation, applications, interview rounds, and academic pathways.',
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
              Cracking these examinations is not merely an academic milestone. It forms the benchmark eligibility credential for leading scientific research institutions, university professorships, and government research fellowships across India.
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

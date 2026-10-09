import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';

interface CTASectionProps {
  headline?: string;
  supportingText?: string;
  buttonText?: string;
  buttonLink?: string;
}

export const CTASection: React.FC<CTASectionProps> = ({
  headline = 'Grab Your GATE Score. Move Closer to Your PhD Goal.',
  supportingText = 'Prepare strategically and explore PhD opportunities at leading institutions.',
  buttonText = 'Start Your Preparation',
  buttonLink = '/payment',
}) => {
  return (
    <section className="relative overflow-hidden bg-primary-500 text-white py-16 md:py-20">
      {/* Background Graphic Glows */}
      <div className="absolute inset-0 pointer-events-none -z-0">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-navy-900/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 text-white text-xs sm:text-sm font-semibold backdrop-blur-md border border-white/20">
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>Next Batch Starts November 1 • Intensive Coaching</span>
        </div>

        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white max-w-3xl mx-auto leading-tight">
          {headline}
        </h2>

        <p className="text-base sm:text-lg text-primary-100 max-w-2xl mx-auto font-normal leading-relaxed">
          {supportingText}
        </p>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to={buttonLink}
            className="w-full sm:w-auto btn-white text-base font-bold px-8 py-4 shadow-xl flex items-center justify-center gap-2 group"
          >
            <span>{buttonText}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>

          <a
            href="#guidance"
            className="w-full sm:w-auto px-6 py-4 rounded-xl border border-white/40 hover:bg-white/10 text-white font-semibold text-sm transition-colors text-center"
          >
            Request Syllabus Consultation
          </a>
        </div>

        <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-primary-100 font-medium">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-white" />
            Live interactive sessions
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-white" />
            Zero fake claims guarantee
          </span>
        </div>
      </div>
    </section>
  );
};

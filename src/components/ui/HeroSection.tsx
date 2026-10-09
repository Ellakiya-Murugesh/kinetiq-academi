import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Calendar,
  CheckCircle,
} from 'lucide-react';

export const HeroSection: React.FC = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-primary-50/50 via-white to-white py-14 sm:py-20 lg:py-28 border-b border-gray-100">
      {/* Background Decorative Blobs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-primary-100/60 blur-3xl" />
        <div className="absolute top-1/2 -right-24 w-96 h-96 rounded-full bg-blue-100/40 blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-4xl grid-cols-1 items-center gap-12 lg:gap-8">
          <div className="space-y-6 text-center lg:text-left">
            {/* Batch Open Tag */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-50 border border-primary-200/80 text-primary-600 text-xs sm:text-sm font-bold shadow-sm">
              <Sparkles className="w-4 h-4 text-primary-500 animate-spin-slow" />
              <span>Next Batch Starts November 1 • Limited Seats Available</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-navy-500 tracking-tight leading-[1.15]">
              Prepare for GATE with{' '}
              <span className="text-primary-500 underline decoration-primary-200 decoration-wavy decoration-2">
                Confidence
              </span>
            </h1>

            {/* Supporting Text */}
            <p className="text-lg sm:text-xl text-gray-600 font-normal leading-relaxed max-w-2xl mx-auto lg:mx-0">
              Build your concepts, practice with confidence, and prepare strategically for competitive exams in{' '}
              <strong className="text-navy-500 font-semibold">Chemistry</strong> and{' '}
              <strong className="text-navy-500 font-semibold">Physics</strong> with expert-led online coaching.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <Link
                to="/payment"
                className="w-full sm:w-auto btn-primary px-8 py-4 text-base font-bold shadow-lg shadow-primary-500/30 flex items-center justify-center gap-2"
              >
                <span>Enroll Now</span>
              </Link>

              <a
                href="#guidance"
                className="w-full sm:w-auto btn-secondary px-7 py-4 text-base font-bold flex items-center justify-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                <span>Book a Guidance Call</span>
              </a>
            </div>

            {/* Trust Points */}
            <div className="pt-6 grid grid-cols-2 gap-3 border-t border-gray-100 max-w-lg mx-auto lg:mx-0 text-left">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="text-xs font-semibold text-gray-600">Daily Live Classes</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="text-xs font-semibold text-gray-600">Weekly Unit Tests</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

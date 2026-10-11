import React from 'react';
import { SEO } from '../components/ui/SEO';
import { PaymentCard } from '../components/ui/PaymentCard';
import { ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CONTACT_EMAIL, CONTACT_EMAIL_HREF } from '../config/brand';

export const PaymentPage: React.FC = () => {
  return (
    <>
      <SEO
        title="Enrollment & Fee Payment — GATE Coaching Program"
        description="Enroll in the 100-Day GATE Coaching Program for ₹10,000."
      />

      {/* Header */}
      <section className="bg-gradient-to-b from-primary-50/60 to-white py-14 sm:py-20 border-b border-gray-100">
        <div className="container-max text-center max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Secure Official Admissions Gateway</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-black text-navy-500">
            Enroll in the 100-Day Program
          </h1>

          <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
            Transparent one-time fee of ₹10,000 covering live lectures, study materials, and tests.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-6 pt-2 text-xs text-gray-500 font-semibold">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Direct Batch Onboarding
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Instant Portal Access
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Zero Hidden Charges
            </span>
          </div>
        </div>
      </section>

      {/* Main Payment Section */}
      <section className="section-padding bg-white">
        <div className="container-max max-w-5xl">
          <PaymentCard />
        </div>
      </section>

      {/* Bottom Assurance Bar */}
      <section className="py-12 bg-gray-50 border-t border-gray-200">
        <div className="container-max max-w-4xl text-center space-y-3">
          <h4 className="text-lg font-bold text-navy-500">
            Need Institutional Invoice or Fee Clarification?
          </h4>
          <p className="text-xs sm:text-sm text-gray-600">
            Contact our billing team at{' '}
            <a href={CONTACT_EMAIL_HREF} className="font-semibold text-navy-500 hover:text-primary-600">
              {CONTACT_EMAIL}
            </a>{' '}
            or call{' '}
            <a href="tel:+919629302414" className="font-semibold text-navy-500 hover:text-primary-600">
              +91 96293 02414
            </a>{' '}
            for assistance.
          </p>
          <div className="pt-2">
            <Link to="/contact" className="btn-secondary text-xs px-5 py-2">
              Speak to Admissions Officer
            </Link>
          </div>
        </div>
      </section>
    </>
  );
};

export default PaymentPage;

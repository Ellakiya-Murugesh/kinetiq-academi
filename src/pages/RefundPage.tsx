import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { SEO } from '../components/ui/SEO';

const RefundPage: React.FC = () => {
  return (
    <>
      <SEO
        title="Refund Policy"
        description="Refund information and terms for the GATE preparation program."
      />
      <section className="section-padding bg-white">
        <div className="container-max max-w-3xl">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary-600">
              <ShieldCheck className="h-3.5 w-3.5" />
              Refund Information
            </div>
            <h1 className="mt-4 text-3xl font-black text-navy-500">Refund Policy</h1>
          </div>

          <div className="space-y-5 text-sm leading-relaxed text-gray-700">
            <p>Refunds are considered only in accordance with the terms shared during enrollment and any applicable batch-specific policy communicated by the academy.</p>
            <p>Students may contact the admissions team for clarifications regarding fee adjustment, batch transfer, or enrollment cancellation before the course start date.</p>
            <p>Once the program has started, refund eligibility may be limited to the approved exception policy and documentation provided to the office.</p>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-primary-500 hover:text-primary-700">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Home</span>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
};

export default RefundPage;

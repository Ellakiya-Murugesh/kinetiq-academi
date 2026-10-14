import React from 'react';
import { SEO } from '../components/ui/SEO';
import { FileText, ArrowLeft, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BRAND_NAME } from '../config/brand';

export const TermsPage: React.FC = () => {
  return (
    <>
      <SEO
        title="Terms & Conditions — Academic Service Agreement"
        description={`Terms and conditions governing course enrollment, digital access rights and code of conduct for ${BRAND_NAME}.`}
      />

      <section className="bg-gradient-to-b from-primary-50/60 to-white py-12 sm:py-16 border-b border-gray-100">
        <div className="container-max max-w-4xl text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 text-primary-600 text-xs font-bold uppercase tracking-wider">
            <FileText className="w-3.5 h-3.5" />
            <span>Service Terms</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-navy-500">
            Terms &amp; Conditions
          </h1>
          <p className="text-sm text-gray-500">
            Effective Date: January 1, 2026 • {BRAND_NAME}
          </p>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="container-max max-w-3xl space-y-8 text-gray-700 leading-relaxed text-sm sm:text-base">
          <div>
            <h2 className="text-xl font-bold text-navy-500 mb-2">1. Agreement to Terms</h2>
            <p>
              By accessing our website, purchasing our coaching courses, or utilizing our study resources, you agree to be bound by these Terms and Conditions and all applicable Indian educational guidelines. If you disagree with any part of these terms, you must discontinue using our services.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-navy-500 mb-2">2. Single-User License &amp; Copyright</h2>
            <p>
              Course subscriptions, live session links, and downloadable study materials (notes, PYQ solutions, test sheets) are granted under a non-exclusive, non-transferable, single-user license strictly for the personal academic preparation of the enrolled student. Sharing portal login credentials, recording live lectures without authorization, or redistributing materials on Telegram, WhatsApp, or public forums is strictly prohibited and subject to immediate termination without refund and potential copyright enforcement.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-navy-500 mb-2">3. No Guarantee of Exam Selection or Ranking</h2>
            <p>
              {BRAND_NAME} provides structured coaching, pedagogical methodology, practice tests, and mentor guidance. However, GATE outcomes, AIR rank, postgraduate admissions, PSU recruitment, and related career opportunities depend entirely on individual candidate dedication, institutional seat availability, and independent conducting agency evaluation. We do not make or imply any guarantee of selection, rank, or appointment.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-navy-500 mb-2">4. Program Schedule &amp; Modifications</h2>
            <p>
              While we adhere strictly to the published 100-day 5+1 weekly schedule, {BRAND_NAME} reserves the right to reschedule specific live sessions or reassign faculty members due to unforeseen emergencies, national holidays, or technical disruptions. All adjustments will be notified to students in advance.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-navy-500 mb-2">5. Governing Law</h2>
            <p>
              These Terms shall be interpreted and governed in accordance with the laws of India, subject to the jurisdiction of competent courts.
            </p>
          </div>

          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 text-xs text-gray-500">
            [REPLACE WITH FINAL LEGAL TERMS &amp; CONDITIONS CONTRACT PRIOR TO COMMERCIAL LAUNCH]
          </div>

          <div className="pt-6 border-t border-gray-200">
            <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-primary-500 hover:text-primary-700">
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
};

export default TermsPage;

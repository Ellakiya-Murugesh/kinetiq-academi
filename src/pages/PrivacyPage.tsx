import React from 'react';
import { SEO } from '../components/ui/SEO';
import { ShieldCheck, Lock, FileText, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BRAND_NAME } from '../config/brand';

export const PrivacyPage: React.FC = () => {
  return (
    <>
      <SEO
        title="Privacy Policy — Data Protection & Learner Confidentiality"
        description={`Privacy policy and data collection transparency guidelines for ${BRAND_NAME} online coaching platform.`}
      />

      <section className="bg-gradient-to-b from-primary-50/60 to-white py-12 sm:py-16 border-b border-gray-100">
        <div className="container-max max-w-4xl text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 text-primary-600 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Learner Data Protection</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-navy-500">
            Privacy Policy
          </h1>
          <p className="text-sm text-gray-500">
            Effective Date: January 1, 2026 • Last Updated: October 2026
          </p>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="container-max max-w-3xl space-y-8 text-gray-700 leading-relaxed text-sm sm:text-base">
          <div>
            <h2 className="text-xl font-bold text-navy-500 mb-2">1. Introduction</h2>
            <p>
              {BRAND_NAME} (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;) is committed to protecting your privacy and ensuring the confidentiality of your personal information. This Privacy Policy details our practices concerning data collection, usage, and safeguarding when you use our website, mobile interface, and online coaching services for GATE, UGC NET, and CSIR NET preparation.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-navy-500 mb-2">2. Information We Collect</h2>
            <p className="mb-2">We collect information that you directly provide when registering, submitting guidance requests, or completing enrollment:</p>
            <ul className="list-disc list-inside space-y-1.5 pl-2 text-gray-600">
              <li><strong>Contact Information:</strong> Name, email address, WhatsApp/phone number.</li>
              <li><strong>Academic Data:</strong> Target examination (GATE, UGC NET, CSIR NET), subject preference (Chemistry, Physics), and institutional background.</li>
              <li><strong>Payment Transactions:</strong> Transaction identifiers, payment timestamps, and billing details processed through secure gateway providers. We do not store raw credit card credentials.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-bold text-navy-500 mb-2">3. How We Use Your Data</h2>
            <ul className="list-disc list-inside space-y-1.5 pl-2 text-gray-600">
              <li>To schedule and deliver live online coaching lectures, workshops, and tests.</li>
              <li>To communicate batch announcements, class links, and syllabus schedules.</li>
              <li>To answer student queries and provide academic counseling.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-bold text-navy-500 mb-2">4. Third-Party Disclosures</h2>
            <p>
              We do not sell, rent, or trade student personal information to marketing advertisers. Data is shared exclusively with necessary infrastructure partners (such as video streaming CDNs, payment processors, and SMS/WhatsApp communication gateways) strictly to provide course functionality.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-navy-500 mb-2">5. Data Security</h2>
            <p>
              All interactions on this platform are protected using industry-standard TLS/SSL encryption protocols. Access to student records is restricted strictly to authorized administrative staff.
            </p>
          </div>

          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 text-xs text-gray-500">
            [REPLACE WITH FINAL LEGAL PRIVACY POLICY TEXT UPON FORMAL LEGAL COUNSEL REVIEW]
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

export default PrivacyPage;

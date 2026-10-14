import React from 'react';
import { faqs } from '../../data/faq';
import { FAQAccordion } from '../ui/FAQAccordion';
import { HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export const HomeFAQ: React.FC = () => {
  return (
    <section id="faq" className="section-padding bg-gray-50/80 border-b border-gray-100">
      <div className="container-max">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 text-primary-600 text-xs font-bold uppercase tracking-wider">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Got Questions?</span>
          </div>

          <h2 className="section-heading">
            Frequently Asked Questions
          </h2>

          <p className="section-subheading mx-auto">
            Find helpful information about course schedules, live classes, study materials, and enrollment.
          </p>
        </div>

        {/* Accordion Component */}
        <FAQAccordion items={faqs} />

        {/* Bottom Help Prompt */}
        <div className="mt-12 text-center p-6 bg-white rounded-3xl border border-gray-200 max-w-xl mx-auto shadow-sm space-y-3">
          <h4 className="font-bold text-base text-navy-500">
            Still have questions not answered above?
          </h4>
          <p className="text-xs sm:text-sm text-gray-600">
            Contact our admissions team with syllabus, schedule, and enrollment questions.
          </p>
          <div className="pt-2 flex items-center justify-center">
            <Link to="/contact" className="btn-secondary text-xs px-5 py-2.5">
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

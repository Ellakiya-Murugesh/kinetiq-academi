import React from 'react';
import { PaymentCard } from '../ui/PaymentCard';
import { Sparkles, ShieldCheck } from 'lucide-react';

export const PricingSection: React.FC = () => {
  return (
    <section id="pricing" className="section-padding bg-white border-b border-gray-100">
      <div className="container-max">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider border border-emerald-200">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Merit-Driven Performance Incentive</span>
          </div>

          <h2 className="section-heading">
            Start Your 100-Day Preparation Journey
          </h2>

          <p className="section-subheading mx-auto">
            Transparent, all-inclusive enrollment with focused academic guidance and comprehensive preparation resources.
          </p>
        </div>

        {/* Payment Card Component */}
        <PaymentCard
          showPaymentOptions={false}
          showSeatAvailability={false}
          refundDescription="Clear the exam and claim your ₹2,000 refund, subject to the published refund terms and verification."
        />
      </div>
    </section>
  );
};

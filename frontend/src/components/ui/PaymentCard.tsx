import React from 'react';
import {
  Check,
  Sparkles,
  QrCode,
  ShieldCheck,
} from 'lucide-react';

interface PaymentCardProps {
  showPaymentOptions?: boolean;
  showSeatAvailability?: boolean;
  refundDescription?: string;
}

export const PaymentCard: React.FC<PaymentCardProps> = ({
  showPaymentOptions = true,
  showSeatAvailability = true,
  refundDescription = 'Clear the exam and claim your ₹2,000 refund, subject to the published refund terms and verification.',
}) => {
  return (
    <div className="space-y-12">
      {/* Top Pricing Card Banner */}
      <div className="card border-2 border-primary-500 overflow-hidden shadow-2xl relative">
        {/* Top Highlight Banner */}
        <div className="bg-primary-500 text-white px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm font-semibold">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Limited Seat Intake for November 1 Batch</span>
          </div>
          <span className="bg-amber-400 text-navy-900 font-extrabold px-2.5 py-0.5 rounded-full text-xs uppercase tracking-wide">
            First Come, First Served
          </span>
        </div>

        <div className="p-6 sm:p-10">
          <div className={`grid grid-cols-1 ${showPaymentOptions ? 'lg:grid-cols-12' : ''} gap-8 items-start`}>
            {/* Left Col: Course Summary & Pricing */}
            <div className={`${showPaymentOptions ? 'lg:col-span-7' : 'lg:col-span-12'} space-y-6`}>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-primary-600 bg-primary-50 px-3 py-1 rounded-full border border-primary-100">
                  Comprehensive 100-Day Program
                </span>
                <h3 className="text-3xl sm:text-4xl font-black text-navy-500 mt-2">
                  100-Day GATE Coaching
                </h3>
                <p className="text-gray-600 text-sm sm:text-base mt-2 leading-relaxed">
                  Full access to live classes, daily problem-solving workshops, weekly mock tests, revision notes, and direct mentorship for Chemistry or Physics.
                </p>
              </div>

              {/* Price Block */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-gray-50 to-primary-50/40 border border-gray-200">
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl sm:text-5xl font-black text-navy-500 tracking-tight">
                    ₹10,000
                  </span>
                  <span className="text-lg text-gray-400 line-through font-medium">
                    ₹15,000
                  </span>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    33% Introductory Off
                  </span>
                </div>

                {/* Refund Highlight Banner */}
                <div className="mt-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="text-xs leading-relaxed">
                    <strong className="font-bold text-emerald-800">
                      ₹2,000 / 20% Clear-The-Exam Refund:
                    </strong>{' '}
                    {refundDescription}
                  </div>
                </div>

              </div>

              {/* Inclusions */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-500">
                  What&apos;s Included In Your Fee
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-700">
                  {[
                    '500+ Hours Live Classes',
                    'Weekly Full Mock Tests',
                    'All PDF Notes & PYQ Keys',
                    'Live Doubt Resolution',
                    'Recorded Backups [IF AVAILABLE]',
                    '₹2,000 Performance Refund Option',
                  ].map((inc, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs sm:text-sm">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>{inc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {showPaymentOptions && (
              <div className="lg:col-span-5 bg-gray-50 rounded-2xl p-6 border border-gray-200">
              <section aria-labelledby="upi-payment-heading" className="space-y-4">
                <h4 id="upi-payment-heading" className="text-lg font-bold text-navy-500 flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-emerald-600" />
                  <span>Pay with UPI QR Code</span>
                </h4>

                <div className="bg-white p-4 sm:p-5 rounded-xl border border-gray-200 text-center space-y-3">
                  <p className="text-sm text-gray-600">
                    Open any UPI app and scan this QR code to pay ₹10,000.
                  </p>
                  <div className="flex justify-center">
                    <img
                      src="/images/kinetiq-upi-qr.jpeg"
                      alt="UPI payment QR code for Kinetiq Academy"
                      className="block h-auto w-full max-w-[300px] object-contain"
                    />
                  </div>
                  <p className="text-base font-extrabold text-navy-500">
                    Amount: ₹10,000
                  </p>
                </div>

                <div className="text-xs text-gray-600 bg-white p-4 rounded-xl border border-gray-200 leading-relaxed">
                  After completing the payment, send your payment screenshot and registered email to WhatsApp at{' '}
                  <a
                    href="https://wa.me/916383951259"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-primary-600 underline underline-offset-2 hover:text-primary-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
                  >
                    +91 63839 51259
                  </a>{' '}
                  to activate your course portal access within 2 hours.
                </div>

                <a
                  href={`https://wa.me/916383951259?text=${encodeURIComponent('Hello Kinetiq Academy, I have completed the ₹10,000 payment for the 100-Day GATE Coaching course. Please verify my payment and activate my course portal access. I will share my payment screenshot and registered email.')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full btn-primary py-3 text-sm font-bold flex items-center justify-center text-center shadow-md shadow-primary-500/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
                >
                  Send Payment Proof on WhatsApp
                </a>

                <p className="text-xs text-gray-500 text-center leading-relaxed">
                  Payments are not verified automatically. Opening WhatsApp or sharing proof does not mark a payment as paid.
                </p>
              </section>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Comprehensive Refund Terms & Policy Breakdown */}
      <div className="bg-gray-50 rounded-3xl p-6 sm:p-10 border border-gray-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-xl sm:text-2xl font-black text-navy-500">
              Clear-The-Exam ₹2,000 Refund Terms
            </h4>
            <p className="text-xs sm:text-sm text-gray-500">
              Transparent policy guidelines governing the 20% incentive refund
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-sm text-gray-700">
          {/* Card 1: Eligibility */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 space-y-2">
            <h5 className="font-bold text-navy-500 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary-50 text-primary-600 text-xs font-bold flex items-center justify-center">1</span>
              Eligibility Requirements
            </h5>
            <p className="text-xs text-gray-600 leading-relaxed">
              Enrolled students must appear for the immediate upcoming GATE cycle and score equal to or above the officially declared general/category qualifying cutoff.
            </p>
          </div>

          {/* Card 2: Required Proof */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 space-y-2">
            <h5 className="font-bold text-navy-500 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary-50 text-primary-600 text-xs font-bold flex items-center justify-center">2</span>
              Required Documentation
            </h5>
            <p className="text-xs text-gray-600 leading-relaxed">
              A copy of your official exam admit card, downloaded original score card from the conducting authority, and valid government ID matching your enrollment name.
            </p>
          </div>

          {/* Card 3: Claim Period */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 space-y-2">
            <h5 className="font-bold text-navy-500 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary-50 text-primary-600 text-xs font-bold flex items-center justify-center">3</span>
              Claim Window
            </h5>
            <p className="text-xs text-gray-600 leading-relaxed">
              Claims must be formally lodged via our refund portal or email within 30 days of the official announcement of the examination results by the conducting body.
            </p>
          </div>

          {/* Card 4: Verification */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 space-y-2">
            <h5 className="font-bold text-navy-500 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary-50 text-primary-600 text-xs font-bold flex items-center justify-center">4</span>
              Verification Audit
            </h5>
            <p className="text-xs text-gray-600 leading-relaxed">
              Our academic administration audits roll numbers and result authentication with the published qualified roll list to protect program integrity.
            </p>
          </div>

          {/* Card 5: Processing Timeline */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 space-y-2">
            <h5 className="font-bold text-navy-500 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary-50 text-primary-600 text-xs font-bold flex items-center justify-center">5</span>
              Disbursement Timeline
            </h5>
            <p className="text-xs text-gray-600 leading-relaxed">
              Upon successful verification, the ₹2,000 incentive refund is credited directly to your original payment method or bank account within 7 to 10 business days.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

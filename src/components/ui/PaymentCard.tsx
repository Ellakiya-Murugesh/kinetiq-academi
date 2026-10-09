import React from 'react';
import { Link } from 'react-router-dom';
import { Check, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const PaymentCard: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const isStudent = isAuthenticated && user?.role === 'STUDENT';
  const enrollmentPath = isStudent ? '/student/enroll' : '/signup';

  return (
    <div className="card border-2 border-primary-500 overflow-hidden shadow-2xl">
      <div className="bg-primary-500 text-white px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm font-semibold">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>GATE Course Enrollment</span>
        </div>
        <span className="bg-white/15 text-white font-bold px-2.5 py-0.5 rounded-full text-xs">
          Payment after enrollment
        </span>
      </div>

      <div className="p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        <div className="space-y-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-primary-600 bg-primary-50 px-3 py-1 rounded-full border border-primary-100">
              Course Fee
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-navy-500 mt-3">
              Start Your GATE Enrollment
            </h2>
            <p className="text-gray-600 text-sm sm:text-base mt-2 leading-relaxed">
              Choose your GATE course and submit your enrollment first. You can then pay using the official UPI QR code, with payment verification handled by the academy.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-gradient-to-br from-gray-50 to-primary-50/40 border border-gray-200">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Existing course fee
            </span>
            <p className="mt-1 text-4xl sm:text-5xl font-black text-navy-500 tracking-tight">
              ₹10,000
            </p>
            <p className="mt-2 text-xs text-gray-500">
              The applicable fee is shown again in your enrollment summary before you submit.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-500">
              Course support includes
            </h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm text-gray-700">
              {[
                'Live classes',
                'Weekly mock tests',
                'Study notes and previous-year questions',
                'Live doubt resolution',
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <aside className="bg-gray-50 rounded-2xl p-6 sm:p-8 border border-gray-200 space-y-5">
          <h3 className="text-xl font-bold text-navy-500">
            Complete enrollment before payment
          </h3>
          <ol className="space-y-3 text-sm text-gray-600 list-decimal list-inside">
            <li>Sign in or create your student account.</li>
            <li>Select your GATE course and submit the enrollment.</li>
            <li>Scan the official UPI QR code and confirm payment for verification.</li>
          </ol>
          <Link
            to={enrollmentPath}
            className="w-full btn-primary py-3 text-sm font-bold flex items-center justify-center"
          >
            {isStudent ? 'Continue to Course Enrollment' : 'Create Student Account'}
          </Link>
          {!isStudent && (
            <p className="text-xs text-center text-gray-500">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-700">
                Sign in
              </Link>
            </p>
          )}
        </aside>
      </div>
    </div>
  );
};

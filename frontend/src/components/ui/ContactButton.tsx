import React, { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ContactButton: React.FC = () => {
  const [showTooltip, setShowTooltip] = useState(true);

  return (
    <aside
      aria-label="Kinetiq Academi support contact"
      className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end gap-2 group"
    >
      {/* Friendly Dismissable Floating Tooltip */}
      {showTooltip && (
        <div className="hidden lg:flex items-center gap-2 bg-white text-navy-500 text-xs py-2 px-3.5 rounded-2xl shadow-xl border border-gray-100 max-w-xs animate-fade-in-up">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="font-medium">
            Have questions? Contact our support team.
          </span>
          <button
            onClick={() => setShowTooltip(false)}
            className="text-gray-400 hover:text-gray-600 ml-1 p-0.5"
            aria-label="Dismiss message"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Floating Action Button */}
      <Link
        to="/contact"
        aria-label="Contact Kinetiq Academi"
        className="w-14 h-14 rounded-full bg-primary-500 hover:bg-primary-600 text-white flex items-center justify-center shadow-lg hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-primary-300"
      >
        <MessageCircle className="w-7 h-7" />
        <span className="sr-only">Contact Kinetiq Academi support</span>
      </Link>
    </aside>
  );
};

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MaterialItem } from '../../data/materials';
import {
  FileText,
  Lock,
  Download,
  Eye,
  FileCheck,
  BookOpen,
  Sparkles,
  X
} from 'lucide-react';

interface MaterialCardProps {
  material: MaterialItem;
}

export const MaterialCard: React.FC<MaterialCardProps> = ({ material }) => {
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const getFormatBadge = () => {
    switch (material.format) {
      case 'Online Test':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'ZIP':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  return (
    <>
      <div className="card p-6 flex flex-col justify-between group hover:border-primary-300">
        <div>
          {/* Header row: category chip and format/size */}
          <div className="flex items-center justify-between gap-2 mb-4">
            <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-navy-50 text-navy-600 border border-navy-100">
              {material.category}
            </span>
            <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getFormatBadge()}`}>
                {material.format}
              </span>
              <span>•</span>
              <span>{material.fileSize}</span>
            </div>
          </div>

          {/* Title with File Icon */}
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform mt-0.5">
              <FileText className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-base text-navy-500 group-hover:text-primary-600 transition-colors leading-snug">
              {material.title}
            </h4>
          </div>

          {/* Description */}
          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mb-4">
            {material.description}
          </p>

          <div className="flex items-center gap-3 text-xs text-gray-400 mb-4">
            <span>{material.pages} Pages</span>
            <span>•</span>
            <span>Target: {material.exam} ({material.subject})</span>
          </div>
        </div>

        {/* Action Row */}
        <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
          {material.isLocked ? (
            <div className="flex items-center justify-between w-full">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
                <Lock className="w-3.5 h-3.5" />
                🔒 Available after enrollment
              </span>

              <Link
                to="/payment"
                className="text-xs font-bold text-primary-500 hover:text-primary-700 transition-colors"
              >
                Enroll to Unlock →
              </Link>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full">
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                <Sparkles className="w-3 h-3" />
                Free Preview Sample
              </span>

              <button
                type="button"
                onClick={() => setShowPreviewModal(true)}
                className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-primary-500 text-white hover:bg-primary-600 transition-colors shadow-sm"
              >
                <Eye className="w-3.5 h-3.5" />
                View Sample
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Free Sample Preview Modal */}
      {showPreviewModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4">
            <button
              onClick={() => setShowPreviewModal(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary-50 text-primary-500 flex items-center justify-center">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase text-primary-600 bg-primary-50 px-2.5 py-0.5 rounded">
                  Free Resource Preview
                </span>
                <h4 className="text-lg font-bold text-navy-500 mt-1">
                  {material.title}
                </h4>
              </div>
            </div>

            <div className="p-6 bg-gray-50 rounded-2xl border border-gray-200 text-center space-y-3">
              <p className="text-sm text-gray-600">
                This is a sample excerpt of our verified study material for {material.exam} {material.subject}.
              </p>
              <div className="p-3 bg-white rounded-xl border border-gray-200 text-xs font-mono text-gray-500">
                [PREVIEW DOCUMENT: Sample Formula Sheet &amp; Method Checklist (2 Pages)]
              </div>
              <p className="text-xs text-gray-400">
                The full {material.pages}-page edition includes solved numerical questions, step-by-step proofs, and trick sheets.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="w-full sm:w-auto btn-secondary text-xs px-5 py-2.5"
              >
                Close Preview
              </button>

              <Link
                to="/payment"
                className="w-full sm:w-auto btn-primary text-xs px-6 py-2.5 flex items-center justify-center gap-1.5"
              >
                <span>Unlock Full Library (₹10,000)</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

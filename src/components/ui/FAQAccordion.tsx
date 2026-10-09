import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { FAQ } from '../../data/faq';

interface FAQAccordionProps {
  items: FAQ[];
  allowMultiple?: boolean;
}

export const FAQAccordion: React.FC<FAQAccordionProps> = ({
  items,
  allowMultiple = false,
}) => {
  const [openIds, setOpenIds] = useState<number[]>([1]); // First question open by default

  const toggleItem = (id: number) => {
    if (allowMultiple) {
      setOpenIds((prev) =>
        prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
      );
    } else {
      setOpenIds((prev) => (prev.includes(id) ? [] : [id]));
    }
  };

  return (
    <div className="space-y-3.5 max-w-4xl mx-auto" role="region" aria-label="Frequently Asked Questions">
      {items.map((faq) => {
        const isOpen = openIds.includes(faq.id);
        const headingId = `faq-heading-${faq.id}`;
        const panelId = `faq-panel-${faq.id}`;

        return (
          <div
            key={faq.id}
            className={`border rounded-2xl transition-all duration-200 overflow-hidden ${
              isOpen
                ? 'border-primary-300 bg-white shadow-md'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <button
              id={headingId}
              type="button"
              onClick={() => toggleItem(faq.id)}
              aria-expanded={isOpen}
              aria-controls={panelId}
              className="w-full px-6 py-4.5 text-left flex items-center justify-between gap-4 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-inset"
            >
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-xl bg-primary-50 text-primary-600 text-xs font-bold flex items-center justify-center shrink-0">
                  {faq.id}
                </span>
                <span className="font-bold text-base sm:text-lg text-navy-500 text-left">
                  {faq.question}
                </span>
              </div>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200 ${
                  isOpen ? 'rotate-180 bg-primary-50 text-primary-600' : 'bg-gray-100 text-gray-500'
                }`}
              >
                <ChevronDown className="w-4 h-4" />
              </div>
            </button>

            <div
              id={panelId}
              role="region"
              aria-labelledby={headingId}
              className={`transition-all duration-300 ease-in-out px-6 ${
                isOpen ? 'max-h-96 pb-5 opacity-100' : 'max-h-0 pb-0 opacity-0'
              } overflow-hidden`}
            >
              <div className="pt-2 text-sm sm:text-base text-gray-600 leading-relaxed border-t border-gray-100">
                {faq.answer}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

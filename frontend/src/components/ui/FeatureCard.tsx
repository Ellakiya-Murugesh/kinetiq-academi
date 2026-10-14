import React from 'react';
import { LucideIcon } from 'lucide-react';

interface FeatureCardProps {
  number: string;
  title: string;
  description: string;
  icon: LucideIcon;
  badge?: string;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
  number,
  title,
  description,
  icon: Icon,
  badge,
}) => {
  return (
    <div className="card p-6 sm:p-8 flex flex-col justify-between group hover:border-primary-300 relative overflow-hidden">
      {/* Decorative Number watermark */}
      <span className="absolute top-4 right-5 text-4xl sm:text-5xl font-black text-gray-100 group-hover:text-primary-50 transition-colors pointer-events-none select-none">
        {number}
      </span>

      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="w-12 h-12 rounded-2xl bg-primary-50 text-primary-500 flex items-center justify-center group-hover:bg-primary-500 group-hover:text-white transition-all duration-300 shadow-sm">
            <Icon className="w-6 h-6" />
          </div>
          {badge && (
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
              {badge}
            </span>
          )}
        </div>

        <h3 className="text-xl font-bold text-navy-500 mb-2 group-hover:text-primary-600 transition-colors">
          {title}
        </h3>

        <p className="text-gray-600 text-sm leading-relaxed">
          {description}
        </p>
      </div>

    </div>
  );
};

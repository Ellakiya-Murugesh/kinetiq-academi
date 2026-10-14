import React from 'react';
import { FacultyMember } from '../../data/faculty';
import { User, Award, GraduationCap, Building2 } from 'lucide-react';

interface FacultyCardProps {
  member: FacultyMember;
}

export const FacultyCard: React.FC<FacultyCardProps> = ({ member }) => {
  return (
    <div className="card overflow-hidden group hover:border-primary-300 flex flex-col justify-between">
      {/* Photo Area / Placeholder */}
      <div className="relative aspect-[4/3] bg-gradient-to-br from-navy-50 to-primary-50/50 flex flex-col items-center justify-center p-6 text-center border-b border-gray-100 group-hover:bg-primary-50/30 transition-colors">
        <div className="w-20 h-20 rounded-full bg-white shadow-md border-2 border-primary-100 flex items-center justify-center text-primary-500 mb-3 group-hover:scale-105 transition-transform">
          <User className="w-10 h-10 text-gray-400" />
        </div>
        <span className="text-[11px] font-mono font-semibold text-primary-600 bg-white px-2.5 py-1 rounded-full shadow-sm border border-gray-200">
          [REPLACE WITH FACULTY PHOTO]
        </span>

        {/* Subject Pill */}
        <span className="absolute top-3 right-3 text-xs font-bold px-2.5 py-1 rounded-full bg-navy-500 text-white shadow-sm">
          {member.subject}
        </span>
      </div>

      {/* Faculty Details */}
      <div className="p-6 space-y-3 flex-grow flex flex-col justify-between">
        <div>
          <h4 className="text-xl font-bold text-navy-500 group-hover:text-primary-600 transition-colors">
            {member.name}
          </h4>

          <div className="space-y-1.5 mt-2">
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <GraduationCap className="w-4 h-4 text-primary-500 shrink-0" />
              <span className="font-medium">{member.qualification}</span>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Building2 className="w-4 h-4 text-primary-500 shrink-0" />
              <span>{member.institution}</span>
            </div>
          </div>
        </div>

        {/* Rank/Achievement Notice */}
        <div className="pt-3 border-t border-gray-100">
          <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/80 text-[11px] text-amber-900 flex items-start gap-1.5">
            <Award className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold">Credential:</strong> {member.achievement}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

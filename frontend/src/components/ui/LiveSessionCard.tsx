import React from 'react';
import { LiveSession } from '../../data/liveSessions';
import {
  Calendar,
  Clock,
  User,
  Video,
  PlayCircle,
  ExternalLink,
  Radio,
  BookOpen
} from 'lucide-react';

interface LiveSessionCardProps {
  session: LiveSession;
}

export const LiveSessionCard: React.FC<LiveSessionCardProps> = ({ session }) => {
  const isUpcoming = session.status === 'upcoming';

  return (
    <div className="card p-6 flex flex-col justify-between group hover:border-primary-300">
      <div>
        {/* Header: Subject & Exam Chips */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                session.subject === 'Chemistry'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}
            >
              {session.subject}
            </span>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-navy-50 text-navy-600 border border-navy-100">
              {session.exam}
            </span>
          </div>

          {isUpcoming ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
              Live Scheduled
            </span>
          ) : (
            <span className="text-[11px] font-semibold text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full">
              Archived Recording
            </span>
          )}
        </div>

        {/* Title */}
        <h4 className="font-bold text-lg text-navy-500 group-hover:text-primary-600 transition-colors leading-snug mb-2">
          {session.title}
        </h4>

        {/* Topic details */}
        <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mb-4">
          <strong className="text-navy-500">Focus Topic:</strong> {session.topic}
        </p>

        {/* Metadata info grid */}
        <div className="grid grid-cols-2 gap-2 py-3 border-t border-b border-gray-100 text-xs text-gray-600 mb-4">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-primary-500 shrink-0" />
            <span>{session.date}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-primary-500 shrink-0" />
            <span>{session.time}</span>
          </div>
          <div className="flex items-center gap-1.5 col-span-2">
            <User className="w-3.5 h-3.5 text-primary-500 shrink-0" />
            <span>Instructor: <strong className="text-navy-500">{session.faculty}</strong></span>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-2">
        {isUpcoming ? (
          <div className="space-y-2">
            <a
              href="#[LIVE-CLASS-LINK]"
              className="w-full btn-primary py-2.5 text-xs font-bold flex items-center justify-center gap-2 shadow-sm"
              onClick={(e) => {
                e.preventDefault();
                alert('Placeholder Link: [LIVE CLASS LINK] — Live class link will be enabled 15 minutes before the session starts.');
              }}
            >
              <Radio className="w-4 h-4" />
              <span>Join Live Class [LIVE CLASS LINK]</span>
            </a>
            <p className="text-[10px] text-center text-gray-400">
              Active for enrolled students with valid access credentials
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <a
              href="#[RECORDING-LINK]"
              className="w-full btn-secondary py-2.5 text-xs font-bold flex items-center justify-center gap-2"
              onClick={(e) => {
                e.preventDefault();
                alert('Placeholder Link: [RECORDING LINK] — Video player will open the archived lecture stream.');
              }}
            >
              <PlayCircle className="w-4 h-4 text-primary-500" />
              <span>Watch Recording [RECORDING LINK]</span>
            </a>
            <p className="text-[10px] text-center text-gray-400">
              Duration: {session.duration} • 1080p Stream
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

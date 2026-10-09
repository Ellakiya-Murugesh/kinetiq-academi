import React, { useState } from 'react';
import { SEO } from '../components/ui/SEO';
import { upcomingSessions, recordedSessions } from '../data/liveSessions';
import { LiveSessionCard } from '../components/ui/LiveSessionCard';
import {
  Video,
  Radio,
  PlayCircle,
  Sparkles,
  Calendar,
  Clock,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const LiveSessionsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'recordings'>('upcoming');
  const [subjectFilter, setSubjectFilter] = useState<'All' | 'Chemistry' | 'Physics'>('All');

  const filteredUpcoming = upcomingSessions.filter(
    (s) => subjectFilter === 'All' || s.subject === subjectFilter
  );

  const filteredRecordings = recordedSessions.filter(
    (s) => subjectFilter === 'All' || s.subject === subjectFilter
  );

  return (
    <>
      <SEO
        title="Live Interactive Classes & Recorded Lecture Archive"
        description="Attend daily live classes and access high-definition recorded archives for GATE, UGC NET & CSIR NET Chemistry and Physics."
      />

      {/* Header */}
      <section className="bg-gradient-to-b from-primary-50/60 to-white py-14 sm:py-20 border-b border-gray-100">
        <div className="container-max text-center max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 text-primary-600 text-xs font-bold uppercase tracking-wider">
            <Radio className="w-3.5 h-3.5 text-red-500 animate-pulse" />
            <span>Interactive Virtual Classroom</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-black text-navy-500">
            Live Classes &amp; Recordings
          </h1>

          <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
            Attend real-time problem-solving workshops or review archived video lectures at your own pace with unlimited revisions.
          </p>

          {/* Switcher Tabs */}
          <div className="flex items-center justify-center gap-3 pt-6">
            <button
              type="button"
              onClick={() => setActiveTab('upcoming')}
              className={`px-6 py-3 rounded-2xl font-bold text-sm sm:text-base transition-all flex items-center gap-2 ${
                activeTab === 'upcoming'
                  ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                  : 'bg-white text-navy-500 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              <Radio className="w-4 h-4 text-red-400" />
              <span>Upcoming Live Classes ({upcomingSessions.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('recordings')}
              className={`px-6 py-3 rounded-2xl font-bold text-sm sm:text-base transition-all flex items-center gap-2 ${
                activeTab === 'recordings'
                  ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                  : 'bg-white text-navy-500 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              <PlayCircle className="w-4 h-4" />
              <span>Past Recordings ({recordedSessions.length})</span>
            </button>
          </div>
        </div>
      </section>

      {/* Main Section */}
      <section className="section-padding bg-gray-50/70">
        <div className="container-max">
          {/* Subject Filter Row */}
          <div className="flex items-center justify-between gap-4 mb-8 pb-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Filter Subject:
              </span>
              {(['All', 'Chemistry', 'Physics'] as const).map((sub) => (
                <button
                  key={sub}
                  type="button"
                  onClick={() => setSubjectFilter(sub)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    subjectFilter === sub
                      ? 'bg-navy-500 text-white'
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>

            <span className="text-xs text-gray-500 font-medium">
              {activeTab === 'upcoming' ? '5 Live Days + 1 Review Day / Week' : 'Lifetime Access During Course Period'}
            </span>
          </div>

          {/* Cards Grid */}
          {activeTab === 'upcoming' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredUpcoming.map((session) => (
                <LiveSessionCard key={session.id} session={session} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredRecordings.map((session) => (
                <LiveSessionCard key={session.id} session={session} />
              ))}
            </div>
          )}

          {/* Availability / Technical Notice */}
          <div className="mt-12 p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 max-w-2xl mx-auto flex items-start gap-3 text-xs text-amber-900">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong>Streaming Notice:</strong> [LIVE CLASS LINK] and [RECORDING LINK] are active for authenticated enrolled accounts. Live streams require standard broadband connectivity (2 Mbps minimum recommended).
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default LiveSessionsPage;

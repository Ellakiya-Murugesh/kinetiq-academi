import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../utils/api';
import { Video, Calendar, Clock, Radio, PlayCircle } from 'lucide-react';

export const StudentLiveSessionsPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'recordings'>('upcoming');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await apiRequest('/api/student/live-sessions');
        setData(res);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not load live sessions.');
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, []);

  if (loading) {
    return <div className="py-12 text-center text-xs text-gray-400">Loading live classroom schedule...</div>;
  }

  const upcoming = data?.upcoming || [];
  const recordings = data?.recordings || [];

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-navy-500">
            Live Lectures &amp; Video Recordings
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Access secure live classes with interactive mentor Q&amp;A or stream past lecture recordings anytime.
          </p>
        </div>

        {/* Switcher Tabs */}
        <div className="flex items-center gap-2 p-1 bg-white rounded-2xl border border-gray-200">
          <button
            type="button"
            onClick={() => setActiveTab('upcoming')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'upcoming'
                ? 'bg-primary-500 text-white shadow-sm'
                : 'text-gray-600 hover:text-navy-500'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Upcoming Classes ({upcoming.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('recordings')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'recordings'
                ? 'bg-primary-500 text-white shadow-sm'
                : 'text-gray-600 hover:text-navy-500'
            }`}
          >
            <PlayCircle className="w-3.5 h-3.5" />
            <span>Recordings Archive ({recordings.length})</span>
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {/* Content Area */}
      {activeTab === 'upcoming' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {upcoming.map((s: any) => (
            <div
              key={s.id}
              className="card p-6 border border-gray-200 flex flex-col justify-between hover:border-primary-300 transition-all"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-primary-50 text-primary-600 border border-primary-200">
                    {s.exam} • {s.subject}
                  </span>
                  <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                    Live Class
                  </span>
                </div>

                <h3 className="font-bold text-base text-navy-500 mb-2 leading-snug">
                  {s.title}
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed mb-4">
                  {s.description}
                </p>

                <div className="space-y-1.5 py-3 border-t border-b border-gray-100 text-xs text-gray-600 mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-primary-500" />
                    <span>{s.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-primary-500" />
                    <span>{s.startTime} - {s.endTime} IST</span>
                  </div>
                  <div>
                    Faculty: <strong>{s.faculty}</strong>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <a
                  href={s.meetingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full btn-primary text-xs py-2.5 flex items-center justify-center gap-2 font-bold shadow-sm"
                >
                  <Video className="w-4 h-4" />
                  <span>Join Live Class</span>
                </a>
              </div>
            </div>
          ))}
          {!error && upcoming.length === 0 && (
            <div className="col-span-full rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center text-sm text-gray-500">
              No upcoming classes scheduled.
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recordings.map((rec: any) => (
            <div
              key={rec.id}
              className="card p-5 border border-gray-200 flex flex-col justify-between hover:border-primary-300 transition-all"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                  <span>{rec.exam} • {rec.subject}</span>
                  <span>{rec.duration}</span>
                </div>

                <h3 className="font-bold text-sm text-navy-500 mb-2 leading-snug">
                  {rec.title}
                </h3>
                <p className="text-xs text-gray-400 mb-4">
                  Recorded on: {rec.date}
                </p>
              </div>

              <a
                href={rec.recordingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full btn-secondary text-xs py-2 flex items-center justify-center gap-1.5 font-bold"
              >
                <PlayCircle className="w-4 h-4 text-primary-500" />
                <span>Watch Recording</span>
              </a>
            </div>
          ))}
          {!error && recordings.length === 0 && (
            <div className="col-span-full rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center text-sm text-gray-500">
              No lecture recordings available yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StudentLiveSessionsPage;

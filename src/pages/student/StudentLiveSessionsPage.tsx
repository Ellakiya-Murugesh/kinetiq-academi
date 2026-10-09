import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../utils/api';
import { Video, Calendar, Clock, Radio, PlayCircle, X, ShieldCheck } from 'lucide-react';

export const StudentLiveSessionsPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'recordings'>('upcoming');
  const [watchModal, setWatchModal] = useState<any | null>(null);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setLoading(true);
        const res = await apiRequest('/api/student/live-sessions');
        setData(res);
      } catch (err) {
        console.error(err);
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
                  href="#[LIVE-CLASS-LINK]"
                  onClick={(e) => {
                    e.preventDefault();
                    alert(`Launching Verified Classroom stream for ${s.title}.\nInstructor: ${s.faculty}\nSecure link: [LIVE CLASS LINK]`);
                  }}
                  className="w-full btn-primary text-xs py-2.5 flex items-center justify-center gap-2 font-bold shadow-sm"
                >
                  <Video className="w-4 h-4" />
                  <span>Join Protected Classroom</span>
                </a>
              </div>
            </div>
          ))}
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

              <button
                type="button"
                onClick={() => setWatchModal(rec)}
                className="w-full btn-secondary text-xs py-2 flex items-center justify-center gap-1.5 font-bold"
              >
                <PlayCircle className="w-4 h-4 text-primary-500" />
                <span>Watch Recording</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Video Recording Modal Player */}
      {watchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-sm">
          <div className="bg-navy-900 rounded-3xl p-6 sm:p-8 max-w-2xl w-full text-white space-y-4 shadow-2xl border border-navy-700">
            <div className="flex items-center justify-between pb-3 border-b border-navy-800">
              <h3 className="text-lg font-bold">
                {watchModal.title}
              </h3>
              <button onClick={() => setWatchModal(null)} className="p-1.5 text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="aspect-video bg-navy-950 rounded-2xl flex flex-col items-center justify-center border border-navy-800 p-6 text-center space-y-3">
              <PlayCircle className="w-16 h-16 text-primary-500 animate-pulse" />
              <p className="text-sm font-mono text-primary-300">
                [RECORDING STREAM: {watchModal.recordingUrl}]
              </p>
              <p className="text-xs text-gray-400">
                1080p High-Definition Recording • Duration: {watchModal.duration}
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setWatchModal(null)}
                className="btn-primary text-xs px-5 py-2"
              >
                Close Video Player
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentLiveSessionsPage;

import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../utils/api';
import { Video, Plus, Edit, Trash2, Calendar, Clock, ExternalLink, X, Radio } from 'lucide-react';

export const AdminLiveSessionsPage: React.FC = () => {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSession, setEditingSession] = useState<any | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    exam: 'GATE',
    subject: 'Chemistry',
    faculty: '[FACULTY NAME]',
    date: new Date().toISOString().split('T')[0],
    startTime: '18:00',
    endTime: '20:00',
    meetingLink: '[LIVE CLASS LINK]',
    description: '',
    status: 'Published',
  });

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const res = await apiRequest('/api/admin/live-sessions');
      setSessions(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleOpenCreate = () => {
    setEditingSession(null);
    setFormData({
      title: '',
      exam: 'GATE',
      subject: 'Chemistry',
      faculty: '[FACULTY NAME]',
      date: new Date().toISOString().split('T')[0],
      startTime: '18:00',
      endTime: '20:00',
      meetingLink: '[LIVE CLASS LINK]',
      description: '',
      status: 'Published',
    });
    setShowModal(true);
  };

  const handleOpenEdit = (session: any) => {
    setEditingSession(session);
    setFormData(session);
    setShowModal(true);
  };

  const handleToggleStatus = async (session: any) => {
    const nextStatus = session.status === 'Published' ? 'Draft' : 'Published';
    try {
      await apiRequest(`/api/admin/live-sessions/${session.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: nextStatus }),
      });
      fetchSessions();
    } catch (err) {
      alert('Failed to update live session');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this scheduled class?')) return;
    try {
      await apiRequest(`/api/admin/live-sessions/${id}`, { method: 'DELETE' });
      fetchSessions();
    } catch (err) {
      alert('Failed to delete live session');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSession) {
        await apiRequest(`/api/admin/live-sessions/${editingSession.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData),
        });
      } else {
        await apiRequest('/api/admin/live-sessions', {
          method: 'POST',
          body: JSON.stringify(formData),
        });
      }
      setShowModal(false);
      fetchSessions();
    } catch (err: any) {
      alert(err.message || 'Error saving session');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-navy-500">
            Live Session Management
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Schedule live video lectures, manage faculty assignments, and update classroom meeting links.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="btn-primary text-xs px-4 py-2.5 flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule New Live Class</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-3 text-center py-12 text-gray-400 text-xs">
            Loading scheduled classes...
          </div>
        ) : sessions.length === 0 ? (
          <div className="col-span-3 rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
            <Radio className="w-8 h-8 text-primary-500 mx-auto mb-3" />
            <h2 className="text-sm font-bold text-navy-500">No live sessions yet</h2>
            <p className="text-xs text-gray-500 mt-1">Schedule a new live class to add it to the calendar.</p>
          </div>
        ) : (
          sessions.map((session) => (
            <div
              key={session.id}
              className="card p-6 flex flex-col justify-between border border-gray-200 hover:border-primary-300 transition-all"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-navy-50 text-navy-600 border border-navy-100">
                    {session.exam} • {session.subject}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      session.status === 'Published'
                        ? 'bg-red-50 text-red-700 border-red-200'
                        : 'bg-gray-100 text-gray-600 border-gray-200'
                    }`}
                  >
                    {session.status}
                  </span>
                </div>

                <h3 className="font-bold text-base text-navy-500 mb-2 leading-snug">
                  {session.title}
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed mb-4">
                  {session.description}
                </p>

                <div className="space-y-1.5 py-3 border-t border-b border-gray-100 text-xs text-gray-600 mb-4">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-primary-500" />
                    <span>{session.date}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-primary-500" />
                    <span>{session.startTime} - {session.endTime} IST</span>
                  </div>
                  <div>
                    Faculty: <strong>{session.faculty}</strong>
                  </div>
                  <div className="p-2 bg-gray-50 rounded-lg font-mono text-[11px] text-gray-500 break-all">
                    Link: {session.meetingLink}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <button
                  onClick={() => handleToggleStatus(session)}
                  className="text-xs font-semibold text-gray-500 hover:text-navy-500"
                >
                  {session.status === 'Published' ? 'Unpublish' : 'Publish'}
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenEdit(session)}
                    className="p-1.5 rounded-lg text-gray-500 hover:text-primary-600 hover:bg-gray-100"
                    title="Edit Session"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(session.id)}
                    className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50"
                    title="Delete Session"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="text-xl font-bold text-navy-500">
                {editingSession ? 'Edit Live Session' : 'Schedule Live Class'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Session Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Quantum Operators & Commutators"
                  className="input-field text-xs py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Exam</label>
                  <select
                    value={formData.exam}
                    onChange={(e) => setFormData({ ...formData, exam: e.target.value })}
                    className="select-field text-xs py-2"
                  >
                    <option value="GATE">GATE</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Subject</label>
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="select-field text-xs py-2"
                  >
                    <option value="Chemistry">Chemistry</option>
                    <option value="Physics">Physics</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Faculty Name</label>
                <input
                  type="text"
                  value={formData.faculty}
                  onChange={(e) => setFormData({ ...formData, faculty: e.target.value })}
                  className="input-field text-xs py-2"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="input-field text-xs py-2"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    required
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="input-field text-xs py-2"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">End Time</label>
                  <input
                    type="time"
                    required
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="input-field text-xs py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Meeting Link (Zoom / Meet)</label>
                <input
                  type="text"
                  value={formData.meetingLink}
                  onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
                  className="input-field text-xs py-2 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Session Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-field text-xs py-2 resize-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary text-xs px-4 py-2"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary text-xs px-5 py-2 font-bold">
                  {editingSession ? 'Update Class' : 'Schedule Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLiveSessionsPage;

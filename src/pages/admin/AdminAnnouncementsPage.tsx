import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../utils/api';
import { GATE_MATERIAL_SUBJECTS } from '../../data/gateMaterialSubjects';
import { Bell, Plus, Trash2, Calendar, Users, X } from 'lucide-react';

export const AdminAnnouncementsPage: React.FC = () => {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    message: '',
    audience: 'All students',
    category: 'General',
    priority: 'Medium',
    keywords: '',
  });

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const res = await apiRequest('/api/admin/announcements');
      setAnnouncements(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this announcement?')) return;
    try {
      await apiRequest(`/api/admin/announcements/${id}`, { method: 'DELETE' });
      fetchAnnouncements();
    } catch (err) {
      alert('Failed to delete announcement');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/api/admin/announcements', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      setShowModal(false);
      setFormData({ title: '', message: '', audience: 'All students', category: 'General', priority: 'Medium', keywords: '' });
      fetchAnnouncements();
    } catch (err: any) {
      alert(err.message || 'Error posting announcement');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-navy-500">
            Announcements &amp; Broadcasts
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Dispatch urgent notices, timetable shifts, syllabus updates, and test alerts to targeted student cohorts.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="btn-primary text-xs px-4 py-2.5 flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>New Announcement</span>
        </button>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12 text-gray-400 text-xs">
            Loading announcements...
          </div>
        ) : announcements.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl text-center text-gray-400 text-xs border border-gray-200">
            No announcements broadcasted yet.
          </div>
        ) : (
          announcements.map((anc) => (
            <div
              key={anc.id}
              className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col md:flex-row md:items-start justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-primary-50 text-primary-600 border border-primary-200">
                    Audience: {anc.audience}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700">
                    {anc.category || 'General'}
                  </span>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                    anc.priority === 'Urgent' ? 'bg-rose-100 text-rose-700'
                      : anc.priority === 'High' ? 'bg-orange-100 text-orange-700'
                        : 'bg-blue-50 text-blue-700'
                  }`}>
                    {anc.priority || 'Medium'}
                  </span>
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{anc.publishDate}</span>
                  </span>
                </div>

                <h3 className="text-lg font-bold text-navy-500">
                  {anc.title}
                </h3>

                <p className="text-xs text-gray-600 leading-relaxed max-w-3xl">
                  {anc.message}
                </p>
              </div>

              <button
                onClick={() => handleDelete(anc.id)}
                className="p-2 rounded-xl text-red-400 hover:text-red-600 hover:bg-red-50 self-end md:self-start"
                title="Delete Announcement"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="text-xl font-bold text-navy-500">
                Broadcast New Announcement
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Headline</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Schedule Change: Saturday Test Review Timing"
                  className="input-field text-xs py-2"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Target Audience</label>
                <select
                  value={formData.audience}
                  onChange={(e) => setFormData({ ...formData, audience: e.target.value })}
                  className="select-field text-xs py-2"
                >
                  <option value="All students">All Enrolled Students</option>
                  <option value="GATE students">GATE Aspirants Only</option>
                  {GATE_MATERIAL_SUBJECTS.map((subject) => (
                    <option key={subject.value} value={subject.value}>{subject.label} Students Only</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="select-field text-xs py-2"
                  >
                    {['General', 'Schedule', 'Syllabus', 'Exam', 'Payment', 'Course', 'Other'].map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="select-field text-xs py-2"
                  >
                    {['Urgent', 'High', 'Medium', 'Low'].map((priority) => (
                      <option key={priority} value={priority}>{priority}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Search Keywords (comma-separated)</label>
                <input
                  type="text"
                  value={formData.keywords}
                  onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                  placeholder="e.g. exam date, application, deadline"
                  className="input-field text-xs py-2"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Message Content</label>
                <textarea
                  rows={4}
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Type your notice or instructions for students..."
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
                  Publish Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAnnouncementsPage;

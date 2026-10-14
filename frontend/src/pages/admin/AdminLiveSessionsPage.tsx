import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../utils/api';
import { Video, Plus, Edit, Calendar, Clock, ExternalLink, X, Radio } from 'lucide-react';

export const AdminLiveSessionsPage: React.FC = () => {
  const [sessions, setSessions] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSession, setEditingSession] = useState<any | null>(null);
  const [loadError, setLoadError] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    courseId: '',
    faculty: '',
    date: '',
    startTime: '',
    endTime: '',
    meetingLink: '',
    description: '',
    status: 'Draft',
  });

  const fetchSessions = async () => {
    try {
      setLoading(true);
      setLoadError('');
      const [sessionData, courseData] = await Promise.all([
        apiRequest('/api/admin/live-sessions'),
        apiRequest('/api/admin/courses'),
      ]);
      if (!Array.isArray(sessionData) || !Array.isArray(courseData)) {
        throw new Error('The session or course API returned an invalid response.');
      }
      setSessions(sessionData);
      setCourses(courseData);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Could not load live sessions.');
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
      courseId: '',
      faculty: '',
      date: '',
      startTime: '',
      endTime: '',
      meetingLink: '',
      description: '',
      status: 'Draft',
    });
    setFormError('');
    setShowModal(true);
  };

  const handleOpenEdit = (session: any) => {
    setEditingSession(session);
    setFormData({
      title: session.title || '',
      courseId: session.courseId || '',
      faculty: session.faculty || '',
      date: session.date || '',
      startTime: session.startTime || '',
      endTime: session.endTime || '',
      meetingLink: session.meetingLink || '',
      description: session.description || '',
      status: session.status || 'Draft',
    });
    setFormError('');
    setShowModal(true);
  };

  const handleToggleStatus = async (session: any) => {
    const nextStatus = session.status === 'Published' ? 'Draft' : 'Published';
    try {
      await apiRequest(`/api/admin/live-sessions/${session.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: nextStatus }),
      });
      await fetchSessions();
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to update live session.');
    }
  };

  const handleCancel = async (session: any) => {
    if (session.status === 'Cancelled' || !confirm('Cancel this scheduled class? The record will be preserved.')) return;
    try {
      await apiRequest(`/api/admin/live-sessions/${session.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'Cancelled' }),
      });
      await fetchSessions();
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to cancel live session.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);
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
      await fetchSessions();
    } catch (err: any) {
      setFormError(err.message || 'Error saving session.');
    } finally {
      setSaving(false);
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
            Schedule and publish course-specific live sessions. Only published sessions with valid meeting links are shown to eligible students.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          disabled={courses.length === 0 || loading}
          title={courses.length === 0 ? 'Create a course before scheduling a session.' : undefined}
          className="btn-primary text-xs px-4 py-2.5 flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule New Live Class</span>
        </button>
      </div>

      {loadError && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {loadError}
        </p>
      )}
      {courses.length === 0 && !loading && !loadError && (
        <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Create a course before scheduling a course-specific live session.
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-3 text-center py-12 text-gray-400 text-xs">
            Loading scheduled classes...
          </div>
        ) : sessions.length === 0 && !loadError ? (
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
                    {session.courseName || courses.find((course) => course.id === session.courseId)?.name || `${session.exam || 'GATE'} • ${session.subject || 'Course'}`}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      session.status === 'Published'
                        ? 'bg-red-50 text-red-700 border-red-200'
                        : session.status === 'Cancelled'
                          ? 'bg-gray-100 text-gray-600 border-gray-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
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
                  {session.meetingLink && (
                    <a
                      href={session.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary-700 hover:underline"
                    >
                      Open meeting link <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
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
                    onClick={() => handleCancel(session)}
                    disabled={session.status === 'Cancelled'}
                    className="rounded-lg px-2 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                    title="Cancel Session"
                  >
                    Cancel
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

              <div>
                <label className="block font-bold text-gray-700 mb-1" htmlFor="session-course">Course</label>
                <select
                  id="session-course"
                  required={!editingSession?.courseId}
                  value={formData.courseId}
                  onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                  className="select-field text-xs py-2"
                >
                  <option value="">Select a course</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.name} · {course.subject}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Faculty Name</label>
                <input
                  type="text"
                  value={formData.faculty}
                  onChange={(e) => setFormData({ ...formData, faculty: e.target.value })}
                  placeholder="Faculty name (optional)"
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
                <label className="block font-bold text-gray-700 mb-1">Meeting Link</label>
                <input
                  type="url"
                  required={formData.status === 'Published'}
                  value={formData.meetingLink}
                  onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
                  placeholder="https://..."
                  className="input-field text-xs py-2 font-mono"
                />
                <p className="mt-1 text-[10px] text-gray-500">Use a real HTTPS meeting URL. It is required before publishing; drafts may be saved without a link.</p>
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

              <div>
                <label className="block font-bold text-gray-700 mb-1">Publication Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="select-field text-xs py-2"
                >
                  <option value="Draft">Draft</option>
                  <option value="Published">Published</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              {formError && (
                <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  {formError}
                </p>
              )}

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary text-xs px-4 py-2"
                >
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn-primary text-xs px-5 py-2 font-bold disabled:cursor-wait disabled:opacity-60">
                  {saving ? 'Saving…' : editingSession ? 'Update Class' : 'Schedule Class'}
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

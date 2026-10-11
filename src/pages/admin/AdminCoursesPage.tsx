import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../utils/api';
import {
  BookOpen,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Users,
  Sparkles,
  Calendar,
  X
} from 'lucide-react';

export const AdminCoursesPage: React.FC = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    exam: 'GATE',
    subject: 'Chemistry',
    description: '',
    duration: '100 Days Intensive',
    startDate: '2026-11-01',
    fee: 10000,
    refundAmount: 2000,
    status: 'Published',
  });

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const data = await apiRequest('/api/admin/courses');
      setCourses(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleOpenCreate = () => {
    setEditingCourse(null);
    setFormData({
      name: '',
      exam: 'GATE',
      subject: 'Chemistry',
      description: '',
      duration: '100 Days Intensive',
      startDate: '2026-11-01',
      fee: 10000,
      refundAmount: 2000,
      status: 'Published',
    });
    setShowModal(true);
  };

  const handleOpenEdit = (course: any) => {
    setEditingCourse(course);
    setFormData({
      name: course.name,
      exam: course.exam,
      subject: course.subject,
      description: course.description,
      duration: course.duration,
      startDate: course.startDate,
      fee: course.fee,
      refundAmount: course.refundAmount,
      status: course.status,
    });
    setShowModal(true);
  };

  const handleTogglePublish = async (course: any) => {
    const nextStatus = course.status === 'Published' ? 'Draft' : 'Published';
    try {
      await apiRequest(`/api/admin/courses/${course.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: nextStatus }),
      });
      fetchCourses();
    } catch (err) {
      alert('Failed to update course status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this course program?')) return;
    try {
      await apiRequest(`/api/admin/courses/${id}`, { method: 'DELETE' });
      fetchCourses();
    } catch (err) {
      alert('Failed to delete course');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCourse) {
        await apiRequest(`/api/admin/courses/${editingCourse.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData),
        });
      } else {
        await apiRequest('/api/admin/courses', {
          method: 'POST',
          body: JSON.stringify(formData),
        });
      }
      setShowModal(false);
      fetchCourses();
    } catch (err: any) {
      alert(err.message || 'Error saving course');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-navy-500">
            Course Management
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Create, publish, and configure GATE preparation programs for Chemistry and Physics.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="btn-primary text-xs px-4 py-2.5 flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Course</span>
        </button>
      </div>

      {/* Course Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-3 text-center py-12 text-gray-400 text-xs">
            Loading course catalog...
          </div>
        ) : courses.length === 0 ? (
          <div className="col-span-3 rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
            <BookOpen className="w-8 h-8 text-primary-500 mx-auto mb-3" />
            <h2 className="text-sm font-bold text-navy-500">No courses yet</h2>
            <p className="text-xs text-gray-500 mt-1 mb-4">Create a course to add it to Course Management.</p>
            <button onClick={handleOpenCreate} className="btn-primary text-xs px-4 py-2">
              Create New Course
            </button>
          </div>
        ) : courses.map((course) => (
          <div
            key={course.id}
            className="card p-6 flex flex-col justify-between hover:border-primary-300 transition-all border border-gray-200"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-primary-50 text-primary-600 border border-primary-200">
                  {course.exam} • {course.subject}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    course.status === 'Published'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-gray-100 text-gray-600 border-gray-200'
                  }`}
                >
                  {course.status}
                </span>
              </div>

              <h3 className="font-bold text-lg text-navy-500 mb-2 leading-snug">
                {course.name}
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed mb-4 line-clamp-3">
                {course.description}
              </p>

              <div className="space-y-1.5 py-3 border-t border-b border-gray-100 text-xs text-gray-600 mb-4">
                <div className="flex justify-between">
                  <span>Duration:</span>
                  <strong>{course.duration}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Start Date:</span>
                  <strong>{course.startDate}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Standard Fee:</span>
                  <strong className="text-navy-500">₹{course.fee.toLocaleString()}</strong>
                </div>
                <div className="flex justify-between text-emerald-700">
                  <span>Performance Refund:</span>
                  <strong>₹{course.refundAmount.toLocaleString()} (20%)</strong>
                </div>
                <div className="flex justify-between text-primary-600">
                  <span>Enrolled Aspirants:</span>
                  <strong>{course.enrolledCount} Students</strong>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <button
                onClick={() => handleTogglePublish(course)}
                className="text-xs font-semibold text-gray-500 hover:text-navy-500"
              >
                {course.status === 'Published' ? 'Unpublish' : 'Publish'}
              </button>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleOpenEdit(course)}
                  className="p-1.5 rounded-lg text-gray-500 hover:text-primary-600 hover:bg-gray-100"
                  title="Edit Course"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(course.id)}
                  className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50"
                  title="Delete Course"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="text-xl font-bold text-navy-500">
                {editingCourse ? 'Edit Course Program' : 'Create New Course Program'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Course Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. GATE Chemistry — 100 Day Program"
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
                <label className="block font-bold text-gray-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-field text-xs py-2 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Duration</label>
                  <input
                    type="text"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    className="input-field text-xs py-2"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="input-field text-xs py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Fee (₹)</label>
                  <input
                    type="number"
                    value={formData.fee}
                    onChange={(e) => setFormData({ ...formData, fee: Number(e.target.value) })}
                    className="input-field text-xs py-2"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Refund Amount (₹)</label>
                  <input
                    type="number"
                    value={formData.refundAmount}
                    onChange={(e) => setFormData({ ...formData, refundAmount: Number(e.target.value) })}
                    className="input-field text-xs py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="select-field text-xs py-2"
                >
                  <option value="Published">Published</option>
                  <option value="Draft">Draft</option>
                </select>
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
                  {editingCourse ? 'Save Changes' : 'Create Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCoursesPage;

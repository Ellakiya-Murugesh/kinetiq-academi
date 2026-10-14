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
  X,
  ChevronUp,
  ChevronDown
} from 'lucide-react';

const COURSE_SUBJECT_OPTIONS = [
  'Chemistry',
  'Physics',
  'Mechanical Engineering',
  'Computer Science Engineering (CSE)',
  'Electronics and Communication Engineering (ECE)',
];

function isDateInputValue(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(`${value}T00:00:00`));
}

export const AdminCoursesPage: React.FC = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any | null>(null);
  const [loadError, setLoadError] = useState('');
  const [formError, setFormError] = useState('');
  const [savedMessage, setSavedMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [statusChanged, setStatusChanged] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    exam: 'GATE',
    subject: 'Chemistry',
    description: '',
    duration: '',
    startDate: '',
    fee: 0,
    refundAmount: 0,
    status: 'Draft',
    modules: [] as any[],
  });

  const fetchCourses = async (): Promise<any[] | null> => {
    try {
      setLoading(true);
      setLoadError('');
      const data = await apiRequest('/api/admin/courses');
      if (!Array.isArray(data)) throw new Error('The course API returned an invalid response.');
      setCourses(data);
      return data;
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Could not load courses.');
      return null;
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
      duration: '',
      startDate: '',
      fee: 0,
      refundAmount: 0,
      status: 'Draft',
      modules: [],
    });
    setStatusChanged(false);
    setFormError('');
    setSavedMessage('');
    setShowModal(true);
  };

  const handleOpenEdit = (course: any) => {
    setEditingCourse(course);
    setFormData({
      name: course.name ?? '',
      exam: course.exam ?? 'GATE',
      subject: course.subject ?? 'Chemistry',
      description: course.description ?? '',
      duration: course.duration ?? '',
      startDate: course.startDate ?? '',
      fee: course.fee ?? 0,
      refundAmount: course.refundAmount ?? 0,
      status: course.status === 'Published' ? 'Published' : 'Draft',
      modules: Array.isArray(course.modules)
        ? course.modules.map((module: any) => ({
          ...module,
          status: module.status === 'Draft' ? 'Draft' : 'Published',
          lessons: Array.isArray(module.lessons)
            ? module.lessons.map((lesson: any) => ({
              ...lesson,
              status: lesson.status === 'Draft' ? 'Draft' : 'Published',
            }))
            : [],
        }))
        : [],
    });
    setStatusChanged(false);
    setFormError('');
    setSavedMessage('');
    setShowModal(true);
  };

  const handleTogglePublish = async (course: any) => {
    const nextStatus = ['Published', 'Active'].includes(course.status) ? 'Draft' : 'Published';
    try {
      await apiRequest(`/api/admin/courses/${course.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: nextStatus }),
      });
      await fetchCourses();
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to update course status.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this course program?')) return;
    try {
      await apiRequest(`/api/admin/courses/${id}`, { method: 'DELETE' });
      await fetchCourses();
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to delete course.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      let savedCourseId: string;
      let savedCourse: any;
      const coursePayload = { ...formData };
      if (editingCourse?.status === 'Active' && !statusChanged) {
        delete (coursePayload as Partial<typeof formData>).status;
      }
      if (editingCourse) {
        savedCourse = await apiRequest(`/api/admin/courses/${editingCourse.id}`, {
          method: 'PUT',
          body: JSON.stringify(coursePayload),
        });
        if (!savedCourse || savedCourse.id !== editingCourse.id) {
          throw new Error('The server did not confirm the course update.');
        }
        savedCourseId = savedCourse.id;
      } else {
        savedCourse = await apiRequest('/api/admin/courses', {
          method: 'POST',
          body: JSON.stringify(coursePayload),
        });
        if (!savedCourse?.id) {
          throw new Error('The server did not confirm course creation.');
        }
        savedCourseId = savedCourse.id;
      }
      const refreshedCourses = await fetchCourses();
      const refreshedCourse = refreshedCourses?.find((course) => course.id === savedCourseId);
      const persistedFields = ['name', 'exam', 'subject', 'description', 'duration', 'startDate', 'fee', 'refundAmount', 'status', 'modules'];
      if (!refreshedCourse || !persistedFields.every((field) =>
        JSON.stringify(refreshedCourse[field]) === JSON.stringify(savedCourse[field])
      )) {
        throw new Error('The course was saved, but the refreshed course list could not be verified.');
      }
      setShowModal(false);
      setSavedMessage('Course changes saved successfully.');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Error saving course.');
    } finally {
      setSaving(false);
    }
  };

  const updateModule = (moduleIndex: number, updates: Record<string, unknown>) => {
    setFormData((current) => ({
      ...current,
      modules: current.modules.map((module, index) =>
        index === moduleIndex ? { ...module, ...updates } : module
      ),
    }));
  };

  const updateLesson = (moduleIndex: number, lessonIndex: number, title: string) => {
    setFormData((current) => ({
      ...current,
      modules: current.modules.map((module, index) => index === moduleIndex
        ? {
          ...module,
          lessons: module.lessons.map((lesson: any, itemIndex: number) =>
            itemIndex === lessonIndex ? { ...lesson, title } : lesson
          ),
        }
        : module
      ),
    }));
  };

  const moveModule = (moduleIndex: number, offset: number) => {
    setFormData((current) => {
      const nextIndex = moduleIndex + offset;
      if (nextIndex < 0 || nextIndex >= current.modules.length) return current;
      const modules = [...current.modules];
      [modules[moduleIndex], modules[nextIndex]] = [modules[nextIndex], modules[moduleIndex]];
      return { ...current, modules };
    });
  };

  const moveLesson = (moduleIndex: number, lessonIndex: number, offset: number) => {
    setFormData((current) => ({
      ...current,
      modules: current.modules.map((module, index) => {
        if (index !== moduleIndex) return module;
        const nextIndex = lessonIndex + offset;
        if (nextIndex < 0 || nextIndex >= module.lessons.length) return module;
        const lessons = [...module.lessons];
        [lessons[lessonIndex], lessons[nextIndex]] = [lessons[nextIndex], lessons[lessonIndex]];
        return { ...module, lessons };
      }),
    }));
  };

  return (
    <div className="space-y-6">
      {savedMessage && (
        <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {savedMessage}
        </p>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-navy-500">
            Course Management
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Create and maintain GATE courses, modules, lessons, and publication status.
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
      {loadError && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {loadError}
        </p>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-3 text-center py-12 text-gray-400 text-xs">
            Loading course catalog...
          </div>
        ) : courses.length === 0 && !loadError ? (
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
                    ['Published', 'Active'].includes(course.status)
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-gray-100 text-gray-600 border-gray-200'
                  }`}
                >
                  {course.status === 'Active' ? 'Active · legacy course' : course.status}
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
                  <strong className="text-navy-500">₹{Number(course.fee || 0).toLocaleString()}</strong>
                </div>
                <div className="flex justify-between text-emerald-700">
                  <span>Performance Refund:</span>
                  <strong>₹{Number(course.refundAmount || 0).toLocaleString()}</strong>
                </div>
                <div className="flex justify-between text-primary-600">
                  <span>Enrolled Aspirants:</span>
                  <strong>{Number(course.enrolledCount || 0)} Students</strong>
                </div>
                <div className="flex justify-between">
                  <span>Curriculum:</span>
                  <strong>
                    {Array.isArray(course.modules) ? course.modules.length : 0} modules ·{' '}
                    {Array.isArray(course.modules)
                      ? course.modules.reduce((total: number, module: any) =>
                        total + (Array.isArray(module.lessons) ? module.lessons.length : 0), 0)
                      : 0} lessons
                  </strong>
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
                    <option value="Mechanical Engineering">Mechanical Engineering</option>
                    <option value="Computer Science Engineering (CSE)">Computer Science Engineering (CSE)</option>
                    <option value="Electronics and Communication Engineering (ECE)">Electronics and Communication Engineering (ECE)</option>
                    {editingCourse && !COURSE_SUBJECT_OPTIONS.includes(formData.subject) && (
                      <option value={formData.subject}>{formData.subject} (existing course)</option>
                    )}
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

              <section className="space-y-3 rounded-2xl border border-gray-200 bg-gray-50 p-4" aria-labelledby="course-curriculum-heading">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h4 id="course-curriculum-heading" className="font-bold text-navy-500">Course Curriculum</h4>
                    <p className="mt-0.5 text-[11px] text-gray-500">Add the syllabus modules and lessons students will see.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData((current) => ({
                      ...current,
                      modules: [...current.modules, { title: '', status: 'Draft', lessons: [] }],
                    }))}
                    className="shrink-0 rounded-lg border border-primary-200 bg-white px-3 py-2 text-[11px] font-bold text-primary-700"
                  >
                    Add module
                  </button>
                </div>

                {formData.modules.map((module, moduleIndex) => (
                  <div key={module.id || `module-${moduleIndex}`} className="space-y-2 rounded-xl border border-gray-200 bg-white p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="sr-only" htmlFor={`course-module-${moduleIndex}`}>Module title</label>
                      <input
                        id={`course-module-${moduleIndex}`}
                        type="text"
                        required
                        value={module.title || ''}
                        onChange={(event) => updateModule(moduleIndex, { title: event.target.value })}
                        placeholder={`Module ${moduleIndex + 1} title`}
                        className="input-field min-w-0 flex-1 text-xs py-2"
                      />
                      <button
                        type="button"
                        onClick={() => moveModule(moduleIndex, -1)}
                        disabled={moduleIndex === 0}
                        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-30"
                        aria-label={`Move module ${moduleIndex + 1} up`}
                      >
                        <ChevronUp className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveModule(moduleIndex, 1)}
                        disabled={moduleIndex === formData.modules.length - 1}
                        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-30"
                        aria-label={`Move module ${moduleIndex + 1} down`}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </button>
                      <select
                        aria-label={`Module ${moduleIndex + 1} publication status`}
                        value={module.status || 'Draft'}
                        onChange={(event) => updateModule(moduleIndex, { status: event.target.value })}
                        className="select-field w-28 text-[11px] py-2"
                      >
                        <option value="Draft">Draft</option>
                        <option value="Published">Published</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => setFormData((current) => ({
                          ...current,
                          modules: current.modules.filter((_, index) => index !== moduleIndex),
                        }))}
                        className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                        aria-label={`Remove module ${moduleIndex + 1}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    {module.lessons.map((lesson: any, lessonIndex: number) => (
                      <div key={lesson.id || `lesson-${moduleIndex}-${lessonIndex}`} className="ml-3 flex flex-wrap items-center gap-2">
                        <label className="sr-only" htmlFor={`course-module-${moduleIndex}-lesson-${lessonIndex}`}>Lesson title</label>
                        <input
                          id={`course-module-${moduleIndex}-lesson-${lessonIndex}`}
                          type="text"
                          required
                          value={lesson.title || ''}
                          onChange={(event) => updateLesson(moduleIndex, lessonIndex, event.target.value)}
                          placeholder={`Lesson ${lessonIndex + 1} title`}
                          className="input-field min-w-0 flex-1 text-xs py-2"
                        />
                        <button
                          type="button"
                          onClick={() => moveLesson(moduleIndex, lessonIndex, -1)}
                          disabled={lessonIndex === 0}
                          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-30"
                          aria-label={`Move lesson ${lessonIndex + 1} up`}
                        >
                          <ChevronUp className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveLesson(moduleIndex, lessonIndex, 1)}
                          disabled={lessonIndex === module.lessons.length - 1}
                          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-30"
                          aria-label={`Move lesson ${lessonIndex + 1} down`}
                        >
                          <ChevronDown className="h-4 w-4" />
                        </button>
                        <select
                          aria-label={`Lesson ${lessonIndex + 1} publication status`}
                          value={lesson.status || 'Draft'}
                          onChange={(event) => updateModule(moduleIndex, {
                            lessons: module.lessons.map((item: any, index: number) =>
                              index === lessonIndex ? { ...item, status: event.target.value } : item
                            ),
                          })}
                          className="select-field w-28 text-[11px] py-2"
                        >
                          <option value="Draft">Draft</option>
                          <option value="Published">Published</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => updateModule(moduleIndex, {
                            lessons: module.lessons.filter((_: any, index: number) => index !== lessonIndex),
                          })}
                          className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                          aria-label={`Remove lesson ${lessonIndex + 1}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => updateModule(moduleIndex, {
                        lessons: [...module.lessons, { title: '', status: 'Draft' }],
                      })}
                      className="ml-3 text-[11px] font-bold text-primary-700 hover:underline"
                    >
                      Add lesson
                    </button>
                  </div>
                ))}
              </section>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Duration</label>
                  <input
                    type="text"
                    required
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="e.g. 100 Days"
                    className="input-field text-xs py-2"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    required={!editingCourse || isDateInputValue(formData.startDate)}
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="input-field text-xs py-2"
                  />
                  {editingCourse && !isDateInputValue(formData.startDate) && (
                    <p className="mt-1 text-[10px] text-gray-500">
                      This course has a legacy date value; leaving the field blank preserves it.
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Fee (₹)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.fee}
                    onChange={(e) => setFormData({ ...formData, fee: Number(e.target.value) })}
                    className="input-field text-xs py-2"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Refund Amount (₹)</label>
                  <input
                    type="number"
                    min="0"
                    required
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
                  onChange={(e) => {
                    setStatusChanged(true);
                    setFormData({ ...formData, status: e.target.value });
                  }}
                  className="select-field text-xs py-2"
                >
                  <option value="Draft">Draft</option>
                  <option value="Published">Published</option>
                </select>
                {editingCourse?.status === 'Active' && (
                  <div className="mt-1 text-[10px] text-gray-500">
                    <p>
                      Legacy Active remains unchanged when saving other fields. Choose a new status only after reviewing the curriculum.
                    </p>
                    {!statusChanged && (
                      <button
                        type="button"
                        onClick={() => setStatusChanged(true)}
                        className="mt-1 font-semibold text-primary-700 underline"
                      >
                        Apply Draft status
                      </button>
                    )}
                  </div>
                )}
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
                  {saving ? 'Saving…' : editingCourse ? 'Save Changes' : 'Create Course'}
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

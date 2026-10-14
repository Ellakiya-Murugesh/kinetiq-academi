import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../utils/api';
import { FileQuestion, Plus, Trash2, Edit, CheckCircle, Clock, Award, X, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface TestQuestionDraft {
  id: string;
  text: string;
  options: string[];
  correctOption: number;
  marks: number;
  negativeMarks: number;
  explanation: string;
}

const createTestQuestion = (negativeMarks = 0.33): TestQuestionDraft => ({
  id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  text: '',
  options: ['', '', '', ''],
  correctOption: 0,
  marks: 2,
  negativeMarks,
  explanation: '',
});

export const AdminTestsPage: React.FC = () => {
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTest, setEditingTest] = useState<any | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    exam: 'GATE',
    subject: 'Chemistry',
    duration: 60,
    totalQuestions: 15,
    totalMarks: 30,
    negativeMarking: 0.33,
    questions: [] as TestQuestionDraft[],
    startDate: new Date().toISOString().split('T')[0],
    endDate: '2026-11-30',
    status: 'Published',
  });

  const fetchTests = async () => {
    try {
      setLoading(true);
      const res = await apiRequest('/api/admin/tests');
      setTests(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTests();
  }, []);

  const handleOpenCreate = () => {
    setEditingTest(null);
    setFormData({
      name: '',
      exam: 'GATE',
      subject: 'Chemistry',
      duration: 60,
      totalQuestions: 15,
      totalMarks: 30,
      negativeMarking: 0.33,
      questions: [createTestQuestion()],
      startDate: new Date().toISOString().split('T')[0],
      endDate: '2026-11-30',
      status: 'Published',
    });
    setShowModal(true);
  };

  const handleOpenEdit = (t: any) => {
    setEditingTest(t);
    setFormData({
      ...t,
      questions: (t.questions || []).map((question: any) => ({
        id: question.id || createTestQuestion().id,
        text: question.text || question.question || '',
        options: question.options || ['', '', '', ''],
        correctOption: Number(question.correctOption ?? question.correctAnswer ?? 0),
        marks: Number(question.marks ?? 2),
        negativeMarks: Number(question.negativeMarks ?? t.negativeMarking ?? 0.33),
        explanation: question.explanation || '',
      })),
    });
    setShowModal(true);
  };

  const updateQuestion = (questionId: string, updates: Partial<TestQuestionDraft>) => {
    setFormData((current) => ({
      ...current,
      questions: current.questions.map((question) =>
        question.id === questionId ? { ...question, ...updates } : question
      ),
    }));
  };

  const addQuestion = () => {
    setFormData((current) => ({
      ...current,
      questions: [...current.questions, createTestQuestion(current.negativeMarking)],
    }));
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this examination test paper?')) return;
    try {
      await apiRequest(`/api/admin/tests/${id}`, { method: 'DELETE' });
      fetchTests();
    } catch (err) {
      alert('Failed to delete test');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.questions.length === 0) {
      alert('Add at least one question before saving the test.');
      return;
    }
    const incompleteQuestion = formData.questions.some(
      (question) => !question.text.trim() || question.options.length !== 4 || question.options.some((option) => !option.trim())
    );
    if (incompleteQuestion) {
      alert('Complete the question text and all four answer options before saving.');
      return;
    }

    const questions = formData.questions.map((question) => ({
      ...question,
      text: question.text.trim(),
      options: question.options.map((option) => option.trim()),
    }));
    const payload = {
      ...formData,
      questions,
      totalQuestions: questions.length,
      totalMarks: questions.reduce((total, question) => total + question.marks, 0),
    };

    try {
      if (editingTest) {
        await apiRequest(`/api/admin/tests/${editingTest.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await apiRequest('/api/admin/tests', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      setShowModal(false);
      fetchTests();
    } catch (err: any) {
      alert(err.message || 'Error saving test');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-navy-500">
            Test &amp; Exam Management
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Build mock test papers, set negative marking ratios, and configure timed CBT exam schedules.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="btn-primary text-xs px-4 py-2.5 flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Test</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-3 text-center py-12 text-gray-400 text-xs">
            Loading tests...
          </div>
        ) : (
          tests.map((test) => (
            <div
              key={test.id}
              className="card p-6 flex flex-col justify-between border border-gray-200 hover:border-primary-300 transition-all"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-navy-50 text-navy-600 border border-navy-100">
                    {test.exam} • {test.subject}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      test.status === 'Published'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-gray-100 text-gray-600 border-gray-200'
                    }`}
                  >
                    {test.status}
                  </span>
                </div>

                <h3 className="font-bold text-base text-navy-500 mb-2 leading-snug">
                  {test.name}
                </h3>

                <div className="space-y-1.5 py-3 border-t border-b border-gray-100 text-xs text-gray-600 mb-4">
                  <div className="flex justify-between">
                    <span>Duration:</span>
                    <strong>{test.duration} mins</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Questions:</span>
                    <strong>{test.totalQuestions} questions</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Marks:</span>
                    <strong className="text-navy-500">{test.totalMarks} marks</strong>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span>Negative Marking:</span>
                    <strong>-{test.negativeMarking} per wrong</strong>
                  </div>
                  <div className="flex justify-between text-gray-400 text-[11px]">
                    <span>Window:</span>
                    <span>{test.startDate} to {test.endDate}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <Link
                  to="/admin/results"
                  className="text-xs font-semibold text-primary-600 hover:underline flex items-center gap-1"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>View Submissions</span>
                </Link>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenEdit(test)}
                    className="p-1.5 rounded-lg text-gray-500 hover:text-primary-600 hover:bg-gray-100"
                    title="Edit Test"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(test.id)}
                    className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50"
                    title="Delete Test"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {!loading && tests.length === 0 && (
        <div className="-mt-4 rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-10 text-center">
          <FileQuestion className="w-8 h-8 text-primary-500 mx-auto mb-3" />
          <h2 className="text-sm font-bold text-navy-500">No tests created yet</h2>
          <p className="text-xs text-gray-500 mt-1">Create a test and add its questions before publishing it to students.</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-3xl w-full space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="text-xl font-bold text-navy-500">
                {editingTest ? 'Edit Test Configuration' : 'Create New Test'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Test Title</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Full Syllabus Mock Exam #1"
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

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Duration (Min)</label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                    className="input-field text-xs py-2"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Total Marks</label>
                  <input
                    type="number"
                    value={formData.totalMarks}
                    onChange={(e) => setFormData({ ...formData, totalMarks: Number(e.target.value) })}
                    className="input-field text-xs py-2"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Negative (Marks)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.negativeMarking}
                    onChange={(e) => {
                      const negativeMarking = Number(e.target.value);
                      setFormData((current) => ({
                        ...current,
                        negativeMarking,
                        questions: current.questions.map((question) => ({ ...question, negativeMarks: negativeMarking })),
                      }));
                    }}
                    className="input-field text-xs py-2"
                  />
                </div>
              </div>

              <section className="space-y-3 border-t border-gray-100 pt-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-navy-500">Questions ({formData.questions.length})</h4>
                    <p className="text-[11px] text-gray-500">Add four options and choose the correct answer for each question.</p>
                  </div>
                  <button type="button" onClick={addQuestion} className="btn-secondary px-3 py-2 text-xs inline-flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5" /> Add Question
                  </button>
                </div>

                {formData.questions.map((question, questionIndex) => (
                  <div key={question.id} className="rounded-xl border border-gray-200 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h5 className="font-bold text-navy-500">Question {questionIndex + 1}</h5>
                      <button
                        type="button"
                        onClick={() => setFormData((current) => ({ ...current, questions: current.questions.filter((item) => item.id !== question.id) }))}
                        className="text-xs font-semibold text-red-600 hover:text-red-700 disabled:text-gray-300"
                        disabled={formData.questions.length === 1}
                      >
                        Remove
                      </button>
                    </div>
                    <textarea
                      required
                      rows={2}
                      value={question.text}
                      onChange={(event) => updateQuestion(question.id, { text: event.target.value })}
                      placeholder="Enter the question"
                      className="input-field text-xs py-2"
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {question.options.map((option, optionIndex) => (
                        <label key={optionIndex} className="text-[11px] font-semibold text-gray-600">
                          Option {String.fromCharCode(65 + optionIndex)}
                          <input
                            required
                            value={option}
                            onChange={(event) => {
                              const options = [...question.options];
                              options[optionIndex] = event.target.value;
                              updateQuestion(question.id, { options });
                            }}
                            className="input-field text-xs py-2 mt-1"
                          />
                        </label>
                      ))}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <label className="text-[11px] font-semibold text-gray-600">
                        Correct Option
                        <select
                          value={question.correctOption}
                          onChange={(event) => updateQuestion(question.id, { correctOption: Number(event.target.value) })}
                          className="select-field text-xs py-2 mt-1"
                        >
                          {question.options.map((_, optionIndex) => (
                            <option key={optionIndex} value={optionIndex}>Option {String.fromCharCode(65 + optionIndex)}</option>
                          ))}
                        </select>
                      </label>
                      <label className="text-[11px] font-semibold text-gray-600">
                        Marks
                        <input
                          type="number"
                          min="0.5"
                          step="0.5"
                          value={question.marks}
                          onChange={(event) => updateQuestion(question.id, { marks: Number(event.target.value) })}
                          className="input-field text-xs py-2 mt-1"
                        />
                      </label>
                      <label className="text-[11px] font-semibold text-gray-600">
                        Negative Marks
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={question.negativeMarks}
                          onChange={(event) => updateQuestion(question.id, { negativeMarks: Number(event.target.value) })}
                          className="input-field text-xs py-2 mt-1"
                        />
                      </label>
                    </div>
                    <textarea
                      rows={2}
                      value={question.explanation}
                      onChange={(event) => updateQuestion(question.id, { explanation: event.target.value })}
                      placeholder="Explanation shown after submission (optional)"
                      className="input-field text-xs py-2"
                    />
                  </div>
                ))}
              </section>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="input-field text-xs py-2"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
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
                  {editingTest ? 'Save Changes' : 'Create Test'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTestsPage;

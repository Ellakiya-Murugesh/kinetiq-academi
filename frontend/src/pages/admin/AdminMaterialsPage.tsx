import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../utils/api';
import { GATE_MATERIAL_SUBJECTS } from '../../data/gateMaterialSubjects';
import { Plus, Trash2, Edit, Lock, Globe, FileText, X } from 'lucide-react';

export const AdminMaterialsPage: React.FC = () => {
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMat, setEditingMat] = useState<any | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    exam: 'GATE',
    subject: 'Chemistry',
    category: 'Study Notes',
    description: '',
    fileUrl: '',
    fileSize: '4.5 MB',
    pages: 40,
    accessLevel: 'Enrolled Students Only',
    status: 'Published',
  });

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const res = await apiRequest('/api/admin/materials');
      setMaterials(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  const handleOpenCreate = () => {
    setEditingMat(null);
    setFormData({
      title: '',
      exam: 'GATE',
      subject: 'Chemistry',
      category: 'Study Notes',
      description: '',
      fileUrl: '',
      fileSize: '4.5 MB',
      pages: 40,
      accessLevel: 'Enrolled Students Only',
      status: 'Published',
    });
    setShowModal(true);
  };

  const handleOpenEdit = (m: any) => {
    setEditingMat(m);
    setFormData({ ...m, fileUrl: m.fileUrl || '' });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this study resource?')) return;
    try {
      await apiRequest(`/api/admin/materials/${id}`, { method: 'DELETE' });
      fetchMaterials();
    } catch (err) {
      alert('Failed to delete material');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingMat) {
        await apiRequest(`/api/admin/materials/${editingMat.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData),
        });
      } else {
        await apiRequest('/api/admin/materials', {
          method: 'POST',
          body: JSON.stringify(formData),
        });
      }
      setShowModal(false);
      fetchMaterials();
    } catch (err: any) {
      alert(err.message || 'Error saving material');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-navy-500">
            Study Material Management
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Upload PDFs, manage access levels, and organize notes, PYQs, and revision sheets.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="btn-primary text-xs px-4 py-2.5 flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Upload New Resource</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Title</th>
                <th className="py-3 px-4">Exam &amp; Subject</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Pages / Size</th>
                <th className="py-3 px-4">Access Level</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400">
                    Loading digital documents...
                  </td>
                </tr>
              ) : materials.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <p className="text-sm font-bold text-navy-500">No study materials yet</p>
                    <p className="text-xs text-gray-500 mt-1">Upload a new resource to populate the library.</p>
                  </td>
                </tr>
              ) : (
                materials.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-3 px-4 font-bold text-navy-500 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary-500 shrink-0" />
                      <span>{m.title}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-navy-500">{m.exam}</span>
                      <span className="text-[10px] text-gray-400 ml-1">({m.subject})</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-navy-50 text-navy-600 text-[10px] font-semibold">
                        {m.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-500">
                      {m.pages} pgs • {m.fileSize}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          m.accessLevel === 'Enrolled Students Only'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        {m.accessLevel === 'Enrolled Students Only' ? (
                          <Lock className="w-3 h-3" />
                        ) : (
                          <Globe className="w-3 h-3" />
                        )}
                        <span>{m.accessLevel}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        {m.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1">
                      <button
                        onClick={() => handleOpenEdit(m)}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-primary-600 hover:bg-gray-100"
                        title="Edit Resource"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(m.id)}
                        className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50"
                        title="Delete Resource"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="text-xl font-bold text-navy-500">
                {editingMat ? 'Edit Study Resource' : 'Upload Study Resource'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Document Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Inorganic Chemistry Master Formula Sheet"
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
                    {GATE_MATERIAL_SUBJECTS.map((subject) => (
                      <option key={subject.value} value={subject.value}>{subject.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="select-field text-xs py-2"
                  >
                    <option value="Study Notes">Study Notes</option>
                    <option value="Revision Notes">Revision Notes</option>
                    <option value="Previous-Year Papers">Previous-Year Papers</option>
                    <option value="Practice Sets">Practice Sets</option>
                    <option value="Mock Tests">Mock Tests</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Access Level</label>
                  <select
                    value={formData.accessLevel}
                    onChange={(e) => setFormData({ ...formData, accessLevel: e.target.value })}
                    className="select-field text-xs py-2"
                  >
                    <option value="Enrolled Students Only">Enrolled Students Only</option>
                    <option value="Public">Public (Free Sample)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-field text-xs py-2 resize-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Study Material File URL</label>
                <input
                  type="text"
                  required
                  value={formData.fileUrl}
                  onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
                  placeholder="HTTPS URL or site-relative file path"
                  className="input-field text-xs py-2"
                />
                <p className="mt-1 text-[10px] text-gray-500">
                  Use an HTTPS link or a real file served from this site. No sample file is prefilled.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Page Count</label>
                  <input
                    type="number"
                    value={formData.pages}
                    onChange={(e) => setFormData({ ...formData, pages: Number(e.target.value) })}
                    className="input-field text-xs py-2"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">File Size</label>
                  <input
                    type="text"
                    value={formData.fileSize}
                    onChange={(e) => setFormData({ ...formData, fileSize: e.target.value })}
                    className="input-field text-xs py-2"
                  />
                </div>
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
                  {editingMat ? 'Update Resource' : 'Save Resource'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMaterialsPage;

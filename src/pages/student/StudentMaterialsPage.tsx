import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../utils/api';
import { FolderDown, Search, Download, Eye, FileText, CheckCircle2, X } from 'lucide-react';

export const StudentMaterialsPage: React.FC = () => {
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [examTab, setExamTab] = useState<'All' | 'GATE' | 'UGC NET' | 'CSIR NET'>('All');
  const [subjectFilter, setSubjectFilter] = useState<'All' | 'Chemistry' | 'Physics'>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [previewDoc, setPreviewDoc] = useState<any | null>(null);

  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        setLoading(true);
        const res = await apiRequest('/api/student/materials');
        setMaterials(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMaterials();
  }, []);

  const categories = [
    'All',
    'Study Notes',
    'Revision Notes',
    'Previous-Year Papers',
    'Practice Sets',
    'Mock Tests',
  ];

  const filtered = materials.filter((m) => {
    const matchExam = examTab === 'All' || m.exam === examTab;
    const matchSubject = subjectFilter === 'All' || m.subject === subjectFilter;
    const matchCategory = categoryFilter === 'All' || m.category === categoryFilter;
    const matchSearch =
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      m.description.toLowerCase().includes(search.toLowerCase());

    return matchExam && matchSubject && matchCategory && matchSearch;
  });

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-navy-500">
          Enrolled Study Notes &amp; Question Banks
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Complete unlocked digital library: lecture notes, formula reference sheets, and 10-year solved PYQs.
        </p>
      </div>

      {/* Filter Tabs & Search */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Exam Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
            {(['All', 'GATE', 'UGC NET', 'CSIR NET'] as const).map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => setExamTab(ex)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  examTab === ex
                    ? 'bg-primary-500 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {ex === 'All' ? 'All Exams' : ex}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search documents or topics..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-10 text-xs py-2 w-full"
            />
          </div>
        </div>

        {/* Subject & Category Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-400 uppercase">Subject:</span>
            {(['All', 'Chemistry', 'Physics'] as const).map((sub) => (
              <button
                key={sub}
                type="button"
                onClick={() => setSubjectFilter(sub)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                  subjectFilter === sub
                    ? 'bg-navy-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {sub}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap ${
                  categoryFilter === cat
                    ? 'bg-primary-50 text-primary-600 font-bold border border-primary-200'
                    : 'text-gray-400 hover:text-navy-500'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Materials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-3 text-center py-12 text-xs text-gray-400">Loading resources...</div>
        ) : filtered.length === 0 ? (
          <div className="col-span-3 bg-white p-8 rounded-2xl text-center text-xs text-gray-400 border border-gray-200">
            No matching materials found.
          </div>
        ) : (
          filtered.map((mat) => (
            <div
              key={mat.id}
              className="card p-5 border border-gray-200 flex flex-col justify-between hover:border-primary-300 transition-all"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-navy-50 text-navy-600">
                    {mat.category}
                  </span>
                  <span className="text-[11px] text-gray-400 font-mono">
                    {mat.pages} pgs • {mat.fileSize}
                  </span>
                </div>

                <div className="flex items-start gap-2.5 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center shrink-0 mt-0.5">
                    <FileText className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-sm text-navy-500 leading-snug">
                    {mat.title}
                  </h4>
                </div>

                <p className="text-xs text-gray-500 line-clamp-3 mb-4">
                  {mat.description}
                </p>

                <div className="text-[11px] text-gray-400 mb-2">
                  Target: <strong>{mat.exam} ({mat.subject})</strong>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewDoc(mat)}
                  className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1 font-semibold"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View Online</span>
                </button>

                <button
                  type="button"
                  onClick={() => alert(`Starting download for ${mat.title} (${mat.fileSize})`)}
                  className="btn-primary text-xs py-1.5 px-3.5 flex items-center gap-1 font-semibold shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Document Reader Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-lg font-bold text-navy-500">
                {previewDoc.title}
              </h3>
              <button onClick={() => setPreviewDoc(null)} className="p-1.5 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8 bg-gray-50 rounded-2xl border border-gray-200 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center mx-auto">
                <FileText className="w-7 h-7" />
              </div>
              <p className="text-xs font-mono text-gray-500">
                [IN-BROWSER DOCUMENT VIEWER: {previewDoc.fileUrl}]
              </p>
              <p className="text-xs text-gray-600">
                {previewDoc.pages} Pages of high-yield study notes and solved problem sets.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setPreviewDoc(null)} className="btn-secondary text-xs px-4 py-2">
                Close Viewer
              </button>
              <button
                onClick={() => {
                  alert(`Downloading ${previewDoc.title}`);
                  setPreviewDoc(null);
                }}
                className="btn-primary text-xs px-5 py-2 flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentMaterialsPage;

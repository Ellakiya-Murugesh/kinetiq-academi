import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ApiRequestError, apiRequest } from '../../utils/api';
import { GATE_MATERIAL_SUBJECTS, type GateMaterialSubject } from '../../data/gateMaterialSubjects';
import { Search, Download, Eye, FileText } from 'lucide-react';

function canonicalSubject(subject: unknown): string {
  const normalized = String(subject ?? '').trim().toLowerCase().replace(/[\s_-]+/g, ' ');
  const aliases: Record<string, GateMaterialSubject> = {
    cse: 'CSE',
    'gate cse': 'CSE',
    'computer science engineering': 'CSE',
    'computer science engineering (cse)': 'CSE',
    'computer science and engineering': 'CSE',
    'computer science & information technology': 'CSE',
    it: 'IT',
    'information technology': 'IT',
    me: 'ME',
    'gate me': 'ME',
    mechanical: 'ME',
    'mechanical engineering': 'ME',
    ece: 'ECE',
    'gate ece': 'ECE',
    'electronics and communication engineering': 'ECE',
    'electronics and communication engineering (ece)': 'ECE',
    chemistry: 'Chemistry',
    'gate cy': 'Chemistry',
    physics: 'Physics',
    ph: 'Physics',
    'gate ph': 'Physics',
  };
  return aliases[normalized] || normalized;
}

export const StudentMaterialsPage: React.FC = () => {
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [needsLogin, setNeedsLogin] = useState(false);
  const [search, setSearch] = useState('');
  const [examTab, setExamTab] = useState<'All' | 'GATE'>('All');
  const [subjectFilter, setSubjectFilter] = useState<'All' | GateMaterialSubject>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  const fetchMaterials = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    setNeedsLogin(false);
    try {
      const response = await apiRequest<unknown>('/api/student/materials');
      if (!Array.isArray(response)) throw new Error('Invalid study materials response.');
      setMaterials(response);
    } catch (error) {
      const authorizationFailure = error instanceof ApiRequestError && [401, 403].includes(error.status);
      setNeedsLogin(authorizationFailure);
      setLoadError(authorizationFailure
        ? 'Your student session is no longer authorized. Sign in again to view study materials.'
        : 'Study materials are temporarily unavailable. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchMaterials();
  }, [fetchMaterials]);

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
    const matchSubject = subjectFilter === 'All' || canonicalSubject(m.subject) === subjectFilter;
    const matchCategory = categoryFilter === 'All' || m.category === categoryFilter;
    const query = search.toLocaleLowerCase();
    const matchSearch = [m.title, m.description]
      .some((value) => String(value || '').toLocaleLowerCase().includes(query));

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
            {(['All', 'GATE'] as const).map((ex) => (
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
          <div className="min-w-0 overflow-x-auto">
            <div className="flex w-max items-center gap-2">
              <span className="text-xs font-bold text-gray-400 uppercase">Subject:</span>
              {GATE_MATERIAL_SUBJECTS.map((subject) => (
                <button
                  key={subject.value}
                  type="button"
                  aria-pressed={subjectFilter === subject.value}
                  onClick={() => setSubjectFilter(subject.value)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${
                    subjectFilter === subject.value
                      ? 'bg-navy-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {subject.label}
                </button>
              ))}
            </div>
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
        ) : loadError ? (
          <div className="col-span-3 rounded-2xl border border-rose-100 bg-rose-50 p-8 text-center text-sm text-rose-800" role="alert">
            <p>{loadError}</p>
            {needsLogin
              ? <Link to="/login" className="mt-3 inline-block font-semibold underline">Sign in</Link>
              : <button type="button" onClick={() => void fetchMaterials()} className="mt-3 font-semibold underline">Retry</button>}
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-3 bg-white p-8 rounded-2xl text-center text-xs text-gray-400 border border-gray-200">
            {materials.length === 0 ? 'No study materials available yet.' : 'No matching materials found.'}
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
                  {mat.description || ''}
                </p>

                <div className="text-[11px] text-gray-400 mb-2">
                  Target: <strong>{mat.exam} ({mat.subject})</strong>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                {mat.fileUrl ? (
                  <>
                    <a
                      href={mat.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1 font-semibold"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Online</span>
                    </a>
                    <a
                      href={mat.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-primary text-xs py-1.5 px-3.5 flex items-center gap-1 font-semibold shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Open / Download</span>
                    </a>
                  </>
                ) : (
                  <span className="text-xs text-gray-400">File not available</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
};

export default StudentMaterialsPage;

import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../utils/api';
import { Award, Search, CheckCircle2, XCircle, HelpCircle, RefreshCw } from 'lucide-react';

export const AdminResultsPage: React.FC = () => {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchResults = async () => {
    try {
      setLoading(true);
      const res = await apiRequest('/api/admin/results');
      setResults(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, []);

  const filtered = results.filter(
    (r) =>
      r.studentName.toLowerCase().includes(search.toLowerCase()) ||
      r.testName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-navy-500">
            Student Test Results &amp; Analytics
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Review test attempt scores, accuracy breakdowns, correct/wrong answers, and candidate percentiles.
          </p>
        </div>

        <button
          onClick={fetchResults}
          className="btn-secondary text-xs px-3.5 py-2 flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-gray-200">
        <input
          type="text"
          placeholder="Filter by student name or test title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field text-xs py-2 max-w-md"
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Test Title</th>
                <th className="py-3 px-4">Score</th>
                <th className="py-3 px-4">Percentage</th>
                <th className="py-3 px-4">Correct</th>
                <th className="py-3 px-4">Wrong</th>
                <th className="py-3 px-4">Attempt Date</th>
                <th className="py-3 px-4 text-right">Performance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-400">
                    Loading student submission evaluations...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-400">
                    No result submissions found.
                  </td>
                </tr>
              ) : (
                filtered.map((res) => (
                  <tr key={res.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-3 px-4 font-bold text-navy-500">
                      {res.studentName}
                    </td>
                    <td className="py-3 px-4 text-gray-700">
                      {res.testName}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-navy-500">
                      {res.score} / {res.totalMarks}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          res.percentage >= 80
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : res.percentage >= 60
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {res.percentage}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-emerald-600 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{res.correctAnswers}</span>
                    </td>
                    <td className="py-3 px-4 text-red-500 font-semibold">
                      <div className="flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>{res.wrongAnswers}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-400">
                      {res.attemptDate}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                        Evaluated
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminResultsPage;

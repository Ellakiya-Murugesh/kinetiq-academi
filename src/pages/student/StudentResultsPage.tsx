import React, { useState, useEffect } from 'react';
import { 
  Award, TrendingUp, CheckCircle2, XCircle, AlertCircle, 
  BarChart3, Calendar, Search, Filter, BookOpen
} from 'lucide-react';
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, 
  Tooltip, CartesianGrid, AreaChart, Area 
} from 'recharts';
import { api } from '../../utils/api';

interface TestResult {
  id: string;
  testId: string;
  testTitle: string;
  score: number;
  totalMarks: number;
  percentage: number;
  correctAnswers: number;
  wrongAnswers: number;
  unattempted: number;
  attemptDate: string;
}

interface ResultsResponse {
  results: TestResult[];
}

export const StudentResultsPage: React.FC = () => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    setLoading(true);
    try {
      const res = await api.get<ResultsResponse>('/student/results');
      if (res.success && res.data) {
        setResults((res.data.results || []).map((result: any) => ({
          ...result,
          testTitle: result.testTitle || result.testName,
          attemptDate: result.attemptDate || result.submittedAt,
        })));
      }
    } catch (err) {
      console.error('Failed to load results:', err);
    } finally {
      setLoading(false);
    }
  };

  // Metrics
  const totalTests = results.length;
  const avgPercentage = totalTests > 0 
    ? Math.round(results.reduce((acc, r) => acc + r.percentage, 0) / totalTests) 
    : 0;
  const highestScore = totalTests > 0 
    ? Math.max(...results.map(r => r.percentage)) 
    : 0;
  const totalCorrect = results.reduce((acc, r) => acc + r.correctAnswers, 0);
  const totalWrong = results.reduce((acc, r) => acc + r.wrongAnswers, 0);
  const accuracy = (totalCorrect + totalWrong) > 0 
    ? Math.round((totalCorrect / (totalCorrect + totalWrong)) * 100) 
    : 0;

  // Chart data: chronologically sorted
  const chartData = [...results]
    .sort((a, b) => new Date(a.attemptDate).getTime() - new Date(b.attemptDate).getTime())
    .map((r, idx) => ({
      name: `Test #${idx + 1}`,
      title: r.testTitle,
      percentage: r.percentage,
      score: r.score,
      date: new Date(r.attemptDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    }));

  const filteredResults = results.filter(r => 
    r.testTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 mb-2">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Performance Analytics</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-[#00245C]">My Test Results & Scorecards</h1>
        <p className="text-sm text-gray-600 mt-1">
          Track your preparation trajectory across GATE, CSIR NET, and UGC NET mock examinations.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="text-xs font-semibold uppercase text-gray-400 mb-1">Total Attempted</div>
          <div className="text-2xl md:text-3xl font-black text-[#00245C]">{totalTests}</div>
          <div className="text-xs text-gray-500 mt-1">Mock test attempts</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="text-xs font-semibold uppercase text-gray-400 mb-1">Average Score</div>
          <div className="text-2xl md:text-3xl font-black text-[#00245C]">{avgPercentage}%</div>
          <div className="text-xs text-gray-500 mt-1">Overall percentage</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="text-xs font-semibold uppercase text-gray-400 mb-1">Peak Performance</div>
          <div className="text-2xl md:text-3xl font-black text-emerald-600">{highestScore}%</div>
          <div className="text-xs text-gray-500 mt-1">Highest percentage achieved</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="text-xs font-semibold uppercase text-gray-400 mb-1">Accuracy Ratio</div>
          <div className="text-2xl md:text-3xl font-black text-purple-600">{accuracy}%</div>
          <div className="text-xs text-gray-500 mt-1">Correct answers out of attempts</div>
        </div>
      </div>

      {/* Progress Chart */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-[#00245C]">Score Trend & Progression</h2>
              <p className="text-xs text-gray-500">Historical percentage over time</p>
            </div>
            <span className="px-3 py-1 bg-blue-50 text-[#00245C] rounded-full text-xs font-semibold">
              Target: 75%+
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00245C" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#00245C" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} domain={[0, 100]} tickLine={false} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-[#00245C] text-white p-3 rounded-xl shadow-lg text-xs space-y-1">
                          <p className="font-bold">{data.title}</p>
                          <p className="text-blue-300">Score: {data.score} marks ({data.percentage}%)</p>
                          <p className="text-gray-400">{data.date}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="percentage" 
                  stroke="#00245C" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#scoreGrad)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Historical Attempts Table */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h2 className="text-lg font-bold text-[#00245C] flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#00245C]" /> Detailed Test History
          </h2>

          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by test name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00245C] w-full md:w-64"
            />
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-gray-400 text-sm">Loading test records...</div>
        ) : filteredResults.length === 0 ? (
          <div className="py-12 text-center text-gray-500 text-sm">
            No test records found. Take mock tests from the Test Series tab!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs uppercase text-gray-400 border-b border-gray-100">
                <tr>
                  <th className="py-3 px-4">Test Title</th>
                  <th className="py-3 px-4">Score</th>
                  <th className="py-3 px-4">Percentage</th>
                  <th className="py-3 px-4">Correct</th>
                  <th className="py-3 px-4">Incorrect</th>
                  <th className="py-3 px-4">Unanswered</th>
                  <th className="py-3 px-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredResults.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50/60 transition">
                    <td className="py-3.5 px-4 font-semibold text-[#00245C]">
                      {r.testTitle}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-gray-800">
                      {r.score} / {r.totalMarks}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        r.percentage >= 65 
                          ? 'bg-emerald-50 text-emerald-700' 
                          : r.percentage >= 45 
                          ? 'bg-amber-50 text-amber-700' 
                          : 'bg-rose-50 text-rose-700'
                      }`}>
                        {r.percentage}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-emerald-600 font-semibold">
                      {r.correctAnswers}
                    </td>
                    <td className="py-3.5 px-4 text-rose-500 font-semibold">
                      {r.wrongAnswers}
                    </td>
                    <td className="py-3.5 px-4 text-gray-400 font-medium">
                      {r.unattempted}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-gray-400">
                      {new Date(r.attemptDate).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentResultsPage;

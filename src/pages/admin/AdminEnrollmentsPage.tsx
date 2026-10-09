import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../utils/api';
import { UserCheck, Search, CheckCircle, Ban, XCircle, RefreshCw } from 'lucide-react';

export const AdminEnrollmentsPage: React.FC = () => {
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchEnrollments = async () => {
    try {
      setLoading(true);
      const res = await apiRequest('/api/admin/enrollments');
      setEnrollments(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnrollments();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    const rejectionReason = newStatus === 'Cancelled'
      ? window.prompt('Optional: provide a brief explanation for the student.') || ''
      : '';
    try {
      await apiRequest(`/api/admin/enrollments/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ courseStatus: newStatus, rejectionReason }),
      });
      fetchEnrollments();
    } catch (err) {
      alert('Failed to update enrollment');
    }
  };

  const filtered = enrollments.filter(
    (e) =>
      e.studentName.toLowerCase().includes(search.toLowerCase()) ||
      e.courseName.toLowerCase().includes(search.toLowerCase()) ||
      e.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-navy-500">
            Enrollment Management
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Audit, verify admissions, and manage student course enrollment statuses.
          </p>
        </div>

        <button
          onClick={fetchEnrollments}
          className="btn-secondary text-xs px-3.5 py-2 flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-gray-200">
        <input
          type="text"
          placeholder="Filter by student, course, or enrollment ID..."
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
                <th className="py-3 px-4">Enrollment ID</th>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Course</th>
                <th className="py-3 px-4">Exam / Subject</th>
                <th className="py-3 px-4">Enrolled Date</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-400">
                    Loading enrollments...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-400">
                    No enrollments found.
                  </td>
                </tr>
              ) : (
                filtered.map((enr) => (
                  <tr key={enr.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-primary-600">
                      {enr.id}
                    </td>
                    <td className="py-3 px-4 font-bold text-navy-500">
                      {enr.studentName}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {enr.courseName}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-navy-500">{enr.exam}</span>
                      <span className="text-[10px] text-gray-400 ml-1">({enr.subject})</span>
                    </td>
                    <td className="py-3 px-4 text-gray-500">
                      {enr.enrollmentDate}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          enr.paymentStatus === 'Paid'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {enr.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          enr.courseStatus === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : enr.courseStatus === 'Suspended'
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : 'bg-gray-100 text-gray-600 border-gray-200'
                        }`}
                      >
                        {enr.courseStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1">
                      <button
                        onClick={() => handleUpdateStatus(enr.id, 'Active')}
                        className="px-2 py-1 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                        title="Approve Enrollment"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(enr.id, 'Suspended')}
                        className="px-2 py-1 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200"
                        title="Suspend Enrollment"
                      >
                        Suspend
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(enr.id, 'Cancelled')}
                        className="px-2 py-1 rounded-md text-[10px] font-bold bg-red-50 text-red-700 hover:bg-red-100 border border-red-200"
                        title="Cancel Enrollment"
                      >
                        Cancel
                      </button>
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

export default AdminEnrollmentsPage;

import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../utils/api';
import {
  Users,
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  X,
  GraduationCap,
  CreditCard,
  BookOpen,
  Award,
} from 'lucide-react';

export const AdminStudentsPage: React.FC = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [examFilter, setExamFilter] = useState('All');
  const [subjectFilter, setSubjectFilter] = useState('All');
  const [paymentFilter, setPaymentFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modals
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [studentDetails, setStudentDetails] = useState<any | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState<any | null>(null);

  // New Student Form State
  const [newStudent, setNewStudent] = useState({
    name: '',
    email: '',
    phone: '',
    exam: 'GATE',
    subject: 'Chemistry',
  });

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (search) queryParams.append('search', search);
      if (examFilter !== 'All') queryParams.append('exam', examFilter);
      if (subjectFilter !== 'All') queryParams.append('subject', subjectFilter);
      if (paymentFilter !== 'All') queryParams.append('paymentStatus', paymentFilter);
      if (statusFilter !== 'All') queryParams.append('accountStatus', statusFilter);

      const res = await apiRequest(`/api/admin/students?${queryParams.toString()}`);
      setStudents(res);
    } catch (err) {
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [search, examFilter, subjectFilter, paymentFilter, statusFilter]);

  const handleViewStudent = async (student: any) => {
    setSelectedStudent(student);
    try {
      const details = await apiRequest(`/api/admin/students/${student.id}`);
      setStudentDetails(details);
    } catch (err) {
      console.error('Error fetching student details:', err);
    }
  };

  const handleToggleStatus = async (student: any) => {
    const nextStatus = student.accountStatus === 'Active' ? 'Inactive' : 'Active';
    try {
      await apiRequest(`/api/admin/students/${student.id}`, {
        method: 'PUT',
        body: JSON.stringify({ accountStatus: nextStatus }),
      });
      fetchStudents();
    } catch (err) {
      alert('Failed to update student status');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteCandidate) return;
    try {
      await apiRequest(`/api/admin/students/${deleteCandidate.id}`, {
        method: 'DELETE',
      });
      setDeleteCandidate(null);
      fetchStudents();
    } catch (err) {
      alert('Failed to delete student');
    }
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/api/admin/students', {
        method: 'POST',
        body: JSON.stringify(newStudent),
      });
      setShowAddModal(false);
      setNewStudent({ name: '', email: '', phone: '', exam: 'GATE', subject: 'Chemistry' });
      fetchStudents();
    } catch (err: any) {
      alert(err.message || 'Error creating student');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-navy-500">
            Student Management
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Enrolled student directory, account verification, and performance logs.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary text-xs px-4 py-2.5 flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add Enrolled Student</span>
        </button>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 space-y-3 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, email, phone, or Student ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-xs text-navy-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Exam Filter */}
          <div>
            <select
              value={examFilter}
              onChange={(e) => setExamFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs text-navy-500 bg-white"
            >
              <option value="All">All Exams</option>
              <option value="GATE">GATE</option>
            </select>
          </div>

          {/* Subject Filter */}
          <div>
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs text-navy-500 bg-white"
            >
              <option value="All">All Subjects</option>
              <option value="Chemistry">Chemistry</option>
              <option value="Physics">Physics</option>
            </select>
          </div>

          {/* Payment Status Filter */}
          <div>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs text-navy-500 bg-white"
            >
              <option value="All">All Payments</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Students Data Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Student ID</th>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Contact Info</th>
                <th className="py-3 px-4">Exam &amp; Subject</th>
                <th className="py-3 px-4">Enrolled Date</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4">Account Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-400">
                    Loading student directory records...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-400">
                    No students match the selected filters.
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-primary-600">
                      {student.id}
                    </td>
                    <td className="py-3 px-4 font-bold text-navy-500">
                      {student.name}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      <div>{student.email}</div>
                      <div className="text-[11px] text-gray-400">{student.phone}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-navy-500">{student.exam}</div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-100">
                        {student.subject}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-500">
                      {student.enrollmentDate}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          student.paymentStatus === 'Paid'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {student.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          student.accountStatus === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-gray-100 text-gray-500 border-gray-200'
                        }`}
                      >
                        {student.accountStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1">
                      <button
                        onClick={() => handleViewStudent(student)}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-primary-600 hover:bg-gray-100"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(student)}
                        className={`p-1.5 rounded-lg hover:bg-gray-100 ${
                          student.accountStatus === 'Active'
                            ? 'text-amber-500 hover:text-amber-600'
                            : 'text-emerald-500 hover:text-emerald-600'
                        }`}
                        title={student.accountStatus === 'Active' ? 'Deactivate' : 'Activate'}
                      >
                        {student.accountStatus === 'Active' ? (
                          <XCircle className="w-4 h-4" />
                        ) : (
                          <CheckCircle className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => setDeleteCandidate(student)}
                        className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50"
                        title="Delete Student"
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

      {/* Student Details Drawer / Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-sm">
          <div className="relative w-full max-w-3xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary-600 bg-primary-50 px-2.5 py-0.5 rounded-full">
                  Student Profile #{selectedStudent.id}
                </span>
                <h3 className="text-2xl font-black text-navy-500 mt-1">
                  {selectedStudent.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Grid Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Personal Info */}
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-2">
                <h4 className="font-bold text-navy-500 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-primary-500" />
                  Personal Information
                </h4>
                <p><strong>Email:</strong> {selectedStudent.email}</p>
                <p><strong>Phone:</strong> {selectedStudent.phone}</p>
                <p><strong>Registered Date:</strong> {selectedStudent.enrollmentDate}</p>
                <p><strong>Account Status:</strong> {selectedStudent.accountStatus}</p>
              </div>

              {/* Academic Info */}
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-2">
                <h4 className="font-bold text-navy-500 flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-primary-500" />
                  Academic Information
                </h4>
                <p><strong>Target Exam:</strong> {selectedStudent.exam}</p>
                <p><strong>Subject:</strong> {selectedStudent.subject}</p>
                <p><strong>Course:</strong> {selectedStudent.courseName}</p>
                <p><strong>Batch:</strong> November 1 Cohort</p>
              </div>

              {/* Progress & Attendance */}
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-2">
                <h4 className="font-bold text-navy-500 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-primary-500" />
                  Progress &amp; Attendance
                </h4>
                <p><strong>Syllabus Progress:</strong> {selectedStudent.progress}%</p>
                <p><strong>Classes Attended:</strong> {selectedStudent.classesAttended} / {selectedStudent.totalClasses}</p>
                <p><strong>Materials Accessed:</strong> {selectedStudent.materialsAccessed} modules</p>
                <p><strong>Tests Completed:</strong> {selectedStudent.testsCompleted} tests</p>
                <p><strong>Average Score:</strong> {selectedStudent.averageScore}%</p>
              </div>

            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setSelectedStudent(null)}
                className="btn-secondary text-xs px-5 py-2.5"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-navy-500">
              Confirm Student Deletion
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Are you sure you want to delete the student profile for <strong>{deleteCandidate.name}</strong> ({deleteCandidate.id})? This will revoke login access and remove test history.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeleteCandidate(null)}
                className="btn-secondary text-xs px-5 py-2.5"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md transition-colors"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="text-xl font-bold text-navy-500">
                Enroll New Student
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStudent} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={newStudent.name}
                  onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                  className="input-field text-xs py-2"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. ramesh@example.com"
                  value={newStudent.email}
                  onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                  className="input-field text-xs py-2"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9876543210"
                  value={newStudent.phone}
                  onChange={(e) => setNewStudent({ ...newStudent, phone: e.target.value })}
                  className="input-field text-xs py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Exam</label>
                  <select
                    value={newStudent.exam}
                    onChange={(e) => setNewStudent({ ...newStudent, exam: e.target.value })}
                    className="select-field text-xs py-2"
                  >
                    <option value="GATE">GATE</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Subject</label>
                  <select
                    value={newStudent.subject}
                    onChange={(e) => setNewStudent({ ...newStudent, subject: e.target.value })}
                    className="select-field text-xs py-2"
                  >
                    <option value="Chemistry">Chemistry</option>
                    <option value="Physics">Physics</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-secondary text-xs px-4 py-2"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary text-xs px-5 py-2 font-bold">
                  Create Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminStudentsPage;

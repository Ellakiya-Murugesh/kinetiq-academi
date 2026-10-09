import React, { useState, useEffect } from 'react';
import { apiRequest, downloadApiFile } from '../../utils/api';
import { CreditCard, Search, Download, ShieldCheck, AlertCircle, RefreshCw, CheckCircle2, XCircle, Mail, RotateCw } from 'lucide-react';

export const AdminPaymentsPage: React.FC = () => {
  const [payments, setPayments] = useState<any[]>([]);
  const [emailNotifications, setEmailNotifications] = useState<any[]>([]);
  const [emailTestStatus, setEmailTestStatus] = useState('');
  const [emailTestLoading, setEmailTestLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [updatingId, setUpdatingId] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setLoadError('');
      const res = await apiRequest('/api/admin/payments');
      setPayments(res);
    } catch (err: any) {
      setLoadError(err.message || 'Could not load payment records.');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmailNotifications = async () => {
    try {
      setEmailNotifications(await apiRequest('/api/admin/email-notifications'));
    } catch (err) {
      console.error('Could not load email delivery records:', err);
    }
  };

  useEffect(() => {
    fetchPayments();
    fetchEmailNotifications();
  }, []);

  const handleConfirmPayment = async (payment: any) => {
    if (!window.confirm(`Confirm that payment ${payment.transactionId} was successfully received?`)) return;

    try {
      await apiRequest(`/api/admin/payments/${payment.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'Paid' }),
      });
      await Promise.all([fetchPayments(), fetchEmailNotifications()]);
    } catch (err: any) {
      alert(err.message || 'Failed to confirm payment.');
    }
  };

  const handleReviewPayment = async (payment: any, status: 'Payment Verified' | 'Payment Failed') => {
    let rejectionReason = '';
    if (status === 'Payment Failed') {
      const providedReason = window.prompt('Optional: provide a brief explanation for the student.', payment.rejectionReason || '');
      if (providedReason === null) return;
      rejectionReason = providedReason;
    }
    const confirmation = status === 'Payment Verified'
      ? `Have you independently verified receipt of ₹${Number(payment.amount).toLocaleString('en-IN')} from ${payment.studentName}?`
      : `Mark payment from ${payment.studentName} as failed?`;
    if (!window.confirm(confirmation)) return;

    setUpdatingId(payment.id);
    try {
      await apiRequest(`/api/admin/payments/${payment.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status, rejectionReason }),
      });
      await Promise.all([fetchPayments(), fetchEmailNotifications()]);
    } catch (err: any) {
      alert(err.message || 'Could not update payment verification.');
    } finally {
      setUpdatingId('');
    }
  };

  const handleDownloadReceipt = async (payment: any) => {
    const receiptNumber = payment.receiptNumber || `REC-${payment.id.toUpperCase()}`;
    try {
      await downloadApiFile(`/api/admin/payments/${payment.id}/receipt.pdf`, `${receiptNumber}.pdf`);
    } catch (err: any) {
      alert(err.message || 'Could not download the payment receipt.');
    }
  };

  const handleRetryEmail = async (notificationId: string) => {
    try {
      await apiRequest(`/api/admin/email-notifications/${notificationId}/retry`, { method: 'POST' });
      await new Promise((resolve) => window.setTimeout(resolve, 300));
      await fetchEmailNotifications();
    } catch (err: any) {
      alert(err.message || 'Could not retry email notification.');
    }
  };

  const handleTestEmail = async () => {
    setEmailTestLoading(true);
    setEmailTestStatus('');
    try {
      const result = await apiRequest<{ message: string }>('/api/admin/email-notifications/test', { method: 'POST' });
      setEmailTestStatus(result.message);
      await new Promise((resolve) => window.setTimeout(resolve, 750));
      await fetchEmailNotifications();
    } catch (err: any) {
      setEmailTestStatus(err.message || 'SMTP test failed. Check backend logs for a non-sensitive diagnostic code.');
    } finally {
      setEmailTestLoading(false);
    }
  };

  const filtered = payments.filter((p) => {
    const matchSearch =
      p.transactionId.toLowerCase().includes(search.toLowerCase()) ||
      p.studentName.toLowerCase().includes(search.toLowerCase()) ||
      String(p.registrationId || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalCollected = payments
    .filter((p) => ['Paid', 'Payment Verified'].includes(p.status))
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-navy-500">
            Payment Management
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Track student transactions, fee collections, payment methods, and gateways.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800">
            <strong>Total Verified Collected:</strong> ₹{totalCollected.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Payment review notice */}
      <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl flex items-center justify-between text-xs text-blue-900">
        <div className="flex items-center gap-2 font-mono">
          <ShieldCheck className="w-4 h-4 text-primary-500 shrink-0" />
          <span>Student UPI confirmations remain pending until payment is manually verified by the academy.</span>
        </div>
      </div>

      {/* Search and Status Filters */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by payment ID, transaction ID, or student..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10 text-xs py-2 w-full"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="select-field text-xs py-2"
          >
            <option value="All">All Statuses</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
            <option value="Payment Pending">Payment Pending</option>
            <option value="Payment Verification Pending">Payment Verification Pending</option>
            <option value="Payment Verified">Payment Verified</option>
            <option value="Payment Failed">Payment Failed</option>
            <option value="Failed">Failed</option>
          </select>

          <button
            onClick={() => {
              void fetchPayments();
              void fetchEmailNotifications();
            }}
            className="btn-secondary text-xs px-3 py-2 flex items-center gap-1 shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {loadError && <div role="alert" className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"><AlertCircle className="h-4 w-4 shrink-0" />{loadError}</div>}

      {/* Payments Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Payment / Transaction ID</th>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Registration ID</th>
                <th className="py-3 px-4">Course Program</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Payment Method</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-gray-400">
                    Loading financial records...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-gray-400">
                    No matching payment records found.
                  </td>
                </tr>
              ) : (
                filtered.map((pay) => (
                  <tr key={pay.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-navy-500">
                      {pay.transactionId}
                    </td>
                    <td className="py-3 px-4 font-bold text-navy-500">
                      {pay.studentName}
                    </td>
                    <td className="py-3 px-4 font-mono text-gray-600">{pay.registrationId || pay.studentId || '—'}</td>
                    <td className="py-3 px-4 text-gray-600">
                      {pay.courseName}
                    </td>
                    <td className="py-3 px-4 font-black text-navy-500">
                      ₹{pay.amount.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {pay.paymentMethod}
                    </td>
                    <td className="py-3 px-4 text-gray-500">
                      {pay.paymentDate || pay.date ? new Date(pay.paymentDate || pay.date).toLocaleString('en-IN') : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          ['Paid', 'Payment Verified'].includes(pay.status)
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : ['Pending', 'Payment Pending', 'Payment Verification Pending'].includes(pay.status)
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-red-50 text-red-700 border-red-200'
                        }`}
                      >
                        {pay.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {['Paid', 'Payment Verified'].includes(pay.status) ? (
                        <button
                          onClick={() => handleDownloadReceipt(pay)}
                          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-primary-600 hover:bg-primary-50"
                          title="Download Receipt"
                        >
                          <Download className="w-4 h-4" /> Receipt
                        </button>
                      ) : pay.status === 'Payment Verification Pending' ? (
                        <div className="inline-flex flex-wrap justify-end gap-1.5">
                          <button disabled={updatingId === pay.id} onClick={() => handleReviewPayment(pay, 'Payment Verified')} className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-emerald-700 hover:bg-emerald-50 disabled:opacity-50" title="Mark as Payment Verified">
                            <CheckCircle2 className="h-4 w-4" /> Verify
                          </button>
                          <button disabled={updatingId === pay.id} onClick={() => handleReviewPayment(pay, 'Payment Failed')} className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-red-700 hover:bg-red-50 disabled:opacity-50" title="Mark as Payment Failed">
                            <XCircle className="h-4 w-4" /> Fail
                          </button>
                        </div>
                      ) : pay.status === 'Pending' && !pay.enrollmentFlow ? (
                        <button
                          onClick={() => handleConfirmPayment(pay)}
                          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-emerald-700 hover:bg-emerald-50"
                          title="Confirm successful payment and issue receipt"
                        >
                          <CheckCircle2 className="w-4 h-4" /> Mark Paid
                        </button>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-primary-600" />
          <h2 className="font-bold text-navy-500">Student Email Notifications</h2>
        </div>
        <p className="text-xs text-gray-500">
          Delivery is queued with enrollment and payment updates. Failed messages remain recorded and can be retried without repeating payment changes.
        </p>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <button
            type="button"
            disabled={emailTestLoading}
            onClick={() => void handleTestEmail()}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-primary-200 bg-primary-50 px-4 py-2 text-xs font-bold text-primary-700 hover:bg-primary-100 disabled:opacity-50"
          >
            <Mail className="h-4 w-4" />
            {emailTestLoading ? 'Testing Gmail SMTP…' : 'Test SMTP and email my admin account'}
          </button>
          {emailTestStatus && <p role="status" className="text-xs text-gray-600">{emailTestStatus}</p>}
        </div>
        {emailNotifications.length === 0 ? (
          <p className="text-xs text-gray-400">No notification records yet.</p>
        ) : (
          <div className="space-y-2">
            {emailNotifications.map((notification) => (
              <div key={notification.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-gray-100 p-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-navy-500">
                    {notification.type.replaceAll('_', ' ')} · {notification.studentName}
                  </p>
                  <p className="text-[11px] text-gray-500 break-all">
                    {notification.recipientEmail || 'No valid registered student email'}
                    {' · '}Attempts: {notification.attemptCount || 0}
                    {' · '}{notification.status}
                  </p>
                  {notification.lastError && (
                    <p className="mt-1 text-[11px] text-rose-700">{notification.lastError}</p>
                  )}
                </div>
                {['failed', 'retry'].includes(notification.status) && (
                  <button
                    type="button"
                    onClick={() => handleRetryEmail(notification.id)}
                    className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-primary-700 hover:bg-primary-50"
                  >
                    <RotateCw className="h-3.5 w-3.5" />
                    Retry email
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminPaymentsPage;

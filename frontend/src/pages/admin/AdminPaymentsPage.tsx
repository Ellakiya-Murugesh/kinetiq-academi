import React, { useState, useEffect } from 'react';
import { apiRequest, downloadApiFile } from '../../utils/api';
import { CreditCard, Search, Download, ShieldCheck, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';

const paymentStatusGroup = (status: string) => {
  const normalized = status.toLowerCase();
  if (['pending', 'payment pending', 'payment verification pending'].includes(normalized)) return 'Pending';
  if (['failed', 'payment failed'].includes(normalized)) return 'Failed';
  if (['paid', 'payment verified'].includes(normalized)) return 'Paid';
  return status;
};

export const AdminPaymentsPage: React.FC = () => {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setLoadError('');
      const res = await apiRequest('/api/admin/payments');
      setPayments(res);
    } catch (err) {
      console.error(err);
      setLoadError(err instanceof Error ? err.message : 'Could not load payment records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleConfirmPayment = async (payment: any) => {
    if (!window.confirm(`Confirm that payment ${payment.transactionId || payment.id} was successfully received?`)) return;

    try {
      await apiRequest(`/api/admin/payments/${payment.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'Paid' }),
      });
      await fetchPayments();
    } catch (err: any) {
      alert(err.message || 'Failed to confirm payment.');
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

  const filtered = payments.filter((p) => {
    const matchSearch = `${p.transactionId || p.id || ''} ${p.studentName || ''}`
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || paymentStatusGroup(p.status || '') === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalCollected = payments
    .filter((p) => paymentStatusGroup(p.status || '') === 'Paid')
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

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

      {loadError && <div role="alert" className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"><AlertCircle className="h-4 w-4 shrink-0" />{loadError}</div>}

      {/* Gateway Notice Box */}
      <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl flex items-center justify-between text-xs text-blue-900">
        <div className="flex items-center gap-2 font-mono">
          <ShieldCheck className="w-4 h-4 text-primary-500 shrink-0" />
          <span>[PAYMENT GATEWAY INTEGRATION REQUIRED] Razorpay / Cashfree Webhook Sync</span>
        </div>
        <span className="text-[10px] bg-white px-2 py-0.5 rounded font-bold border border-blue-200">
          Sandbox Mode Active
        </span>
      </div>

      {/* Search and Status Filters */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Transaction ID or Student..."
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
            <option value="Failed">Failed</option>
            <option value="Refunded">Refunded</option>
          </select>

          <button
            onClick={fetchPayments}
            className="btn-secondary text-xs px-3 py-2 flex items-center gap-1 shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Transaction ID</th>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Course Program</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Payment Method</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-400">
                    Loading financial records...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-400">
                    No matching payment records found.
                  </td>
                </tr>
              ) : (
                filtered.map((pay) => (
                  <tr key={pay.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-navy-500">
                      {pay.transactionId || pay.id}
                    </td>
                    <td className="py-3 px-4 font-bold text-navy-500">
                      {pay.studentName || 'Student'}
                    </td>
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
                      {pay.date}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          paymentStatusGroup(pay.status || '') === 'Paid'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : paymentStatusGroup(pay.status || '') === 'Pending'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : paymentStatusGroup(pay.status || '') === 'Refunded'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : 'bg-red-50 text-red-700 border-red-200'
                        }`}
                      >
                        {paymentStatusGroup(pay.status || 'Unknown')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {pay.status === 'Paid' ? (
                        <button
                          onClick={() => handleDownloadReceipt(pay)}
                          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-primary-600 hover:bg-primary-50"
                          title="Download Receipt"
                        >
                          <Download className="w-4 h-4" /> Receipt
                        </button>
                      ) : paymentStatusGroup(pay.status || '') === 'Pending' ? (
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
    </div>
  );
};

export default AdminPaymentsPage;

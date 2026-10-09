import React, { useState, useEffect } from 'react';
import { 
  CreditCard, CheckCircle2, Download, Receipt,
  ShieldCheck, AlertCircle, Printer, Calendar
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { api, downloadApiFile } from '../../utils/api';
import { BRAND_NAME } from '../../config/brand';

interface PaymentRecord {
  id: string;
  receiptNumber?: string | null;
  studentId: string;
  studentName: string;
  amount: number;
  courseName: string;
  date: string;
  paymentMethod: string;
  status: string;
  transactionId: string;
  enrollmentFlow?: string;
}

interface PaymentsResponse {
  payments: PaymentRecord[];
}

const SEEDED_DEMO_PAYMENT_IDS = new Set(['pay-101', 'pay-102', 'pay-103', 'pay-104', 'pay-105']);

export const StudentPaymentsPage: React.FC = () => {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentRecord | null>(null);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await api.get<PaymentsResponse>('/student/payments');
      if (res.success && res.data) {
        setPayments((res.data.payments || []).filter((payment) => !SEEDED_DEMO_PAYMENT_IDS.has(payment.id)));
      }
    } catch (err) {
      console.error('Failed to load payments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadReceipt = async (payment: PaymentRecord) => {
    const receiptNumber = payment.receiptNumber || `REC-${payment.id.toUpperCase()}`;
    try {
      await downloadApiFile(`/api/student/payments/${payment.id}/receipt.pdf`, `${receiptNumber}.pdf`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not download the receipt.');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 mb-2">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Billing & Transactions</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-[#00245C]">Fee Payments & Invoices</h1>
        <p className="text-sm text-gray-600 mt-1">
          Review your enrolled batch payments and download tax-compliant fee receipts.
        </p>
      </div>

          {/* Transaction Records */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h2 className="text-lg font-bold text-[#00245C] mb-4 flex items-center gap-2">
          <Receipt className="w-5 h-5 text-[#00245C]" /> Payment History
        </h2>

        {loading ? (
          <div className="py-12 text-center text-gray-400 text-sm">Loading billing records...</div>
        ) : payments.length === 0 ? (
          <div className="py-12 text-center text-gray-500 text-sm">
            No payments found. Contact support if you have an active enrollment.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs uppercase text-gray-400 border-b border-gray-100">
                <tr>
                  <th className="py-3 px-4">Payment / Transaction ID</th>
                  <th className="py-3 px-4">Enrolled Course</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/60 transition">
                    <td className="py-3.5 px-4 font-mono text-xs text-gray-500">
                      {p.transactionId}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[#00245C]">
                      {p.courseName}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-[#00245C]">
                      ₹{p.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-medium text-gray-600">
                      {p.paymentMethod}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-gray-400">
                      {new Date(p.date).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold inline-flex items-center gap-1 ${
                        ['Paid', 'Payment Verified'].includes(p.status)
                          ? 'bg-emerald-50 text-emerald-700'
                          : ['Pending', 'Payment Pending', 'Payment Verification Pending'].includes(p.status)
                          ? 'bg-amber-50 text-amber-800'
                          : 'bg-rose-50 text-rose-700'
                      }`}>
                        {['Paid', 'Payment Verified'].includes(p.status)
                          ? <CheckCircle2 className="w-3 h-3" />
                          : <AlertCircle className="w-3 h-3" />}
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {['Paid', 'Payment Verified'].includes(p.status) ? (
                        <button
                          onClick={() => setSelectedReceipt(p)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 hover:border-primary-400 hover:text-primary-700 rounded-lg text-xs font-medium transition"
                        >
                          <Receipt className="w-3.5 h-3.5" /> View Receipt
                        </button>
                      ) : p.enrollmentFlow === 'upi-gate' ? (
                        <Link
                          to={`/student/payment/${encodeURIComponent(p.id)}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 hover:border-primary-400 hover:text-primary-700 rounded-lg text-xs font-medium transition"
                        >
                          {['Payment Verification Pending', 'Payment Verified', 'Payment Failed'].includes(p.status) ? 'View status' : 'Continue'}
                        </Link>
                      ) : (
                        <span className="text-xs text-gray-400">Available after payment</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invoice Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 md:p-8 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#00245C]">Official Receipt</span>
                <h3 className="text-xl font-black text-navy-500">{BRAND_NAME}</h3>
              </div>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="py-6 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl">
                <div>
                  <div className="text-xs text-gray-400">Receipt No:</div>
                  <div className="font-mono font-bold text-gray-800 text-xs mt-0.5">{selectedReceipt.receiptNumber || `REC-${selectedReceipt.id.toUpperCase()}`}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Payment Date:</div>
                  <div className="font-semibold text-gray-800 mt-0.5">{new Date(selectedReceipt.date).toLocaleDateString()}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Student Name:</div>
                  <div className="font-semibold text-gray-800 mt-0.5">{selectedReceipt.studentName}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Payment Method:</div>
                  <div className="font-semibold text-gray-800 mt-0.5">{selectedReceipt.paymentMethod}</div>
                </div>
              </div>

              <div className="border border-gray-100 rounded-xl p-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="font-medium text-gray-700">{selectedReceipt.courseName}</span>
                  <span className="font-bold text-gray-900">₹{selectedReceipt.amount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center py-2 text-xs text-gray-500">
                  <span>GST (18% inclusive)</span>
                  <span>Included</span>
                </div>
                <div className="flex justify-between items-center pt-3 text-base font-black text-[#00245C]">
                  <span>Total Amount Paid:</span>
                  <span className="text-[#00245C]">₹{selectedReceipt.amount.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="text-xs text-gray-400 text-center pt-2">
                This is a computer-generated tax invoice for online education services.
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                onClick={() => handleDownloadReceipt(selectedReceipt)}
                className="inline-flex items-center gap-1.5 px-4 py-2 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50"
              >
                <Download className="w-4 h-4" /> Download
              </button>
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-4 py-2 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50"
              >
                <Printer className="w-4 h-4" /> Print
              </button>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="px-5 py-2 bg-[#00245C] hover:bg-blue-600 text-white rounded-xl text-sm font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentPaymentsPage;

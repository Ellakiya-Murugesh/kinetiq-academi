import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Clock3, Download, Home, LoaderCircle, Printer, RefreshCw, ShieldCheck } from 'lucide-react';
import { apiRequest, downloadApiFile } from '../../utils/api';

interface PaymentDetails {
  payment: {
    id: string;
    status: string;
    courseCode?: string;
    courseName: string;
    amount: number;
    paymentMethod: string;
    date: string;
    paymentDate?: string;
    receiptNumber?: string;
  };
  enrollment: { enrollmentDate?: string; courseStatus?: string } | null;
  student: { name: string; registrationId: string };
}

const UPI_QR_PATH = '/images/kinetiq-upi-qr.jpeg';

export const StudentPaymentPage: React.FC = () => {
  const { paymentId = '' } = useParams();
  const [data, setData] = useState<PaymentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [receiptError, setReceiptError] = useState('');

  const loadPayment = useCallback(async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    else setRefreshing(true);
    setError('');
    try {
      const result = await apiRequest<PaymentDetails>(`/api/student/payments/${encodeURIComponent(paymentId)}`);
      setData(result);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not load payment details.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [paymentId]);

  useEffect(() => { void loadPayment(); }, [loadPayment]);

  const submitPaymentForReview = async () => {
    if (!data || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      await apiRequest(`/api/student/payments/${encodeURIComponent(paymentId)}/confirm`, { method: 'POST', body: JSON.stringify({}) });
      setConfirmOpen(false);
      await loadPayment(false);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not submit the payment for review.');
    } finally {
      setSubmitting(false);
    }
  };

  const downloadReceipt = async () => {
    if (!data) return;
    setReceiptError('');
    const receiptName = data.payment.receiptNumber || `REC-${data.payment.id.toUpperCase()}`;
    try {
      await downloadApiFile(`/api/student/payments/${encodeURIComponent(paymentId)}/receipt.pdf`, `${receiptName}.pdf`);
    } catch (requestError) {
      setReceiptError(requestError instanceof Error ? requestError.message : 'Could not download the enrollment receipt.');
    }
  };

  if (loading) return <div className="flex min-h-64 items-center justify-center gap-3 text-gray-600" role="status"><LoaderCircle className="h-5 w-5 animate-spin" />Loading payment details...</div>;
  if (error && !data) return <section className="mx-auto max-w-2xl rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-900" role="alert"><p>{error}</p><Link className="mt-4 inline-block text-sm font-bold underline" to="/student/dashboard">Back to dashboard</Link></section>;
  if (!data) return null;

  const { payment, student } = data;
  const isVerified = payment.status === 'Payment Verified' || payment.status === 'Paid';
  const isVerificationPending = payment.status === 'Payment Verification Pending';
  const isFailed = payment.status === 'Payment Failed' || payment.status === 'Failed';
  const paymentTimestamp = payment.paymentDate || payment.date;

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-700">Secure UPI enrollment</p>
          <h1 className="mt-2 text-2xl font-black text-navy-500 sm:text-3xl">{isVerified ? 'Enrollment confirmed' : 'COMPLETE YOUR PAYMENT'}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
            {isVerified
              ? 'Your UPI payment has been verified and your GATE course enrollment is confirmed.'
              : isVerificationPending
              ? 'Your payment confirmation has been submitted. Kinetiq Academi will verify it before confirming your enrollment.'
              : 'Your course enrollment has been submitted successfully. Please complete the payment using the UPI QR code below.'}
          </p>
        </div>
        {!isVerified && <button type="button" onClick={() => void loadPayment(false)} disabled={refreshing} className="inline-flex items-center justify-center gap-2 self-start rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-navy-500 hover:bg-gray-50 disabled:opacity-60"><RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />Refresh status</button>}
      </header>

      {error && <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}

      {isVerified ? (
        <section className="rounded-3xl border border-emerald-200 bg-white p-5 shadow-sm sm:p-8" aria-labelledby="confirmed-heading">
          <div className="mx-auto max-w-2xl text-center">
            <span className="mx-auto inline-flex rounded-full bg-emerald-50 p-4 text-emerald-700"><CheckCircle2 className="h-9 w-9" /></span>
            <h2 id="confirmed-heading" className="mt-4 text-2xl font-black text-emerald-800">Enrollment Confirmed Successfully!</h2>
            <p className="mt-2 text-sm text-gray-600">Your payment was verified by Kinetiq Academi.</p>
          </div>
          <dl className="mx-auto mt-7 grid max-w-3xl gap-3 rounded-2xl bg-gray-50 p-4 text-sm sm:grid-cols-2 sm:p-6">
            <div><dt className="text-xs font-semibold text-gray-500">Student Name</dt><dd className="mt-1 font-bold text-navy-500">{student.name}</dd></div>
            <div><dt className="text-xs font-semibold text-gray-500">Registration/Application ID</dt><dd className="mt-1 font-bold text-navy-500">{student.registrationId}</dd></div>
            <div><dt className="text-xs font-semibold text-gray-500">GATE Course</dt><dd className="mt-1 font-bold text-navy-500">{payment.courseName}</dd></div>
            {payment.courseCode && <div><dt className="text-xs font-semibold text-gray-500">Course Code</dt><dd className="mt-1 font-bold text-navy-500">{payment.courseCode}</dd></div>}
            <div><dt className="text-xs font-semibold text-gray-500">Course Fee</dt><dd className="mt-1 font-bold text-navy-500">₹{payment.amount.toLocaleString('en-IN')}</dd></div>
            <div><dt className="text-xs font-semibold text-gray-500">Payment Status</dt><dd className="mt-1 font-bold text-emerald-700">Payment Verified</dd></div>
            <div><dt className="text-xs font-semibold text-gray-500">Enrollment Status</dt><dd className="mt-1 font-bold text-emerald-700">Enrollment Confirmed</dd></div>
          </dl>
          {receiptError && <p className="mt-4 text-center text-sm text-rose-700" role="alert">{receiptError}</p>}
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <button type="button" onClick={downloadReceipt} className="btn-primary inline-flex items-center justify-center gap-2"><Download className="h-4 w-4" />Download Enrollment Receipt</button>
            <button type="button" onClick={() => window.print()} className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-navy-500 hover:bg-gray-50"><Printer className="h-4 w-4" />Print Receipt</button>
            <Link to="/" className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-navy-500 hover:bg-gray-50"><Home className="h-4 w-4" />Back to Home</Link>
          </div>
        </section>
      ) : (
        <div className="grid items-start gap-5 lg:grid-cols-[1fr_0.9fr]">
          <section className="rounded-3xl border border-amber-200 bg-white p-5 shadow-sm sm:p-7">
            <h2 className="text-lg font-extrabold text-navy-500">Scan to Pay</h2>
            <p className="mt-2 text-sm leading-6 text-gray-600">Scan this QR code using your preferred UPI application to complete your course payment.</p>
            <figure className="mx-auto mt-5 flex w-full max-w-sm flex-col items-center rounded-2xl border border-gray-100 bg-white p-4 sm:p-6">
              <img src={UPI_QR_PATH} alt="UPI payment QR code for GATE course enrollment" className="h-auto max-h-[340px] w-full object-contain" />
              <figcaption className="mt-3 text-center text-xs font-semibold text-gray-500">Scan to Pay</figcaption>
            </figure>
            <p className="mt-4 rounded-xl bg-blue-50 p-4 text-sm leading-6 text-blue-900">
              Pay the exact course fee shown, then confirm below. Your payment will be reviewed by our team before course access is activated.
            </p>
          </section>

          <section className="space-y-4 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
            <h2 className="text-lg font-extrabold text-navy-500">Payment details</h2>
            <dl className="space-y-4 text-sm">
              <div className="flex justify-between gap-4"><dt className="text-gray-500">Student Name</dt><dd className="text-right font-bold text-navy-500">{student.name}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-gray-500">Registration/Application ID</dt><dd className="text-right font-bold text-navy-500">{student.registrationId}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-gray-500">Course</dt><dd className="text-right font-bold text-navy-500">{payment.courseName}</dd></div>
              {payment.courseCode && <div className="flex justify-between gap-4"><dt className="text-gray-500">Course Code</dt><dd className="text-right font-bold text-navy-500">{payment.courseCode}</dd></div>}
              <div className="flex justify-between gap-4"><dt className="text-gray-500">Course Fee</dt><dd className="text-right text-lg font-black text-navy-500">₹{payment.amount.toLocaleString('en-IN')}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-gray-500">Payment Date &amp; Time</dt><dd className="text-right font-semibold text-navy-500">{paymentTimestamp ? new Date(paymentTimestamp).toLocaleString('en-IN') : '—'}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-gray-500">Payment Method</dt><dd className="text-right font-bold text-navy-500">UPI</dd></div>
              <div className="flex justify-between gap-4 border-t border-gray-100 pt-4"><dt className="text-gray-500">Payment Status</dt><dd className={`text-right font-bold ${isVerificationPending ? 'text-amber-700' : isFailed ? 'text-rose-700' : 'text-gray-700'}`}>{['Pending', 'Payment Pending'].includes(payment.status) ? 'Pending' : payment.status}</dd></div>
            </dl>

            {isVerificationPending ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900" role="status">
                <p className="flex items-center gap-2 font-bold"><Clock3 className="h-4 w-4" />Payment Verification Pending</p>
                <p className="mt-2 text-xs leading-5">Your payment confirmation was submitted. We will activate the course after our team verifies receipt.</p>
              </div>
            ) : (
              <>
                {isFailed && <p role="status" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs leading-5 text-rose-800">Payment verification failed. If you have now completed the payment, you may submit it for review again.</p>}
                <button type="button" onClick={() => setConfirmOpen(true)} className="btn-primary w-full py-3 text-sm">Payment Completed</button>
              </>
            )}
            <p className="flex items-start gap-2 text-xs leading-5 text-gray-500"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />Submitting a confirmation does not automatically verify the payment.</p>
            <Link to="/student/dashboard" className="block text-center text-xs font-bold text-primary-700 hover:underline">Back to dashboard</Link>
          </section>
        </div>
      )}

      {confirmOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-navy-900/50 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !submitting) setConfirmOpen(false); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="confirm-payment-heading" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h2 id="confirm-payment-heading" className="text-lg font-extrabold text-navy-500">Have you completed the payment?</h2>
            <p className="mt-2 text-sm leading-6 text-gray-600">Your confirmation will be sent to the academy for manual verification. It will not confirm the payment automatically.</p>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" disabled={submitting} onClick={() => setConfirmOpen(false)} className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-60">Cancel</button>
              <button type="button" disabled={submitting} onClick={() => void submitPaymentForReview()} className="btn-primary inline-flex items-center justify-center gap-2 disabled:opacity-60">
                {submitting && <LoaderCircle className="h-4 w-4 animate-spin" />}
                Yes, Payment Completed
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
};

export default StudentPaymentPage;

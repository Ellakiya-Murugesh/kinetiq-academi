import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../utils/api';
import { MessageSquare, Phone, Calendar, CheckCircle2, RefreshCw } from 'lucide-react';

export const AdminEnquiriesPage: React.FC = () => {
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEnquiries = async () => {
    try {
      setLoading(true);
      const res = await apiRequest('/api/admin/enquiries');
      setEnquiries(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnquiries();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await apiRequest(`/api/admin/enquiries/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      });
      fetchEnquiries();
    } catch (err) {
      alert('Failed to update enquiry status');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-navy-500">
            Guidance &amp; Admission Enquiries
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Track inquiries submitted through the public &ldquo;Book a Guidance Call&rdquo; and &ldquo;Contact Us&rdquo; forms.
          </p>
        </div>

        <button
          onClick={fetchEnquiries}
          className="btn-secondary text-xs px-3.5 py-2 flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Leads</span>
        </button>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12 text-gray-400 text-xs">
            Loading student guidance inquiries...
          </div>
        ) : enquiries.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl text-center text-gray-400 text-xs border border-gray-200">
            No inquiries recorded.
          </div>
        ) : (
          enquiries.map((enq) => (
            <div
              key={enq.id}
              className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-navy-50 text-navy-600 border border-navy-100">
                    {enq.exam} • {enq.subject}
                  </span>
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{enq.date}</span>
                  </span>
                </div>

                <h3 className="font-bold text-base text-navy-500">
                  {enq.name}
                </h3>

                <div className="flex items-center gap-2 text-xs text-primary-600 font-semibold">
                  <Phone className="w-3.5 h-3.5" />
                  <a href={`tel:${enq.phone}`} className="hover:underline">{enq.phone}</a>
                </div>

                <p className="text-xs text-gray-600 max-w-2xl leading-relaxed pt-1">
                  &ldquo;{enq.message}&rdquo;
                </p>
              </div>

              {/* Status Update Dropdown */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <span className="text-[10px] text-gray-400 block font-bold uppercase">Counseling Status</span>
                  <select
                    value={enq.status}
                    onChange={(e) => handleUpdateStatus(enq.id, e.target.value)}
                    className="select-field text-xs py-1.5 px-3 font-semibold mt-1"
                  >
                    <option value="New">New Lead</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Follow-up">Follow-up Required</option>
                    <option value="Closed">Closed / Enrolled</option>
                  </select>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminEnquiriesPage;

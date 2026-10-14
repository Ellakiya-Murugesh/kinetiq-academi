import React from 'react';

const AdminRefundsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-navy-500">Refund Requests</h1>
        <p className="mt-1 text-sm text-gray-500">Review enrollment and batch-related refund cases.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 text-sm text-gray-600">
        No refund records are available yet.
      </div>
    </div>
  );
};

export default AdminRefundsPage;

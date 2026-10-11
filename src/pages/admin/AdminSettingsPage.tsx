import React, { useState } from 'react';
import { Settings, ShieldCheck, Database, Save, CheckCircle2, Download } from 'lucide-react';
import { BRAND_NAME } from '../../config/brand';
import { downloadApiFile } from '../../utils/api';

export const AdminSettingsPage: React.FC = () => {
  const [saved, setSaved] = useState(false);
  const [backupError, setBackupError] = useState('');

  const [settings, setSettings] = useState({
    brandName: BRAND_NAME,
    supportEmail: '[EMAIL ADDRESS]',
    supportPhone: '[PHONE NUMBER]',
    refundAmount: 2000,
    claimWindowDays: 30,
    minAttendancePercent: 75,
    enableSelfRegistration: true,
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleBackupDownload = async () => {
    setBackupError('');
    try {
      await downloadApiFile(
        '/api/admin/database-report.pdf',
        `kinetiq-academy-database-report-${new Date().toISOString().slice(0, 10)}.pdf`
      );
    } catch (error) {
      setBackupError(error instanceof Error ? error.message : 'Could not download the database report.');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-navy-500">
          System Administration Settings
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Configure platform parameters, refund policy rules, contact endpoints, and backup data.
        </p>
      </div>

      {saved && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-xs text-emerald-800 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>System configuration parameters saved and active!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        {/* Section 1: Brand & Contact Info */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 space-y-4 shadow-sm">
          <h2 className="text-sm font-bold text-navy-500 flex items-center gap-2">
            <Settings className="w-4 h-4 text-primary-500" />
            <span>General Platform Parameters</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-gray-700 mb-1">Platform Brand Name</label>
              <input
                type="text"
                value={settings.brandName}
                onChange={(e) => setSettings({ ...settings, brandName: e.target.value })}
                className="input-field text-xs py-2 font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-gray-700 mb-1">Support Email</label>
              <input
                type="text"
                value={settings.supportEmail}
                onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                className="input-field text-xs py-2 font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-gray-700 mb-1">Support Phone</label>
              <input
                type="text"
                value={settings.supportPhone}
                onChange={(e) => setSettings({ ...settings, supportPhone: e.target.value })}
                className="input-field text-xs py-2 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Clear-The-Exam Refund Rules */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 space-y-4 shadow-sm">
          <h2 className="text-sm font-bold text-navy-500 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>₹2,000 Refund Policy Verification Thresholds</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-gray-700 mb-1">Incentive Amount (₹)</label>
              <input
                type="number"
                value={settings.refundAmount}
                onChange={(e) => setSettings({ ...settings, refundAmount: Number(e.target.value) })}
                className="input-field text-xs py-2"
              />
            </div>
            <div>
              <label className="block font-bold text-gray-700 mb-1">Claim Window (Days from Result)</label>
              <input
                type="number"
                value={settings.claimWindowDays}
                onChange={(e) => setSettings({ ...settings, claimWindowDays: Number(e.target.value) })}
                className="input-field text-xs py-2"
              />
            </div>
            <div>
              <label className="block font-bold text-gray-700 mb-1">Minimum Live Attendance (%)</label>
              <input
                type="number"
                value={settings.minAttendancePercent}
                onChange={(e) => setSettings({ ...settings, minAttendancePercent: Number(e.target.value) })}
                className="input-field text-xs py-2"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Data Export */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 space-y-3 shadow-sm">
          <h2 className="text-sm font-bold text-navy-500 flex items-center gap-2">
            <Database className="w-4 h-4 text-indigo-500" />
            <span>Database Backup &amp; Maintenance</span>
          </h2>
          <p className="text-gray-500 text-xs">
            Download a readable PDF report with record totals and details from each database section. Password hashes and secrets are excluded.
          </p>
          <div className="pt-1">
            <button
              type="button"
              onClick={handleBackupDownload}
              className="btn-secondary text-xs px-4 py-2 flex items-center gap-2"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Database Report (.pdf)</span>
            </button>
          </div>
          {backupError && <p role="alert" className="text-xs text-red-600">{backupError}</p>}
        </div>

        <div className="flex justify-end pt-2">
          <button type="submit" className="btn-primary text-xs px-6 py-2.5 flex items-center gap-1.5 shadow-md">
            <Save className="w-4 h-4" />
            <span>Save Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminSettingsPage;

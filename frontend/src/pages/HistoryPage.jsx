import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import {
  History as HistoryIcon,
  FileText,
  Download,
  Trash2,
  ExternalLink,
  CheckCircle2,
  Clock,
  Loader2,
  AlertCircle
} from 'lucide-react';

export default function HistoryPage() {
  const [historyData, setHistoryData] = useState({ forms: [], completed_count: 0, recent_activities: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    try {
      setLoading(true);
      const data = await api.getHistory();
      setHistoryData(data);
    } catch (err) {
      setError(err.message || 'Failed to load history');
    } finally {
      setLoading(false);
    }
  }

  const handleDelete = async (formId) => {
    if (!window.confirm('Delete this application draft from your history?')) return;
    try {
      await api.deleteHistoryItem(formId);
      loadHistory();
    } catch (err) {
      setError(err.message || 'Delete failed');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div>
        <div className="inline-flex items-center space-x-1.5 text-xs text-cyan-400 font-semibold mb-1">
          <HistoryIcon className="w-4 h-4" />
          <span>Audit Logged Drafts & Submissions</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Application History</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Manage your saved drafts, reopen partially filled applications, and download completed PDF exports.
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-950/50 border border-red-500/40 text-red-200 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Applications Table */}
      <div className="glass-panel rounded-2xl border border-[#1E2D4A] overflow-hidden">
        <div className="p-5 border-b border-[#1E2D4A] flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Saved Application Forms ({historyData.forms.length})
          </h3>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400 flex items-center justify-center space-x-2">
            <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
            <span>Loading application drafts...</span>
          </div>
        ) : historyData.forms.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 space-y-3">
            <FileText className="w-8 h-8 text-slate-600 mx-auto" />
            <p>No historical applications found.</p>
            <Link
              to="/forms/upload"
              className="inline-block px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs"
            >
              Upload Form Now
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#090D17] text-slate-400 uppercase text-[10px] tracking-wider border-b border-[#1E2D4A]">
                <tr>
                  <th className="py-3 px-4">Application Form</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Pages & Fields</th>
                  <th className="py-3 px-4">Date Created</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E2D4A]/50">
                {historyData.forms.map((item) => (
                  <tr key={item.id} className="hover:bg-[#121C33]/50 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-white">
                      <div className="flex items-center space-x-2.5">
                        <FileText className="w-4 h-4 text-violet-400 shrink-0" />
                        <span className="truncate max-w-xs">{item.title}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          item.status === 'completed'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                            : item.status === 'autofilled'
                            ? 'bg-cyan-950 text-cyan-400 border border-cyan-500/30'
                            : 'bg-yellow-950 text-yellow-400 border border-yellow-500/30'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {item.total_pages} page(s) • {item.fields_count} field(s)
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                      {new Date(item.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <Link
                        to={`/forms/${item.id}`}
                        className="px-2.5 py-1 rounded-lg bg-[#121C33] hover:bg-[#182544] text-cyan-300 border border-[#1E2D4A] text-[11px] font-medium inline-flex items-center space-x-1"
                      >
                        <span>Reopen</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>

                      {item.completed_export_id && (
                        <a
                          href={api.downloadExportUrl(item.id, item.completed_export_id)}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-500/30 text-[11px] font-medium inline-flex items-center space-x-1"
                          title="Download Generated PDF"
                        >
                          <Download className="w-3 h-3" />
                          <span>PDF</span>
                        </a>
                      )}

                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1 text-slate-400 hover:text-red-400 rounded transition-colors"
                        title="Delete draft"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Security Audit Activity Feed */}
      <div className="glass-panel p-6 rounded-2xl border border-[#1E2D4A] space-y-4">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider">
          Recent Security & Processing Audit Log
        </h3>
        <p className="text-[11px] text-slate-400">
          In compliance with the DPDP Act, every document upload, OCR extraction, and export event is cryptographically recorded.
        </p>

        <div className="space-y-2">
          {historyData.recent_activities.map((act) => (
            <div
              key={act.id}
              className="p-2.5 rounded-xl bg-[#0D1527] border border-[#1E2D4A] flex items-center justify-between text-xs"
            >
              <div className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                <span className="font-mono text-cyan-300 uppercase text-[11px]">{act.action}</span>
                <span className="text-slate-400">on {act.resource_type}</span>
              </div>
              <span className="text-slate-500 font-mono text-[10px]">
                {new Date(act.created_at).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


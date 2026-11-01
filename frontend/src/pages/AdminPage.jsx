import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  ShieldAlert,
  Users,
  FolderLock,
  FileText,
  Activity,
  Cpu,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Database
} from 'lucide-react';

export default function AdminPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAdminStats();
  }, []);

  async function loadAdminStats() {
    try {
      setLoading(true);
      const data = await api.getAdminStats();
      setStats(data);
    } catch (err) {
      setError(err.message || 'Failed to load system admin statistics. Admin privileges required.');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-8 text-xs text-slate-400 space-x-2">
        <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
        <span>Loading system telemetry & administrative metrics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-lg mx-auto text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
        <h2 className="text-base font-bold text-white">Access Restricted</h2>
        <p className="text-xs text-slate-400">{error}</p>
      </div>
    );
  }

  const counts = stats?.counts || {};

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div>
        <div className="inline-flex items-center space-x-1.5 text-xs text-red-400 font-semibold mb-1">
          <ShieldAlert className="w-4 h-4" />
          <span>Restricted Administrative Operations</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">System Administration</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Monitor system health, AI processing rates, document processing volume, and system audit events.
        </p>
      </div>

      {/* Health & Engine Status Bar */}
      <div className="glass-panel p-5 rounded-2xl border border-[#1E2D4A] flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center space-x-3">
          <span className="flex items-center space-x-1.5 text-emerald-400 font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>API Status: Operational</span>
          </span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-300">Environment: <strong className="text-white capitalize">{stats.environment}</strong></span>
        </div>

        <div className="flex items-center space-x-4">
          <span className="text-slate-300 flex items-center gap-1">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span>LLM Provider: <strong className="text-cyan-300 uppercase">{stats.llm_provider}</strong></span>
          </span>
          <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30 text-[10px] font-mono">
            {stats.llm_configured ? 'API Key Active' : 'Deterministic Local Adapter Active'}
          </span>
        </div>
      </div>

      {/* Aggregate Counts Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-[#1E2D4A]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Total Users</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white">{counts.total_users || 0}</div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-[#1E2D4A]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Vault Documents</span>
            <FolderLock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white">{counts.total_vault_documents || 0}</div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-[#1E2D4A]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Forms Processed</span>
            <FileText className="w-4 h-4 text-violet-400" />
          </div>
          <div className="text-2xl font-bold text-white">{counts.total_forms_processed || 0}</div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-[#1E2D4A]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">PDFs Generated</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">{counts.total_completed_exports || 0}</div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-[#1E2D4A]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Audit Events</span>
            <Activity className="w-4 h-4 text-yellow-400" />
          </div>
          <div className="text-2xl font-bold text-white">{counts.total_audit_events || 0}</div>
        </div>
      </div>

      {/* Global Audit Log */}
      <div className="glass-panel rounded-2xl border border-[#1E2D4A] overflow-hidden">
        <div className="p-4 border-b border-[#1E2D4A]">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            System Privileged Audit Events Log
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#090D17] text-slate-400 uppercase text-[10px] tracking-wider border-b border-[#1E2D4A]">
              <tr>
                <th className="py-2.5 px-4">Event ID</th>
                <th className="py-2.5 px-4">Action</th>
                <th className="py-2.5 px-4">Resource</th>
                <th className="py-2.5 px-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E2D4A]/50">
              {stats.recent_system_audits?.map((log) => (
                <tr key={log.id} className="hover:bg-[#121C33]/40">
                  <td className="py-2.5 px-4 font-mono text-[11px] text-slate-400">
                    {log.id.slice(0, 8)}...
                  </td>
                  <td className="py-2.5 px-4 font-semibold text-cyan-300 font-mono uppercase text-[11px]">
                    {log.action}
                  </td>
                  <td className="py-2.5 px-4 text-slate-300">{log.resource_type}</td>
                  <td className="py-2.5 px-4 text-slate-400 font-mono text-[11px]">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


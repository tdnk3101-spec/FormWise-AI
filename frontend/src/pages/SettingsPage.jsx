import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  Settings as SettingsIcon,
  ShieldCheck,
  Lock,
  Trash2,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.getSettings();
        setSettings(res);
      } catch (err) {
        console.warn('Failed to load settings:', err);
      }
    }
    load();
  }, []);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6 pb-24 md:pb-12">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Account Settings</h1>
        <p className="text-sm text-slate-400 mt-1">
          Manage your privacy preferences and citizen data rights under India's DPDP Act.
        </p>
      </div>

      <div className="space-y-6">

        {/* DPDP Act Citizen Data Rights */}
        <div className="glass-panel p-6 rounded-2xl border border-[#1E2D4A] space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>DPDP Act 2023 Citizen Protections</span>
          </h3>

          <div className="space-y-3 text-xs text-slate-300">
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#0D1527] border border-[#1E2D4A]">
              <div>
                <span className="font-semibold block text-white">Data Retention Policy</span>
                <span className="text-[11px] text-slate-400">
                  User Controlled: You retain full ownership and can permanently erase your documents at any time.
                </span>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono">
                Active
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-[#0D1527] border border-[#1E2D4A]">
              <div>
                <span className="font-semibold block text-white">AI Model Training Isolation</span>
                <span className="text-[11px] text-slate-400">
                  Zero Training: Personal documents and extracted identity numbers are strictly never used to train public LLM models.
                </span>
              </div>
              <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30 text-[10px] font-mono">
                Guaranteed
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-[#0D1527] border border-[#1E2D4A]">
              <div>
                <span className="font-semibold block text-white">Aadhaar Data Minimization</span>
                <span className="text-[11px] text-slate-400">
                  Automated Masking: Raw 12-digit numbers are truncated to XXXX-XXXX-1234 in UI and logs.
                </span>
              </div>
              <span className="px-2 py-0.5 rounded bg-violet-950 text-violet-300 border border-violet-500/30 text-[10px] font-mono">
                Enforced
              </span>
            </div>
          </div>
        </div>

        {/* Account Deletion */}
        <div className="glass-panel p-6 rounded-2xl border border-red-500/30 space-y-3">
          <h3 className="text-sm font-bold text-red-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span>Danger Zone</span>
          </h3>
          <p className="text-xs text-slate-400">
            Sign out of your session or request complete data deletion.
          </p>
          <button
            onClick={() => {
              if (window.confirm('Sign out of your FormWise AI account?')) {
                logout();
              }
            }}
            className="px-4 py-2 rounded-xl bg-red-950/60 hover:bg-red-900 border border-red-500/40 text-red-300 text-xs font-semibold flex items-center space-x-1.5 transition-all"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Sign Out Session</span>
          </button>
        </div>
      </div>
    </div>
  );
}


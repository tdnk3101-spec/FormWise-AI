import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  FileText,
  FolderLock,
  UploadCloud,
  CheckCircle2,
  Clock,
  ArrowRight,
  Loader2,
  FileCheck,
  Plus
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState([]);
  const [forms, setForms] = useState([]);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        const [docsRes, formsRes] = await Promise.all([
          api.getDocuments().catch(() => []),
          api.getForms().catch(() => []),
        ]);
        setDocuments(docsRes);
        setForms(formsRes);
      } catch (err) {
        console.error('Dashboard load failed:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, []);

  const totalDocs = documents.length;
  const totalForms = forms.length;
  const completedForms = forms.filter((f) => f.status === 'completed').length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-8 pb-24 md:pb-12">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Hello, {user?.full_name?.split(' ')[0] || 'there'}!
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            What would you like to do today?
          </p>
        </div>

        <Link
          to="/forms/upload"
          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white font-semibold text-sm shadow-md shadow-cyan-500/20 active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Upload Form</span>
        </Link>
      </div>

      {/* 3 Main Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Action 1: Upload Form */}
        <Link
          to="/forms/upload"
          className="bg-[#0D1527] p-6 rounded-2xl border border-[#1E2D4A] hover:border-cyan-500/40 transition-all duration-200 group flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 rounded-xl bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4 group-hover:scale-105 transition-transform">
              <UploadCloud className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-white mb-1">
              Upload New Form
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Upload any PDF or take a photo of a paper form. AI detects all the blanks.
            </p>
          </div>
          <div className="mt-5 flex items-center text-xs font-semibold text-cyan-400 group-hover:text-cyan-300">
            <span>Get Started</span>
            <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
          </div>
        </Link>

        {/* Action 2: My Documents */}
        <Link
          to="/vault"
          className="bg-[#0D1527] p-6 rounded-2xl border border-[#1E2D4A] hover:border-violet-500/40 transition-all duration-200 group flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 rounded-xl bg-violet-950/60 border border-violet-500/30 flex items-center justify-center text-violet-400 mb-4 group-hover:scale-105 transition-transform">
              <FolderLock className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-white mb-1">
              My Documents Vault
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Store your certificates (Aadhaar, marksheet, income) once to autofill any form.
            </p>
          </div>
          <div className="mt-5 flex items-center text-xs font-semibold text-violet-400 group-hover:text-violet-300">
            <span>{totalDocs} document{totalDocs === 1 ? '' : 's'} saved</span>
            <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
          </div>
        </Link>

        {/* Action 3: History */}
        <Link
          to="/history"
          className="bg-[#0D1527] p-6 rounded-2xl border border-[#1E2D4A] hover:border-emerald-500/40 transition-all duration-200 group flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 rounded-xl bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-105 transition-transform">
              <FileCheck className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-white mb-1">
              Filled Applications
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              View your completed forms and download ready-to-submit PDFs anytime.
            </p>
          </div>
          <div className="mt-5 flex items-center text-xs font-semibold text-emerald-400 group-hover:text-emerald-300">
            <span>{completedForms} completed</span>
            <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
          </div>
        </Link>
      </div>

      {/* Recent Forms List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white">
            Recent Applications
          </h3>
          {forms.length > 0 && (
            <Link to="/history" className="text-xs font-semibold text-cyan-400 hover:underline">
              View all
            </Link>
          )}
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-slate-400 bg-[#0D1527] rounded-2xl border border-[#1E2D4A] flex items-center justify-center space-x-2">
            <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
            <span>Loading...</span>
          </div>
        ) : forms.length === 0 ? (
          <div className="bg-[#0D1527] p-8 rounded-2xl border border-[#1E2D4A] text-center space-y-3">
            <FileText className="w-8 h-8 text-slate-500 mx-auto" />
            <p className="text-sm font-semibold text-white">No forms uploaded yet</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Upload a form to get started. Our AI will automatically detect blanks and help you fill them.
            </p>
            <Link
              to="/forms/upload"
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold mt-2"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload Form</span>
            </Link>
          </div>
        ) : (
          <div className="bg-[#0D1527] rounded-2xl border border-[#1E2D4A] divide-y divide-[#1E2D4A] overflow-hidden">
            {forms.slice(0, 5).map((form) => (
              <div
                key={form.id}
                className="p-4 hover:bg-[#121C33]/50 transition-colors flex items-center justify-between gap-4"
              >
                <div className="flex items-center space-x-3 overflow-hidden">
                  <div className="w-10 h-10 rounded-xl bg-violet-950/60 border border-violet-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="text-sm font-semibold text-white truncate">{form.title}</h4>
                    <p className="text-xs text-slate-400 truncate">
                      {form.total_pages} page{form.total_pages === 1 ? '' : 's'} • {new Date(form.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 shrink-0">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                      form.status === 'completed'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                        : form.status === 'autofilled'
                        ? 'bg-cyan-950 text-cyan-400 border border-cyan-500/30'
                        : 'bg-yellow-950 text-yellow-400 border border-yellow-500/30'
                    }`}
                  >
                    {form.status}
                  </span>
                  <Link
                    to={`/forms/${form.id}`}
                    className="px-3.5 py-1.5 rounded-xl bg-[#121C33] hover:bg-cyan-600 hover:text-white text-cyan-300 border border-[#1E2D4A] text-xs font-semibold transition-colors"
                  >
                    Open
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

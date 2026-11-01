import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import {
  ShieldCheck,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  FileCheck2,
  Download,
  ArrowLeft,
  Loader2,
  FileText,
  Sparkles,
  ExternalLink
} from 'lucide-react';

export default function ValidationPage() {
  const { id: formId } = useParams();

  const [form, setForm] = useState(null);
  const [validation, setValidation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportResult, setExportResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    runValidation();
  }, [formId]);

  async function runValidation() {
    try {
      setLoading(true);
      setError('');
      const [formData, valData] = await Promise.all([
        api.getForm(formId),
        api.validateForm(formId),
      ]);
      setForm(formData);
      setValidation(valData);
    } catch (err) {
      setError(err.message || 'Validation failed');
    } finally {
      setLoading(false);
    }
  }

  const handleExportPDF = async () => {
    setExporting(true);
    setError('');
    try {
      const res = await api.exportForm(formId);
      setExportResult(res);
    } catch (err) {
      setError(err.message || 'PDF Generation failed');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-8 text-xs text-slate-400 space-x-2">
        <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
        <span>Executing Form Validation & Missing Document Analysis...</span>
      </div>
    );
  }

  const isReady = validation?.is_ready_for_export;
  const errors = validation?.errors || [];
  const warnings = validation?.warnings || [];
  const checklist = validation?.checklist || [];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      {/* Top Nav */}
      <div className="flex items-center justify-between">
        <Link
          to={`/forms/${formId}`}
          className="text-xs text-slate-400 hover:text-white flex items-center space-x-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Form Workspace</span>
        </Link>
        <span className="text-xs text-cyan-400 font-mono font-medium">
          FormWise AI Validation Center
        </span>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-950/50 border border-red-500/40 text-red-200 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Export Status Banner */}
      <div
        className={`glass-panel p-6 rounded-3xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 ${
          isReady
            ? 'border-emerald-500/40 glow-cyan'
            : 'border-yellow-500/40'
        }`}
      >
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            {isReady ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-yellow-400" />
            )}
            <h2 className="text-lg font-bold text-white">
              {isReady
                ? 'Application Validated — Ready for PDF Export'
                : 'Action Required: Fix Mandatory Field Errors'}
            </h2>
          </div>
          <p className="text-xs text-slate-400 max-w-xl">
            {isReady
              ? 'All required fields satisfy standard Indian formatting rules (PIN, mobile, identity numbers). You can now generate the completed PDF.'
              : `${errors.length} blocking error(s) must be corrected before you export the finalized application.`}
          </p>
        </div>

        <div>
          <button
            onClick={handleExportPDF}
            disabled={exporting || !isReady}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-500 hover:from-emerald-500 hover:to-cyan-400 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 flex items-center space-x-2 disabled:opacity-50 transition-all cursor-pointer"
          >
            {exporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating Completed PDF...</span>
              </>
            ) : (
              <>
                <FileCheck2 className="w-4 h-4" />
                <span>Export Completed PDF</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Export Success Modal Card */}
      {exportResult && (
        <div className="glass-panel p-6 rounded-3xl border border-emerald-500/50 bg-emerald-950/20 space-y-4 animate-in fade-in">
          <div className="flex items-center space-x-3 text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
            <h3 className="text-base font-bold text-white">
              PDF Generated Successfully!
            </h3>
          </div>
          <p className="text-xs text-slate-300">
            Your application was processed and {exportResult.total_fields_filled} fields were visually positioned and stamped into the completed PDF.
          </p>
          <div className="p-3 rounded-xl bg-[#070B14] border border-[#1E2D4A] flex items-center justify-between text-xs">
            <span className="font-mono text-cyan-300">{exportResult.filename}</span>
            <a
              href={api.downloadExportUrl(formId, exportResult.export_id)}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold flex items-center space-x-1.5 shadow"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </a>
          </div>
          <p className="text-[10px] text-slate-400 italic">
            * Note: Labelled as a user-prepared draft document for review. Please verify all details prior to physical submission to official authorities.
          </p>
        </div>
      )}

      {/* Two Column Grid: Validation Errors/Warnings & Missing Info Checklist */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column: Errors & Warnings */}
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-[#1E2D4A] space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span>Format & Required Field Errors ({errors.length})</span>
            </h3>

            {errors.length === 0 ? (
              <p className="text-xs text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Zero format errors detected!</span>
              </p>
            ) : (
              <div className="space-y-3">
                {errors.map((err, i) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-xl bg-red-950/30 border border-red-500/30 text-xs space-y-1"
                  >
                    <p className="font-semibold text-red-300">{err.error_message}</p>
                    <p className="text-[11px] text-slate-400">{err.correction_needed}</p>
                    <Link
                      to={`/forms/${formId}`}
                      className="inline-block text-[11px] text-cyan-400 hover:underline pt-1 font-semibold"
                    >
                      Fix in Form Workspace →
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="glass-panel p-6 rounded-2xl border border-[#1E2D4A] space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-yellow-400" />
                <span>Advisory Warnings ({warnings.length})</span>
              </h3>
              <div className="space-y-3">
                {warnings.map((warn, i) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-xl bg-yellow-950/30 border border-yellow-500/30 text-xs space-y-1"
                  >
                    <p className="font-semibold text-yellow-300">{warn.error_message}</p>
                    <p className="text-[11px] text-slate-400">{warn.correction_needed}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Missing Information & Supporting Documents Checklist */}
        <div className="glass-panel p-6 rounded-2xl border border-[#1E2D4A] space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <FileText className="w-4 h-4 text-cyan-400" />
            <span>Preparation & Certificate Checklist</span>
          </h3>
          <p className="text-xs text-slate-400">
            Compare application requirements against your approved personal vault records.
          </p>

          <div className="space-y-2.5">
            {checklist.map((item, i) => (
              <div
                key={i}
                className="p-3 rounded-xl bg-[#0D1527] border border-[#1E2D4A] flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-semibold text-white block">{item.item_name}</span>
                  {item.required_doc_type && (
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Required: {item.required_doc_type}
                    </span>
                  )}
                </div>

                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    item.status === 'available'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                      : 'bg-red-950 text-red-400 border border-red-500/30'
                  }`}
                >
                  {item.status}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-[#1E2D4A]">
            <Link
              to="/vault"
              className="text-xs font-semibold text-cyan-400 hover:underline flex items-center space-x-1"
            >
              <span>Upload more certificates to your vault</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}


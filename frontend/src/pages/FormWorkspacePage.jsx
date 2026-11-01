import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import {
  FileText,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Send,
  Loader2,
  ShieldCheck,
  Check,
  Languages,
  Edit3,
  RefreshCw,
  ExternalLink
} from 'lucide-react';

export default function FormWorkspacePage() {
  const { id: formId } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedField, setSelectedField] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('explainer'); // 'explainer', 'autofill', 'fields'
  const [mobileView, setMobileView] = useState('tools'); // 'preview' or 'tools' (for small phone screens)

  // Explainer & Chat state
  const [explanationData, setExplanationData] = useState(null);
  const [explaining, setExplaining] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // Autofill state
  const [autofillMode, setAutofillMode] = useState('assisted');
  const [autofillRunning, setAutofillRunning] = useState(false);
  const [autofillResults, setAutofillResults] = useState(null);
  const [pendingConfirmations, setPendingConfirmations] = useState({});

  useEffect(() => {
    loadFormData();
  }, [formId]);

  async function loadFormData() {
    try {
      setLoading(true);
      const data = await api.getForm(formId);
      setForm(data);
      if (data.fields && data.fields.length > 0) {
        setSelectedField(data.fields[0]);
        fetchFieldExplanation(data.fields[0].id);
      }
    } catch (err) {
      setError(err.message || 'Failed to load form details');
    } finally {
      setLoading(false);
    }
  }

  // Fetch explanation when field changes
  const fetchFieldExplanation = async (fieldId) => {
    setExplaining(true);
    try {
      const res = await api.explainField(formId, fieldId, 'en');
      setExplanationData(res);
    } catch (err) {
      console.warn('Field explanation error:', err);
    } finally {
      setExplaining(false);
    }
  };

  const handleSelectField = (field) => {
    setSelectedField(field);
    fetchFieldExplanation(field.id);
  };

  const handleUpdateFieldValue = async (fieldId, newVal) => {
    try {
      const updated = await api.updateFormField(formId, fieldId, {
        filled_value: newVal,
        status: newVal ? 'confirmed' : 'pending',
      });
      // Update local state
      setForm((prev) => ({
        ...prev,
        fields: prev.fields.map((f) => (f.id === fieldId ? updated : f)),
      }));
      if (selectedField?.id === fieldId) {
        setSelectedField(updated);
      }
    } catch (err) {
      setError(err.message || 'Failed to update field value');
    }
  };

  // Conversational Assistant Chat
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userText = inputMessage;
    setInputMessage('');
    setChatMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setChatLoading(true);

    try {
      const res = await api.chatFormAssistant(formId, userText, selectedField?.id, language);
      setChatMessages((prev) => [...prev, { sender: 'ai', text: res.reply }]);
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        { sender: 'ai', text: 'Apologies, I encountered an issue. Please try asking again.' },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  // Run Smart Autofill
  const handleTriggerAutofill = async () => {
    setAutofillRunning(true);
    setError('');
    try {
      const res = await api.triggerAutofill(formId, autofillMode);
      setAutofillResults(res);

      // Pre-fill pending confirmations map
      const confMap = {};
      res.suggestions.forEach((s) => {
        if (s.suggested_value) {
          confMap[s.field_id] = {
            value: s.suggested_value,
            confirmed: s.is_auto_filled,
          };
        }
      });
      setPendingConfirmations(confMap);

      // Reload form to reflect auto-filled fields
      const updatedForm = await api.getForm(formId);
      setForm(updatedForm);
    } catch (err) {
      setError(err.message || 'Autofill execution failed');
    } finally {
      setAutofillRunning(false);
    }
  };

  // Confirm Autofill Suggestions Batch
  const handleConfirmBatch = async () => {
    try {
      const confirmations = Object.entries(pendingConfirmations)
        .filter(([_, item]) => item.confirmed && item.value)
        .map(([fId, item]) => ({
          field_id: fId,
          value: item.value,
          status: 'confirmed',
        }));

      await api.confirmAutofill(formId, confirmations);
      const updatedForm = await api.getForm(formId);
      setForm(updatedForm);
      setAutofillResults(null);
    } catch (err) {
      setError(err.message || 'Failed to confirm autofill values');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-8 text-xs text-slate-400 space-x-2">
        <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
        <span>Loading Form Layout and AI Understanding Engine...</span>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="p-8 text-center text-xs text-red-400">
        Form not found. <Link to="/dashboard" className="underline">Back to Dashboard</Link>
      </div>
    );
  }

  const pageFields = form.fields.filter((f) => f.page_number === currentPage);
  const totalPages = form.total_pages || 1;

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-[#070B14] text-slate-100 overflow-hidden">
      {/* Top Workspace Bar */}
      <header className="h-14 border-b border-[#1E2D4A] px-4 flex items-center justify-between bg-[#0B0F19] shrink-0">
        <div className="flex items-center space-x-4">
          <Link to="/dashboard" className="text-xs text-slate-400 hover:text-white flex items-center space-x-1">
            <ChevronLeft className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>
          <div className="h-4 w-[1px] bg-[#1E2D4A]"></div>
          <div>
            <h1 className="text-xs sm:text-sm font-bold text-white truncate max-w-xs sm:max-w-md">
              {form.title}
            </h1>
            <span className="text-[10px] text-cyan-400 font-medium">
              {form.organization_name || 'Verified Form'} • {form.fields?.length || 0} Detected Fields
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Proceed to Validation & Export CTA */}
          <Link
            to={`/forms/${form.id}/validate`}
            className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center space-x-1.5 transition-all"
          >
            <span>Proceed to Validation & PDF</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Mobile View Segmented Toggle Bar */}
      <div className="lg:hidden flex border-b border-[#1E2D4A] bg-[#090D17] text-xs font-semibold shrink-0">
        <button
          onClick={() => setMobileView('preview')}
          className={`flex-1 py-2.5 text-center flex items-center justify-center space-x-1.5 transition-all ${
            mobileView === 'preview'
              ? 'border-b-2 border-cyan-400 text-cyan-300 bg-cyan-950/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Form Preview</span>
        </button>
        <button
          onClick={() => setMobileView('tools')}
          className={`flex-1 py-2.5 text-center flex items-center justify-center space-x-1.5 transition-all ${
            mobileView === 'tools'
              ? 'border-b-2 border-violet-400 text-violet-300 bg-violet-950/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>Fields & Help</span>
        </button>
      </div>

      {/* Main Split Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANEL: Document Page Viewer with Coordinate Bounding Boxes */}
        <div className={`flex-1 flex-col border-r border-[#1E2D4A] bg-[#05080F] overflow-hidden ${mobileView === 'preview' ? 'flex' : 'hidden lg:flex'}`}>
          {/* Page Navigator */}
          <div className="h-10 border-b border-[#1E2D4A] px-4 flex items-center justify-between text-xs bg-[#090D17]">
            <div className="flex items-center space-x-2">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1 rounded hover:bg-slate-800 disabled:opacity-30 text-slate-300"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-slate-300 font-semibold">
                Page {currentPage} of {totalPages}
              </span>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1 rounded hover:bg-slate-800 disabled:opacity-30 text-slate-300"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center space-x-3 text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Confirmed
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-yellow-400"></span> Suggested
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-cyan-400"></span> Active Field
              </span>
            </div>
          </div>

          {/* Page Canvas Container */}
          <div className="flex-1 overflow-auto p-4 sm:p-6 flex items-start justify-center">
            <div className="relative border border-[#1E2D4A] rounded-xl shadow-2xl bg-[#0D1527] overflow-hidden max-w-[850px] w-full">
              {/* High-Resolution Rendered Page Image */}
              <img
                src={api.getFormPagePreviewUrl(form.id, currentPage)}
                alt={`Form Page ${currentPage}`}
                className="w-full h-auto block select-none pointer-events-none"
                onError={(e) => {
                  // Fallback visual canvas if preview render path differs
                  e.target.style.display = 'none';
                }}
              />

              {/* Interactive Bounding Box Overlay for each detected field */}
              {pageFields.map((field) => {
                const isSelected = selectedField?.id === field.id;
                const isConfirmed = field.status === 'confirmed' || field.filled_value;
                const isSuggested = field.status === 'suggested';

                let borderClass = 'border-slate-500/40 bg-slate-900/20';
                if (isSelected) {
                  borderClass = 'border-cyan-400 bg-cyan-500/20 ring-2 ring-cyan-400/50 z-20';
                } else if (isConfirmed) {
                  borderClass = 'border-emerald-500/70 bg-emerald-950/30';
                } else if (isSuggested) {
                  borderClass = 'border-yellow-500/70 bg-yellow-950/30';
                }

                return (
                  <div
                    key={field.id}
                    onClick={() => handleSelectField(field)}
                    style={{
                      position: 'absolute',
                      left: `${field.bbox_x}%`,
                      top: `${field.bbox_y}%`,
                      width: `${Math.max(field.bbox_width, 15)}%`,
                      height: `${Math.max(field.bbox_height, 3.5)}%`,
                    }}
                    className={`border rounded cursor-pointer transition-all flex items-center px-1.5 overflow-hidden text-[10px] ${borderClass}`}
                    title={`${field.label} (${field.filled_value ? 'Filled: ' + field.filled_value : 'Click to explain or fill'})`}
                  >
                    <span className="truncate font-semibold text-white drop-shadow-md">
                      {field.filled_value ? field.filled_value : field.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: AI Assistant, Explainer & Autofill Engine */}
        <div className={`w-full lg:w-[440px] flex-col bg-[#0A101D] border-l border-[#1E2D4A] overflow-hidden shrink-0 ${mobileView === 'tools' ? 'flex' : 'hidden lg:flex'}`}>
          {/* Navigation Tabs */}
          <div className="flex border-b border-[#1E2D4A] text-xs font-semibold bg-[#0B0F19]">
            <button
              onClick={() => setActiveTab('explainer')}
              className={`flex-1 py-3 text-center transition-all flex items-center justify-center space-x-1.5 ${
                activeTab === 'explainer'
                  ? 'border-b-2 border-cyan-400 text-cyan-300 bg-cyan-950/10'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Field Explainer</span>
            </button>
            <button
              onClick={() => setActiveTab('autofill')}
              className={`flex-1 py-3 text-center transition-all flex items-center justify-center space-x-1.5 ${
                activeTab === 'autofill'
                  ? 'border-b-2 border-violet-400 text-violet-300 bg-violet-950/10'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Smart Autofill</span>
            </button>
            <button
              onClick={() => setActiveTab('fields')}
              className={`flex-1 py-3 text-center transition-all flex items-center justify-center space-x-1.5 ${
                activeTab === 'fields'
                  ? 'border-b-2 border-blue-400 text-blue-300 bg-blue-950/10'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>All Fields</span>
            </button>
          </div>

          {/* TAB 1: FIELD EXPLAINER & CONVERSATIONAL ASSISTANT */}
          {activeTab === 'explainer' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {selectedField ? (
                  <>
                    {/* Field Header */}
                    <div className="pb-2 border-b border-[#1E2D4A]">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        Active Form Field:
                      </span>
                      <h3 className="text-sm font-bold text-white">{selectedField.label}</h3>
                    </div>

                    {/* Explanation Cards */}
                    {explaining ? (
                      <div className="p-4 rounded-xl bg-[#0D1527] flex items-center justify-center space-x-2 text-xs text-slate-400">
                        <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                        <span>Loading explanation...</span>
                      </div>
                    ) : explanationData ? (
                      <div className="space-y-3">
                        {/* Meaning */}
                        <div className="p-3.5 rounded-xl bg-[#0D1527] border border-[#1E2D4A] space-y-1">
                          <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">
                            What this field means:
                          </span>
                          <p className="text-xs text-slate-200 leading-relaxed">
                            {explanationData.meaning}
                          </p>
                        </div>

                        {/* Format & Example */}
                        <div className="p-3.5 rounded-xl bg-[#0D1527] border border-[#1E2D4A] space-y-1">
                          <span className="text-[10px] uppercase font-bold text-yellow-400 tracking-wider">
                            Format & Realistic Example:
                          </span>
                          <p className="text-xs font-mono text-slate-300">
                            {explanationData.format_example}
                          </p>
                        </div>

                        {/* Supporting Doc */}
                        {explanationData.supporting_doc && (
                          <div className="p-3.5 rounded-xl bg-[#0D1527] border border-[#1E2D4A] space-y-1">
                            <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                              Required Supporting Certificate:
                            </span>
                            <p className="text-xs text-slate-200">
                              {explanationData.supporting_doc}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : null}

                    {/* Direct Field Value Editor */}
                    <div className="p-3.5 rounded-xl bg-[#121C33]/80 border border-violet-500/40 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-white flex items-center gap-1.5">
                          <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Enter / Edit Field Answer:</span>
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {selectedField.is_required ? '(Mandatory)' : '(Optional)'}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={selectedField.filled_value || ''}
                          onChange={(e) => handleUpdateFieldValue(selectedField.id, e.target.value)}
                          placeholder="Type answer to place into form..."
                          className="flex-1 px-3 py-1.5 bg-[#070B14] border border-[#1E2D4A] rounded-lg text-white text-xs focus:outline-none focus:border-cyan-400"
                        />
                        <button
                          onClick={() => handleUpdateFieldValue(selectedField.id, selectedField.filled_value || '')}
                          className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold"
                        >
                          Save
                        </button>
                      </div>
                    </div>

                    {/* Chat History Container */}
                    <div className="pt-2 border-t border-[#1E2D4A] space-y-2">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        Ask FormWise Assistant:
                      </span>
                      {chatMessages.length === 0 ? (
                        <div className="p-3 rounded-xl bg-[#0D1527]/50 border border-[#1E2D4A] text-[11px] text-slate-400 space-y-1">
                          <p>Common citizen questions:</p>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            <button
                              onClick={() => {
                                setInputMessage('What should I enter here?');
                              }}
                              className="px-2 py-0.5 rounded bg-[#121C33] hover:bg-[#182544] text-[10px] text-cyan-300"
                            >
                              What should I enter?
                            </button>
                            <button
                              onClick={() => {
                                setInputMessage('Which document is required?');
                              }}
                              className="px-2 py-0.5 rounded bg-[#121C33] hover:bg-[#182544] text-[10px] text-cyan-300"
                            >
                              Which document is needed?
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {chatMessages.map((msg, i) => (
                            <div
                              key={i}
                              className={`p-2.5 rounded-xl text-xs ${
                                msg.sender === 'user'
                                  ? 'bg-violet-950/60 border border-violet-500/30 text-violet-200 ml-4'
                                  : 'bg-[#0D1527] border border-[#1E2D4A] text-slate-200 mr-4'
                              }`}
                            >
                              {msg.text}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-slate-500 text-center py-8">
                    Click any field box on the form page to inspect and explain it.
                  </p>
                )}
              </div>

              {/* Chat Input Bar */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-[#1E2D4A] bg-[#090D17] flex gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Ask a question about this form..."
                  className="flex-1 px-3 py-1.5 bg-[#0D1527] border border-[#1E2D4A] rounded-xl text-white text-xs focus:outline-none focus:border-cyan-400"
                />
                <button
                  type="submit"
                  disabled={chatLoading || !inputMessage.trim()}
                  className="p-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-40"
                >
                  {chatLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: SMART AUTOFILL ENGINE */}
          {activeTab === 'autofill' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              <div className="p-4 rounded-2xl bg-[#0D1527] border border-[#1E2D4A] space-y-3">
                <div className="flex items-center space-x-2 text-violet-400 font-bold text-xs uppercase tracking-wider">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <span>Choose Autofill Mode</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    onClick={() => setAutofillMode('assisted')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      autofillMode === 'assisted'
                        ? 'bg-violet-950/60 border-violet-500 text-white'
                        : 'bg-[#070B14] border-[#1E2D4A] text-slate-400'
                    }`}
                  >
                    <span className="block font-bold text-xs">Mode A: Assisted</span>
                    <span className="text-[10px] text-slate-400 leading-tight block mt-1">
                      Suggests values with source badge; user clicks to confirm each field.
                    </span>
                  </button>

                  <button
                    onClick={() => setAutofillMode('automatic')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      autofillMode === 'automatic'
                        ? 'bg-cyan-950/60 border-cyan-500 text-white'
                        : 'bg-[#070B14] border-[#1E2D4A] text-slate-400'
                    }`}
                  >
                    <span className="block font-bold text-xs">Mode B: Automatic</span>
                    <span className="text-[10px] text-slate-400 leading-tight block mt-1">
                      Fills ≥95% confidence non-sensitive fields; flags sensitive items.
                    </span>
                  </button>
                </div>

                <button
                  onClick={handleTriggerAutofill}
                  disabled={autofillRunning}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white font-bold text-xs shadow-md shadow-violet-600/20 flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {autofillRunning ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Matching Profile & Vault Documents...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Match & Autofill From Vault</span>
                    </>
                  )}
                </button>
              </div>

              {/* Autofill Match Suggestions List */}
              {autofillResults && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">Matching Results:</span>
                    <span className="text-[11px] text-cyan-400">
                      {autofillResults.filled_count} Auto-filled • {autofillResults.uncertain_count} Needs Confirmation
                    </span>
                  </div>

                  <div className="space-y-2">
                    {autofillResults.suggestions.map((sugg) => {
                      const fld = form.fields.find((f) => f.id === sugg.field_id);
                      if (!fld || !sugg.suggested_value) return null;
                      const isConfirmed = pendingConfirmations[sugg.field_id]?.confirmed;

                      return (
                        <div
                          key={sugg.field_id}
                          className="p-3 rounded-xl bg-[#0D1527] border border-[#1E2D4A] space-y-1.5"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-white">{fld.label}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-[#121C33] text-cyan-300 font-mono">
                              {Math.round(sugg.confidence * 100)}% match
                            </span>
                          </div>

                          <p className="text-xs font-semibold text-cyan-300">{sugg.suggested_value}</p>
                          <p className="text-[10px] text-slate-400">{sugg.reason}</p>

                          <div className="pt-2 flex items-center justify-between border-t border-[#1E2D4A]/50">
                            <span className="text-[10px] text-slate-500">{sugg.source}</span>
                            <label className="flex items-center space-x-1.5 text-xs text-slate-300 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={!!isConfirmed}
                                onChange={(e) => {
                                  setPendingConfirmations((prev) => ({
                                    ...prev,
                                    [sugg.field_id]: {
                                      ...prev[sugg.field_id],
                                      confirmed: e.target.checked,
                                    },
                                  }));
                                }}
                                className="rounded bg-[#070B14] border-[#1E2D4A] text-violet-600 focus:ring-0"
                              />
                              <span>Confirm Match</span>
                            </label>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <button
                    onClick={handleConfirmBatch}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md flex items-center justify-center space-x-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>Apply Confirmed Matches to Form</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ALL FIELDS LIST */}
          {activeTab === 'fields' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-2">
                All Detected Form Fields ({form.fields.length}):
              </span>
              {form.fields.map((f) => (
                <div
                  key={f.id}
                  onClick={() => handleSelectField(f)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedField?.id === f.id
                      ? 'bg-cyan-950/40 border-cyan-500 text-white'
                      : 'bg-[#0D1527] border-[#1E2D4A] hover:bg-[#121C33] text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold">{f.label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded ${
                        f.filled_value
                          ? 'bg-emerald-950 text-emerald-400'
                          : f.is_required
                          ? 'bg-red-950 text-red-400'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {f.filled_value ? 'Filled' : f.is_required ? 'Required' : 'Optional'}
                    </span>
                  </div>
                  {f.filled_value && (
                    <p className="text-[11px] text-cyan-300 mt-1 truncate">{f.filled_value}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


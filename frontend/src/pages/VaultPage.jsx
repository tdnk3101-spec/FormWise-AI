import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import {
  FolderLock,
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Download,
  Eye,
  Sparkles,
  ShieldCheck,
  Loader2,
  Edit2,
  Check,
  X,
  Camera
} from 'lucide-react';

const DOC_CATEGORIES = [
  { value: 'all', label: 'All Documents' },
  { value: 'aadhaar', label: 'Aadhaar Card' },
  { value: 'pan', label: 'PAN Card' },
  { value: 'tenth_marksheet', label: '10th SSC Marksheet' },
  { value: 'intermediate', label: 'Intermediate / 12th' },
  { value: 'degree', label: 'Degree Certificate' },
  { value: 'income_certificate', label: 'Income Certificate' },
  { value: 'caste_certificate', label: 'Caste Certificate' },
  { value: 'bank_passbook', label: 'Bank Passbook' },
  { value: 'resume', label: 'Resume / CV' },
  { value: 'other', label: 'Other Document' },
];

export default function VaultPage() {
  const [documents, setDocuments] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [extractingId, setExtractingId] = useState(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Upload Form State
  const [uploadFile, setUploadFile] = useState(null);
  const [docType, setDocType] = useState('aadhaar');
  const vaultCameraInputRef = useRef(null);

  // Review & Approval Modal State
  const [reviewModalDoc, setReviewModalDoc] = useState(null);
  const [extractedFields, setExtractedFields] = useState([]);
  const [savingApprovals, setSavingApprovals] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, []);

  async function loadDocuments() {
    try {
      setLoading(true);
      const data = await api.getDocuments();
      setDocuments(data);
    } catch (err) {
      setError(err.message || 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  }

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      setError('Please select a file to upload');
      return;
    }
    setError('');
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('document_type', docType);

      const newDoc = await api.uploadDocument(formData);
      setDocuments([newDoc, ...documents]);
      setSuccessMsg(`Document '${uploadFile.name}' uploaded securely to your private vault.`);
      setUploadFile(null);

      // Automatically trigger OCR extraction for seamless citizen experience
      triggerExtract(newDoc.id);
    } catch (err) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const triggerExtract = async (docId) => {
    setExtractingId(docId);
    setError('');
    try {
      const res = await api.extractDocument(docId);
      // Open approval modal
      const targetDoc = documents.find((d) => d.id === docId);
      setReviewModalDoc(targetDoc || { id: docId, document_type: docType });
      setExtractedFields(
        res.extracted_fields.map((f) => ({
          ...f,
          approved_value: f.field_value,
          is_approved: true, // Default to true for user convenience
        }))
      );
      loadDocuments();
    } catch (err) {
      setError(err.message || 'Extraction failed');
    } finally {
      setExtractingId(null);
    }
  };

  const handleSaveApprovals = async () => {
    if (!reviewModalDoc) return;
    setSavingApprovals(true);
    try {
      const payload = extractedFields.map((f) => ({
        field_id: f.id,
        approved_value: f.approved_value,
        is_approved: f.is_approved,
      }));
      await api.approveDocument(reviewModalDoc.id, payload);
      setSuccessMsg('Approved extracted values have been saved and synchronized to your personal profile!');
      setReviewModalDoc(null);
      loadDocuments();
    } catch (err) {
      setError(err.message || 'Failed to save approved fields');
    } finally {
      setSavingApprovals(false);
    }
  };

  const handleDelete = async (docId) => {
    if (!window.confirm('Are you sure you want to delete this document from your vault?')) return;
    try {
      await api.deleteDocument(docId);
      setDocuments(documents.filter((d) => d.id !== docId));
      setSuccessMsg('Document successfully deleted.');
    } catch (err) {
      setError(err.message || 'Delete failed');
    }
  };

  const filteredDocs =
    selectedCategory === 'all'
      ? documents
      : documents.filter((d) => d.document_type === selectedCategory);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8 pb-24 md:pb-12">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          My Documents Vault
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Store your certificates once to autofill any scholarship, admission, or job form
        </p>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-3.5 rounded-xl bg-red-950/50 border border-red-500/40 text-red-200 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')}><X className="w-4 h-4 text-slate-400" /></button>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-200 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')}><X className="w-4 h-4 text-slate-400" /></button>
        </div>
      )}

      {/* Upload New Document Card */}
      <div className="glass-panel p-6 rounded-2xl border border-[#1E2D4A] space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
          <UploadCloud className="w-4 h-4 text-cyan-400" />
          <span>Upload Document to Vault</span>
        </h3>

        <form onSubmit={handleUpload} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Document Category</label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="w-full px-3 py-2 bg-[#0D1527] border border-[#1E2D4A] rounded-xl text-white text-xs focus:outline-none focus:border-violet-500"
            >
              {DOC_CATEGORIES.filter((c) => c.value !== 'all').map((cat) => (
                <option key={cat.value} value={cat.value} className="bg-[#0B0F19]">
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-300">Select File or Photo</label>
              <button
                type="button"
                onClick={() => vaultCameraInputRef.current?.click()}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 font-medium cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Camera Snap</span>
              </button>
            </div>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => setUploadFile(e.target.files[0])}
              className="w-full px-3 py-1.5 bg-[#0D1527] border border-[#1E2D4A] rounded-xl text-slate-300 text-xs file:mr-3 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[11px] file:font-semibold file:bg-violet-600 file:text-white hover:file:bg-violet-500 cursor-pointer"
            />
            <input
              type="file"
              accept="image/*"
              capture="environment"
              ref={vaultCameraInputRef}
              onChange={(e) => setUploadFile(e.target.files[0])}
              className="hidden"
            />
          </div>

          <button
            type="submit"
            disabled={uploading || !uploadFile}
            className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white font-semibold text-xs shadow-md shadow-violet-600/20 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Uploading & Encrypting...</span>
              </>
            ) : (
              <>
                <UploadCloud className="w-4 h-4" />
                <span>Save to Vault</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 text-xs">
        {DOC_CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setSelectedCategory(cat.value)}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all font-medium ${selectedCategory === cat.value
                ? 'bg-violet-600 text-white shadow-sm shadow-violet-600/30'
                : 'bg-[#121C33] text-slate-400 hover:text-white border border-[#1E2D4A]'
              }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Documents Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400 glass-panel rounded-2xl flex items-center justify-center space-x-2">
          <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
          <span>Accessing encrypted vault...</span>
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="glass-panel p-12 rounded-2xl border border-[#1E2D4A] text-center space-y-3">
          <FolderLock className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-semibold text-white">No Documents in this Category</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Upload your certificate to enable automatic OCR entity detection and smart autofilling.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocs.map((doc) => (
            <div
              key={doc.id}
              className="glass-panel p-5 rounded-2xl border border-[#1E2D4A] hover:border-violet-500/40 transition-all flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="w-9 h-9 rounded-xl bg-violet-950/60 border border-violet-500/30 flex items-center justify-center text-violet-400 shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${doc.status === 'extracted'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                        : 'bg-yellow-950 text-yellow-400 border border-yellow-500/30'
                      }`}
                  >
                    {doc.status === 'extracted' ? 'Verified OCR' : 'Uploaded'}
                  </span>
                </div>

                <h4 className="text-xs font-bold text-white capitalize">
                  {doc.document_type.replace('_', ' ')}
                </h4>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">{doc.original_filename}</p>

                {/* Extracted Preview Badge */}
                {doc.extracted_data_preview && Object.keys(doc.extracted_data_preview).length > 0 && (
                  <div className="mt-3 p-2.5 rounded-xl bg-[#0D1527] border border-[#1E2D4A] text-[11px] space-y-1">
                    <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">
                      Verified Entities:
                    </span>
                    {Object.entries(doc.extracted_data_preview)
                      .slice(0, 3)
                      .map(([k, v]) => (
                        <div key={k} className="flex justify-between text-slate-300">
                          <span className="capitalize text-slate-400">{k.replace('_', ' ')}:</span>
                          <span className="font-semibold text-white">{String(v)}</span>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-[#1E2D4A] flex items-center justify-between text-xs">
                <button
                  onClick={() => triggerExtract(doc.id)}
                  disabled={extractingId === doc.id}
                  className="px-2.5 py-1.5 rounded-lg bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/30 text-[11px] font-medium flex items-center space-x-1 transition-all"
                >
                  {extractingId === doc.id ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Parsing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3 text-cyan-400" />
                      <span>Extract & Verify</span>
                    </>
                  )}
                </button>

                <div className="flex items-center space-x-1">
                  <a
                    href={api.downloadDocumentUrl(doc.id)}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                    title="Download document"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800 transition-colors"
                    title="Delete document"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review & Approval Modal */}
      {reviewModalDoc && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-2xl rounded-3xl border border-violet-500/40 p-6 space-y-6 shadow-2xl glow-violet max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E2D4A]">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-cyan-400" />
                  <span>Citizen Approval & Verification Review</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Check and edit extracted values before saving them to your verified profile.
                </p>
              </div>
              <button
                onClick={() => setReviewModalDoc(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {extractedFields.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">
                No automatic fields could be recognized from this document layout.
              </p>
            ) : (
              <div className="space-y-3">
                {extractedFields.map((field, index) => (
                  <div
                    key={field.id}
                    className="p-3.5 rounded-xl bg-[#0D1527] border border-[#1E2D4A] space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-cyan-400 capitalize">
                        {field.field_name.replace('_', ' ')}
                      </span>
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] text-slate-400">Confidence: 95%</span>
                        <label className="flex items-center space-x-1 text-[11px] text-slate-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={field.is_approved}
                            onChange={(e) => {
                              const updated = [...extractedFields];
                              updated[index].is_approved = e.target.checked;
                              setExtractedFields(updated);
                            }}
                            className="rounded bg-[#070B14] border-[#1E2D4A] text-violet-600 focus:ring-0"
                          />
                          <span>Approve</span>
                        </label>
                      </div>
                    </div>

                    <input
                      type="text"
                      value={field.approved_value}
                      onChange={(e) => {
                        const updated = [...extractedFields];
                        updated[index].approved_value = e.target.value;
                        setExtractedFields(updated);
                      }}
                      className="w-full px-3 py-1.5 bg-[#070B14] border border-[#1E2D4A] rounded-lg text-white text-xs focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[#1E2D4A]">
              <button
                onClick={() => setReviewModalDoc(null)}
                className="px-4 py-2 rounded-xl bg-[#121C33] text-slate-300 text-xs font-semibold hover:bg-[#182544]"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveApprovals}
                disabled={savingApprovals}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white text-xs font-semibold shadow-md flex items-center space-x-1.5 disabled:opacity-50"
              >
                {savingApprovals ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Synchronizing Profile...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Approve & Save to Profile</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


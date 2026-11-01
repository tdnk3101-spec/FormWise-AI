import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import {
  UploadCloud,
  Camera,
  FileText,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ArrowRight,
  X
} from 'lucide-react';

export default function FormUploadPage() {
  const navigate = useNavigate();

  const [file, setFile] = useState(null);
  const [formTitle, setFormTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);

  // Camera State
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      if (!formTitle) {
        setFormTitle(e.dataTransfer.files[0].name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      if (!formTitle) {
        setFormTitle(e.target.files[0].name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const startCamera = async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);
    } catch (err) {
      setError('Camera access not supported or permission denied. Please choose a file instead.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 1280;
    canvas.height = videoRef.current.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      const capturedFile = new File([blob], `form_photo_${Date.now()}.jpg`, {
        type: 'image/jpeg',
      });
      setFile(capturedFile);
      if (!formTitle) {
        setFormTitle('Captured Application Form');
      }
      stopCamera();
    }, 'image/jpeg');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please choose a file or take a photo first');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (formTitle) {
        formData.append('title', formTitle);
      }

      const res = await api.uploadForm(formData);
      navigate(`/forms/${res.id}`);
    } catch (err) {
      setError(err.message || 'Form upload and analysis failed');
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-6 pb-24 md:pb-12">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Upload Form
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Upload a PDF or image of your application form to get started
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-sm flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Upload Box */}
      <div className="bg-[#0D1527] p-6 sm:p-8 rounded-2xl border border-[#1E2D4A] space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Form Name (Optional)
            </label>
            <input
              type="text"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="e.g. Scholarship Application Form"
              className="w-full px-3.5 py-2.5 bg-[#070B14] border border-[#1E2D4A] rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
            />
          </div>

          {/* Camera View Modal or Box */}
          {cameraActive ? (
            <div className="space-y-3">
              <div className="relative rounded-2xl overflow-hidden bg-black aspect-video border border-cyan-500/40">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={stopCamera}
                  className="absolute top-3 right-3 p-2 bg-black/60 rounded-full text-white hover:bg-black/90"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <button
                type="button"
                onClick={capturePhoto}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-500 text-slate-950 font-bold rounded-xl shadow-md flex items-center justify-center space-x-2"
              >
                <Camera className="w-5 h-5" />
                <span>Snap Photo</span>
              </button>
            </div>
          ) : (
            <>
              {/* Drag & Drop Zone */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`p-8 sm:p-10 rounded-2xl border-2 border-dashed text-center transition-all flex flex-col items-center justify-center space-y-3 ${
                  dragActive
                    ? 'border-cyan-400 bg-cyan-950/20'
                    : file
                    ? 'border-emerald-500/50 bg-[#070B14]'
                    : 'border-[#1E2D4A] hover:border-violet-500/50 bg-[#070B14]'
                }`}
              >
                {file ? (
                  <>
                    <div className="w-12 h-12 rounded-xl bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">{file.name}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {(file.size / 1024 / 1024).toFixed(2)} MB • Ready to analyze
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFile(null)}
                      className="text-xs text-red-400 hover:underline pt-1"
                    >
                      Remove file
                    </button>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-xl bg-violet-950/60 border border-violet-500/30 flex items-center justify-center text-violet-400">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">
                        Drag and drop your form file here
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Supports PDF, PNG, JPG (up to 25 MB)
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                      <label className="px-4 py-2 bg-[#121C33] hover:bg-[#182544] border border-[#1E2D4A] rounded-xl text-xs font-semibold text-slate-200 cursor-pointer transition-colors">
                        Browse File
                        <input
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={startCamera}
                        className="px-4 py-2 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/30 rounded-xl text-xs font-semibold text-emerald-300 flex items-center space-x-1.5 transition-colors"
                      >
                        <Camera className="w-4 h-4" />
                        <span>Use Camera</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={!file || loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 active:scale-95 text-white font-bold text-sm shadow-md shadow-cyan-500/20 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Analyzing form with AI...</span>
              </>
            ) : (
              <>
                <span>Analyze & Start Filling</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

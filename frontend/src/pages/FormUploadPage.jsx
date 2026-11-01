import React, { useState, useRef, useEffect } from 'react';
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
  X,
  RefreshCw,
  Smartphone
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
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' or 'user'
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const cameraInputRef = useRef(null);
  const fileInputRef = useRef(null);

  // Attach stream to video element when camera becomes active
  useEffect(() => {
    if (cameraActive && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch((err) => {
        console.warn('Video auto-playback was blocked or interrupted:', err);
      });
    }
  }, [cameraActive]);

  // Clean up camera stream tracks when component unmounts
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

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
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      if (!formTitle) {
        setFormTitle(selectedFile.name.replace(/\.[^/.]+$/, ''));
      }
      stopCamera();
    }
  };

  const startCamera = async (mode = facingMode) => {
    setError('');

    // Check browser support for mediaDevices API
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      // Fallback directly to native phone camera capture input
      if (cameraInputRef.current) {
        cameraInputRef.current.click();
        return;
      }
      setError('Live camera viewfinder is not supported on this browser. Please use the camera picker or choose a file.');
      return;
    }

    try {
      // Stop any existing stream before starting a new one
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      let stream;
      try {
        // Try requested facing mode (ideal constraint ensures fallback on laptops/PCs with single camera)
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: mode },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });
      } catch (firstErr) {
        // Fall back to generic video constraint (e.g. desktop webcam)
        console.warn('Ideal camera constraint failed, falling back to default webcam:', firstErr);
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      streamRef.current = stream;
      setCameraActive(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err) {
      console.error('Camera access error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Camera permission was denied. Please allow camera permissions in your browser bar, or tap "Snap Photo" to use your device camera.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError('No physical camera was detected on this device. Please select a file.');
      } else {
        setError(`Unable to open camera: ${err.message || 'Check camera permissions'}. You can still take a photo using the camera picker.`);
      }

      // If live camera is blocked, offer immediate fallback to native camera
      if (cameraInputRef.current) {
        cameraInputRef.current.click();
      }
    }
  };

  const toggleFacingMode = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (!blob) {
        setError('Could not capture frame. Please try again.');
        return;
      }
      const capturedFile = new File([blob], `captured_form_${Date.now()}.jpg`, {
        type: 'image/jpeg',
      });
      setFile(capturedFile);
      if (!formTitle) {
        setFormTitle('Captured Application Form');
      }
      stopCamera();
    }, 'image/jpeg', 0.95);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please choose an application form file or capture a photo first.');
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
          Upload a PDF or snap a photo of a physical application form to get started
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-sm flex items-start space-x-2.5">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-400 mt-0.5" />
          <div className="flex-1">
            <span>{error}</span>
          </div>
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
              placeholder="e.g. Post-Matric Scholarship Application Form"
              className="w-full px-3.5 py-2.5 bg-[#070B14] border border-[#1E2D4A] rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
            />
          </div>

          {/* Hidden file inputs */}
          <input
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
          <input
            type="file"
            accept="image/*"
            capture="environment"
            ref={cameraInputRef}
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Live Camera Viewfinder */}
          {cameraActive ? (
            <div className="space-y-4">
              <div className="relative rounded-2xl overflow-hidden bg-black border border-cyan-500/50 shadow-2xl">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-auto max-h-[65vh] object-contain bg-black mx-auto"
                />

                {/* Alignment Frame Overlay */}
                <div className="absolute inset-4 sm:inset-8 border-2 border-dashed border-cyan-400/50 rounded-xl pointer-events-none flex items-center justify-center">
                  <span className="bg-black/70 text-cyan-300 text-xs font-medium px-3.5 py-1.5 rounded-full border border-cyan-500/30 backdrop-blur-sm shadow-md">
                    Position document inside frame
                  </span>
                </div>

                {/* Camera Overlay Controls */}
                <div className="absolute top-3 right-3 flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={toggleFacingMode}
                    className="p-2.5 bg-black/70 hover:bg-black/90 text-white rounded-full transition-colors backdrop-blur-sm border border-white/10"
                    title="Flip camera (front / back)"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="p-2.5 bg-black/70 hover:bg-black/90 text-white rounded-full transition-colors backdrop-blur-sm border border-white/10"
                    title="Close camera"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Action Buttons inside Camera Mode */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="py-3.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 active:scale-95 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center space-x-2 transition-all cursor-pointer"
                >
                  <Camera className="w-5 h-5" />
                  <span>Snap Form Photo</span>
                </button>
                <button
                  type="button"
                  onClick={stopCamera}
                  className="py-3.5 px-4 bg-[#121C33] hover:bg-[#182544] text-slate-300 font-semibold rounded-xl border border-[#1E2D4A] transition-colors"
                >
                  Cancel
                </button>
              </div>
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
                      className="text-xs text-red-400 hover:underline pt-1 cursor-pointer"
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
                        Upload or scan your application form
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Supports PDF, PNG, JPG (up to 25 MB)
                      </p>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap items-center justify-center gap-2.5 pt-3">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2.5 bg-[#121C33] hover:bg-[#182544] border border-[#1E2D4A] rounded-xl text-xs font-semibold text-slate-200 transition-colors flex items-center space-x-1.5 cursor-pointer"
                      >
                        <FileText className="w-4 h-4 text-slate-400" />
                        <span>Browse File</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => startCamera()}
                        className="px-4 py-2.5 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/30 rounded-xl text-xs font-semibold text-cyan-300 flex items-center space-x-1.5 transition-colors cursor-pointer"
                      >
                        <Camera className="w-4 h-4" />
                        <span>Live Camera</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => cameraInputRef.current?.click()}
                        className="px-4 py-2.5 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/30 rounded-xl text-xs font-semibold text-emerald-300 flex items-center space-x-1.5 transition-colors cursor-pointer"
                      >
                        <Smartphone className="w-4 h-4" />
                        <span>Snap Photo</span>
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
                <span>Analyzing form layout and fields with AI...</span>
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

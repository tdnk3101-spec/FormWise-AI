import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  ShieldCheck,
  Zap,
  CheckCircle2,
  FolderLock,
  Camera,
  Sparkles,
  ArrowRight,
  HelpCircle,
  FileCheck,
  AlertCircle,
  Lock,
  ChevronDown
} from 'lucide-react';
import Logo from '../components/common/Logo';

export default function LandingPage() {
  const [activeFaq, setActiveFaq] = useState(null);
  const [autofillDemoMode, setAutofillDemoMode] = useState('assisted');

  const faqs = [
    {
      q: 'How does FormWise AI help with Indian scholarship and admission forms?',
      a: 'FormWise AI scans both digital and physical paper forms, identifies each blank input field, translates official jargon into plain English and Telugu, matches your verified documents from your personal vault, and generates a clean, completed PDF ready for review and submission.'
    },
    {
      q: 'Is my personal data and Aadhaar/PAN secure?',
      a: 'Absolutely. FormWise AI strictly adheres to India’s Digital Personal Data Protection (DPDP) Act 2023. We store documents in private isolated storage, automatically mask sensitive identity numbers (showing only XXXX-XXXX-1234), never expose raw numbers in logs, and never train AI models on your personal certificates.'
    },
    {
      q: 'What is the difference between Assisted and Automatic Autofill?',
      a: 'In Assisted Autofill, every matching value from your vault is presented with its verified source document and requires your explicit click to accept or edit. In Smart Automatic Autofill, non-sensitive fields with over 95% confidence are filled automatically, while sensitive financial, caste, and identity fields still require your confirmation.'
    },
    {
      q: 'Does it support scanned paper forms or mobile camera photos?',
      a: 'Yes! You can upload multi-page PDFs, camera photos, or scanned images. Our computer vision layout analyzer locates blanks, lines, and boxes to place your filled answers accurately at their exact page coordinates.'
    },
    {
      q: 'Can I get explanations in Telugu (తెలుగు)?',
      a: 'Yes. FormWise AI features native Telugu explanations and conversational assistant support, allowing students and parents to understand complex criteria, required certificates, and instructions in their mother tongue.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 overflow-hidden">
      {/* Background Decorative Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-violet-600/15 via-blue-600/10 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Hero Section */}
      <section className="relative pt-12 sm:pt-20 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        {/* Extraordinary Glowing Logo in Hero */}
        <div className="flex justify-center mb-6">
          <Logo size="lg" showTagline={false} animated={true} />
        </div>

        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-violet-950/60 to-blue-950/60 border border-violet-500/30 text-violet-300 text-xs font-semibold mb-6 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>India-First Intelligent Application Assistant</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-6">
          Understand. Fill. Verify. <br />
          <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400 bg-clip-text text-transparent">
            Apply with Confidence.
          </span>
        </h1>

        <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-300 leading-relaxed mb-8 font-medium">
          Tired of complicated instructions, repeated manual data entry, and form rejections? FormWise AI scans your forms, understands every blank, matches your verified personal vault, and autofills your applications with total accuracy.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/register"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white font-semibold shadow-lg shadow-violet-600/25 transition-all flex items-center justify-center space-x-2 text-sm"
          >
            <span>Start Free Application</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/forms/upload"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#121C33] hover:bg-[#182544] border border-[#1E2D4A] text-slate-200 font-semibold transition-all flex items-center justify-center space-x-2 text-sm"
          >
            <Camera className="w-4 h-4 text-cyan-400" />
            <span>Upload or Scan Form</span>
          </Link>
        </div>

        {/* Form Category Badges */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-400">
          <span className="px-3 py-1 rounded-full bg-[#121C33]/70 border border-[#1E2D4A]">🎓 Scholarships (ePASS, NSP)</span>
          <span className="px-3 py-1 rounded-full bg-[#121C33]/70 border border-[#1E2D4A]">🏛️ College Admissions</span>
          <span className="px-3 py-1 rounded-full bg-[#121C33]/70 border border-[#1E2D4A]">📄 Income & Caste Certificates</span>
          <span className="px-3 py-1 rounded-full bg-[#121C33]/70 border border-[#1E2D4A]">💼 Job Applications</span>
          <span className="px-3 py-1 rounded-full bg-[#121C33]/70 border border-[#1E2D4A]">🏦 Banking & DBT Grants</span>
        </div>
      </section>

      {/* How It Works (4-Step Pipeline) */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#1E2D4A]/60">
        <div className="text-center mb-16">
          <h2 className="text-xs uppercase font-bold tracking-widest text-cyan-400 mb-2">Step-by-Step Intelligence</h2>
          <h3 className="text-3xl font-bold text-white">How FormWise AI Transforms Applications</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Step 1 */}
          <div className="glass-panel p-6 rounded-2xl relative group hover:border-violet-500/50 transition-all">
            <div className="w-10 h-10 rounded-xl bg-violet-600/20 text-violet-400 flex items-center justify-center font-bold text-lg mb-4 border border-violet-500/30">
              1
            </div>
            <h4 className="text-base font-semibold text-white mb-2">Upload or Scan</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Upload any PDF or take a phone camera snapshot of a physical paper application form.
            </p>
          </div>

          {/* Step 2 */}
          <div className="glass-panel p-6 rounded-2xl relative group hover:border-blue-500/50 transition-all">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-lg mb-4 border border-blue-500/30">
              2
            </div>
            <h4 className="text-base font-semibold text-white mb-2">AI Field Detection</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Our vision engine maps every input box, blank line, and label. Click any field for bilingual explanations in Telugu or English.
            </p>
          </div>

          {/* Step 3 */}
          <div className="glass-panel p-6 rounded-2xl relative group hover:border-cyan-500/50 transition-all">
            <div className="w-10 h-10 rounded-xl bg-cyan-600/20 text-cyan-400 flex items-center justify-center font-bold text-lg mb-4 border border-cyan-500/30">
              3
            </div>
            <h4 className="text-base font-semibold text-white mb-2">Vault Smart Autofill</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              FormWise pulls approved details from your personal certificates and autofills fields with clear source references.
            </p>
          </div>

          {/* Step 4 */}
          <div className="glass-panel p-6 rounded-2xl relative group hover:border-emerald-500/50 transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center font-bold text-lg mb-4 border border-emerald-500/30">
              4
            </div>
            <h4 className="text-base font-semibold text-white mb-2">Verify & Export PDF</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Rule engines check 10-digit mobile, 6-digit PIN, and missing certificates. Generate completed, printable PDFs instantly.
            </p>
          </div>
        </div>
      </section>

      {/* Interactive Autofill Mode Demonstration */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="glass-panel p-8 rounded-3xl border border-[#1E2D4A] glow-violet">
          <div className="text-center mb-8">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-violet-950/60 border border-violet-500/30 text-violet-300 text-xs mb-3">
              <Zap className="w-3.5 h-3.5 text-yellow-400" />
              <span>Interactive Simulator</span>
            </div>
            <h3 className="text-2xl font-bold text-white">Experience Dual Autofill Modes</h3>
            <p className="text-xs text-slate-400 mt-1">Choose how much autonomy you want FormWise AI to have.</p>

            {/* Mode Switcher */}
            <div className="inline-flex mt-6 p-1 rounded-xl bg-[#070B14] border border-[#1E2D4A]">
              <button
                onClick={() => setAutofillDemoMode('assisted')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                  autofillDemoMode === 'assisted'
                    ? 'bg-violet-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Mode A: Assisted Autofill
              </button>
              <button
                onClick={() => setAutofillDemoMode('automatic')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                  autofillDemoMode === 'automatic'
                    ? 'bg-cyan-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Mode B: Smart Automatic Autofill
              </button>
            </div>
          </div>

          {/* Sample Form Card */}
          <div className="space-y-4">
            {/* Field 1: Name */}
            <div className="p-4 rounded-xl bg-[#0D1527] border border-[#1E2D4A] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-semibold text-slate-300">Applicant Full Name</span>
                <p className="text-sm font-medium text-white">RAMESH KUMAR REDDY</p>
                <span className="text-[10px] text-cyan-400 flex items-center gap-1 mt-0.5">
                  <CheckCircle2 className="w-3 h-3" /> Source: 10th Class SSC Certificate (99% confidence)
                </span>
              </div>
              <div className="flex items-center gap-2">
                {autofillDemoMode === 'assisted' ? (
                  <span className="px-2.5 py-1 rounded bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 text-[11px] font-semibold">
                    Awaiting Click to Confirm
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Auto-Filled
                  </span>
                )}
              </div>
            </div>

            {/* Field 2: Annual Income (Sensitive) */}
            <div className="p-4 rounded-xl bg-[#0D1527] border border-[#1E2D4A] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-semibold text-slate-300">Annual Family Income</span>
                <p className="text-sm font-medium text-white">₹ 1,50,000</p>
                <span className="text-[10px] text-yellow-400 flex items-center gap-1 mt-0.5">
                  <ShieldCheck className="w-3 h-3" /> Source: Income Certificate (MRO/Tahsildar)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 text-[11px] font-semibold">
                  Explicit Confirmation Required (Sensitive)
                </span>
              </div>
            </div>

            {/* Field 3: Aadhaar Number (Masked) */}
            <div className="p-4 rounded-xl bg-[#0D1527] border border-[#1E2D4A] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-semibold text-slate-300">Aadhaar Identity Number</span>
                <p className="text-sm font-mono text-cyan-300">XXXX-XXXX-1245</p>
                <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
                  <Lock className="w-3 h-3" /> Protected by UIDAI Data Minimization & DPDP Act
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30 text-[11px] font-semibold">
                  Securely Masked
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Multilingual Support Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#1E2D4A]/60">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-950/60 border border-blue-500/30 text-blue-300 text-xs mb-3">
              <Languages className="w-3.5 h-3.5 text-cyan-400" />
              <span>Native Language Explanations</span>
            </div>
            <h3 className="text-3xl font-bold text-white mb-4">
              Clear Explanations in <span className="text-cyan-400">తెలుగు (Telugu)</span> & English
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-6">
              Official Indian forms often use complicated administrative jargon like "Creamy Layer", "Nativity", "Competent Authority", or "DBT Seeding". FormWise AI explains every single term in simple words so students and parents never make mistakes.
            </p>
            <div className="space-y-3">
              <div className="flex items-start space-x-3 text-xs text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>Original official form labels are preserved side-by-side with translated explanations.</span>
              </div>
              <div className="flex items-start space-x-3 text-xs text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>Conversational Q&A assistant answers "Where can I find this?" and "Which certificate is needed?".</span>
              </div>
              <div className="flex items-start space-x-3 text-xs text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>Personal identity names and certificate numbers are never mistranslated.</span>
              </div>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-[#1E2D4A] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E2D4A]">
              <span className="text-xs font-semibold text-slate-300">Field Explainer Modal Preview</span>
              <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 text-[10px] font-mono">Telugu / English</span>
            </div>
            <div className="space-y-2">
              <span className="text-xs text-slate-400">Field Label:</span>
              <p className="text-sm font-bold text-white">Annual Family Income / వార్షిక కుటుంబ ఆదాయం</p>
            </div>
            <div className="p-3 rounded-xl bg-[#0D1527] border border-[#1E2D4A] text-xs space-y-2">
              <p className="text-cyan-300 font-medium">తెలుగు వివరణ:</p>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                మీసేవ లేదా తహశీల్దార్ జారీ చేసిన ఆదాయ సర్టిఫికేట్‌లోని మొత్తం వార్షిక ఆదాయాన్ని నమోదు చేయండి. స్కాలర్‌షిప్ కోసం సాధారణంగా ₹2.5 లక్షల లోపు ఉండాలి.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-[#0D1527] border border-[#1E2D4A] text-xs space-y-1">
              <p className="text-slate-400 text-[10px] uppercase font-semibold">Required Supporting Document:</p>
              <p className="text-white text-xs font-medium">Income Certificate issued by Revenue Authority (Tahsildar/MRO)</p>
            </div>
          </div>
        </div>
      </section>

      {/* Security & DPDP Compliance Section */}
      <section id="security" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#1E2D4A]/60">
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Digital Personal Data Protection Act (DPDP) 2023 Compliant</span>
          </div>
          <h3 className="text-3xl font-bold text-white">Your Privacy is Non-Negotiable</h3>
          <p className="text-xs text-slate-400 mt-2 max-w-xl mx-auto">
            We built FormWise AI around data minimization, citizen ownership, and zero-compromise encryption.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-panel p-6 rounded-2xl border border-[#1E2D4A]">
            <FolderLock className="w-8 h-8 text-cyan-400 mb-4" />
            <h4 className="text-base font-semibold text-white mb-2">Private Isolated Storage</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every document is encrypted at rest and accessible exclusively by its authenticated owner via short-lived, signed URLs.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-[#1E2D4A]">
            <Lock className="w-8 h-8 text-violet-400 mb-4" />
            <h4 className="text-base font-semibold text-white mb-2">Masked Identity Numbers</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              In accordance with UIDAI and national guidelines, full Aadhaar and PAN numbers are never printed in plaintext or logged.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-[#1E2D4A]">
            <FileCheck className="w-8 h-8 text-emerald-400 mb-4" />
            <h4 className="text-base font-semibold text-white mb-2">Citizen Consent & Approval</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              No extracted value is saved to your permanent profile without your explicit preview and approval. Delete any document at will.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto border-t border-[#1E2D4A]/60">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold text-white mb-2">Frequently Asked Questions</h3>
          <p className="text-xs text-slate-400">Everything you need to know about FormWise AI.</p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="glass-panel rounded-xl border border-[#1E2D4A] overflow-hidden transition-all"
            >
              <button
                onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                className="w-full p-4 text-left flex items-center justify-between text-sm font-semibold text-white hover:text-cyan-300 transition-colors"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform ${activeFaq === idx ? 'rotate-180 text-cyan-400' : ''}`}
                />
              </button>
              {activeFaq === idx && (
                <div className="p-4 pt-0 text-xs text-slate-300 leading-relaxed border-t border-[#1E2D4A]/50 bg-[#0D1527]/50">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Future Pricing Preview */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto border-t border-[#1E2D4A]/60 text-center">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-950/60 border border-blue-500/30 text-blue-300 text-xs mb-3">
          <span>Public Launch Period</span>
        </div>
        <h3 className="text-2xl font-bold text-white mb-3">100% Free for Students & Citizens</h3>
        <p className="text-xs text-slate-400 max-w-xl mx-auto mb-8">
          All document vaulting, OCR extraction, AI field explanations, and completed PDF exports are completely unrestricted during our launch.
        </p>

        <div className="inline-flex items-center justify-center p-6 rounded-2xl bg-[#0D1527] border border-[#1E2D4A] max-w-md w-full">
          <div>
            <span className="text-2xl font-bold text-white">₹0</span>
            <span className="text-xs text-slate-400"> / Free Citizen Access</span>
            <p className="text-[11px] text-slate-400 mt-2">
              Includes unlimited form uploads, secure vault documents, assisted autofill & PDF downloads.
            </p>
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
        <div className="glass-panel p-12 rounded-3xl border border-violet-500/30 glow-violet relative overflow-hidden">
          <h3 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
            Ready to Complete Your Applications Without Stress?
          </h3>
          <p className="text-sm text-slate-300 max-w-xl mx-auto mb-8 leading-relaxed">
            Join thousands of students and citizens simplifying scholarship, college, and government scheme applications.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center space-x-2 px-8 py-4 rounded-xl bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white font-bold text-sm shadow-xl shadow-violet-600/30 transition-all"
          >
            <span>Create Your Free Account</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}


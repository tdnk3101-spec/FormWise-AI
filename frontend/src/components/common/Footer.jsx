import React from 'react';
import { ShieldCheck, Lock } from 'lucide-react';
import Logo from './Logo';

export default function Footer() {
  return (
    <footer className="border-t border-[#1E2D4A] bg-[#070B14] py-12 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="space-y-3">
            <Logo size="md" showTagline={false} />
            <p className="text-slate-400 leading-relaxed text-[11px]">
              India's intelligent document intelligence and application automation assistant. Understand every field, autofill with verified certificates, and apply with confidence.
            </p>
          </div>

          {/* Supported Applications */}
          <div>
            <h4 className="text-white font-semibold mb-3 text-xs uppercase tracking-wider">Supported Domains</h4>
            <ul className="space-y-2 text-[11px]">
              <li>National & State Scholarships (ePASS, NSP)</li>
              <li>College & University Admissions</li>
              <li>Government Schemes & Direct Benefit Transfers</li>
              <li>Employment & Competitive Exam Forms</li>
              <li>Income, Caste & Residence Certificates</li>
            </ul>
          </div>

          {/* Privacy & Compliance */}
          <div>
            <h4 className="text-white font-semibold mb-3 text-xs uppercase tracking-wider">Privacy & Protection</h4>
            <ul className="space-y-2 text-[11px]">
              <li className="flex items-center space-x-1.5 text-cyan-400">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span>India DPDP Act 2023 Architecture</span>
              </li>
              <li className="flex items-center space-x-1.5 text-slate-400">
                <Lock className="w-3.5 h-3.5 shrink-0" />
                <span>Private Vault & Masked Identity Numbers</span>
              </li>
              <li>Explicit Approval Before Value Storage</li>
              <li>Strict User Ownership & Deletion Rights</li>
            </ul>
          </div>

          {/* Language & Info */}
          <div>
            <h4 className="text-white font-semibold mb-3 text-xs uppercase tracking-wider">Multilingual Access</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
              Full English and Telugu (తెలుగు) field explanations with voice & chat assistant. Expanding soon to all 22 official languages.
            </p>
            <span className="inline-block px-2.5 py-1 rounded bg-[#121C33] border border-[#1E2D4A] text-slate-300 text-[10px]">
              v1.0.0 Production Release
            </span>
          </div>
        </div>

        <div className="pt-8 border-t border-[#1E2D4A]/60 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500">
          <p>© {new Date().getFullYear()} FormWise AI. All rights reserved. Made for Indian Citizens.</p>
          <div className="flex space-x-6 mt-4 sm:mt-0">
            <a href="#privacy" className="hover:text-slate-300">Privacy Policy</a>
            <a href="#terms" className="hover:text-slate-300">Terms of Service</a>
            <a href="#security" className="hover:text-slate-300">Security Architecture</a>
          </div>
        </div>
      </div>
    </footer>
  );
}


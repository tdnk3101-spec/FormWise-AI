import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';

export default function Logo({ size = 'md', showTagline = true, showText = true, animated = true }) {
  const { t } = useLanguage();

  // Size configurations
  const sizes = {
    sm: { icon: 'w-8 h-8', text: 'text-lg', badge: 'text-[9px] px-1.5 py-0.5', sub: 'text-[9px]' },
    md: { icon: 'w-10 h-10', text: 'text-xl', badge: 'text-[10px] px-2 py-0.5', sub: 'text-[10px]' },
    lg: { icon: 'w-14 h-14', text: 'text-2xl sm:text-3xl', badge: 'text-xs px-2.5 py-1', sub: 'text-xs' },
    xl: { icon: 'w-20 h-20', text: 'text-3xl sm:text-4xl', badge: 'text-sm px-3 py-1', sub: 'text-sm' }
  };

  const currentSize = sizes[size] || sizes.md;

  return (
    <div className="flex items-center space-x-3 group select-none">
      {/* Extraordinary Glowing SVG Icon */}
      <div className={`relative ${currentSize.icon} flex items-center justify-center`}>
        {/* Animated Ambient Blur Glow */}
        <div
          className={`absolute -inset-1 rounded-2xl bg-gradient-to-r from-violet-600 via-cyan-400 to-amber-400 opacity-60 blur-md group-hover:opacity-100 transition duration-500 ${
            animated ? 'animate-pulse' : ''
          }`}
        />

        {/* Outer Hexagonal Shield with Holographic Gradient */}
        <svg
          viewBox="0 0 100 100"
          className="relative w-full h-full drop-shadow-2xl transition-transform duration-300 group-hover:scale-105"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8B5CF6" />
              <stop offset="50%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#06B6D4" />
            </linearGradient>

            <linearGradient id="goldAccent" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#FCD34D" />
            </linearGradient>

            <linearGradient id="innerGlow" x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="#1E293B" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#0B0F19" stopOpacity="0.95" />
            </linearGradient>

            <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Hexagon Shield Frame */}
          <polygon
            points="50,4 90,26 90,74 50,96 10,74 10,26"
            fill="url(#innerGlow)"
            stroke="url(#shieldGrad)"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />

          {/* Inner Accent Ring */}
          <polygon
            points="50,11 83,29 83,71 50,89 17,71 17,29"
            fill="none"
            stroke="url(#shieldGrad)"
            strokeWidth="1"
            strokeDasharray="4 3"
            opacity="0.4"
          />

          {/* Stylized Modern 'F' + Smart Document Quill */}
          {/* Vertical Backbone of 'F' */}
          <rect
            x="32"
            y="26"
            width="8"
            height="48"
            rx="4"
            fill="url(#shieldGrad)"
            filter="url(#neonGlow)"
          />

          {/* Top Wing of 'F' (Document Header fold) */}
          <path
            d="M32 26 C42 26, 64 26, 70 26 C73 26, 74 29, 72 32 C68 38, 54 38, 32 38 Z"
            fill="url(#shieldGrad)"
          />

          {/* Middle Wing of 'F' (Smart Pen / Data Wave) */}
          <path
            d="M32 46 C40 46, 56 46, 61 46 C63 46, 64 48, 62 51 C58 56, 48 56, 32 56 Z"
            fill="url(#goldAccent)"
          />

          {/* Verified Spark / AI Intelligence Star */}
          <circle cx="68" cy="68" r="7" fill="url(#goldAccent)" filter="url(#neonGlow)" />
          <path
            d="M68 63 L70 67 L74 68 L70 69 L68 73 L66 69 L62 68 L66 67 Z"
            fill="#FFFFFF"
          />
        </svg>
      </div>

      {/* Brand Typography */}
      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center space-x-1.5">
            <span className={`${currentSize.text} font-extrabold tracking-tight text-white group-hover:text-cyan-200 transition-colors`}>
              FormWise
            </span>
            <span
              className={`${currentSize.badge} font-bold rounded-full bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-500 text-white shadow-md shadow-cyan-500/20 border border-cyan-400/30 uppercase tracking-wider`}
            >
              AI
            </span>
          </div>

          {showTagline && (
            <span className={`${currentSize.sub} text-slate-400 font-medium tracking-wide -mt-0.5 line-clamp-1`}>
              {t('tagline')}
            </span>
          )}
        </div>
      )}
    </div>
  );
}


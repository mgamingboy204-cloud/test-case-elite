'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function MobileEntry() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  return (
    <div className="relative w-full min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] overflow-hidden flex flex-col">
      {/* Background gradient accent - subtle and elegant */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[var(--accent-primary)]/5 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-gradient-to-tr from-[var(--accent-primary)]/3 to-transparent rounded-full blur-3xl" />
      </div>

      {/* Safe area aware content */}
      <div className="relative z-10 flex flex-col h-full px-6 pt-safe pb-safe">
        {/* Top spacing and logo/branding area */}
        <div className="pt-8 sm:pt-12">
          <div className="flex items-center justify-center mb-16">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full border-2 border-[var(--accent-primary)] flex items-center justify-center mb-3">
                <span className="text-lg font-semibold font-serif text-[var(--accent-primary)]">E</span>
              </div>
              <span className="text-xs tracking-widest text-[var(--text-tertiary)] font-sans">ELITE</span>
            </div>
          </div>
        </div>

        {/* Main content - centered vertically */}
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8 py-12">
          {/* Tagline */}
          <div className="space-y-4 max-w-sm">
            <h1 className="text-4xl sm:text-5xl font-serif font-bold leading-tight text-[var(--text-primary)]">
              Connect with <span className="text-[var(--accent-primary)]">Intention</span>
            </h1>
            <p className="text-base sm:text-lg text-[var(--text-secondary)] font-light leading-relaxed">
              Meet individuals who share your values. Premium, curated connections.
            </p>
          </div>

          {/* Visual element - minimalist */}
          <div className="w-24 h-24 rounded-2xl border border-[var(--border-color)] flex items-center justify-center bg-[var(--bg-secondary)]/50 backdrop-blur-sm">
            <svg className="w-12 h-12 text-[var(--accent-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2-1m0 0L16 4m2 3v2.5M4 7l2-1m0 0l2-1m-2 1v2.5" />
            </svg>
          </div>
        </div>

        {/* Bottom actions - respecting safe areas */}
        <div className="space-y-3 pb-8">
          {/* Primary CTA - Get Started */}
          <Link
            href="/onboarding"
            className="w-full py-4 px-6 bg-[var(--accent-primary)] text-[var(--bg-primary)] rounded-xl font-semibold text-center transition-all duration-300 hover:opacity-90 active:scale-95 flex items-center justify-center font-sans"
          >
            Get Started
          </Link>

          {/* Secondary action - Login */}
          <Link
            href="/login"
            className="w-full py-4 px-6 border border-[var(--border-color)] text-[var(--text-primary)] rounded-xl font-medium text-center transition-all duration-300 hover:bg-[var(--bg-secondary)] active:scale-95 flex items-center justify-center font-sans"
          >
            Login
          </Link>

          {/* Terms hint */}
          <p className="text-xs text-[var(--text-tertiary)] pt-4 px-4">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}

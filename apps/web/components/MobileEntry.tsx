'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function MobileEntry() {
  const [isMounted, setIsMounted] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowInstallPrompt(false);
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismissInstall = () => {
    setShowInstallPrompt(false);
  };

  if (!isMounted) return null;

  return (
    <div className="relative w-full min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] overflow-hidden flex flex-col">
      {/* Minimal background accent - very subtle */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute top-1/3 right-0 w-80 h-80 bg-[var(--accent-primary)] rounded-full blur-3xl opacity-5" />
      </div>

      {/* Safe area content container */}
      <div className="relative z-10 flex flex-col h-full px-6 pt-safe pb-safe">
        {/* Header with branding */}
        <div className="pt-6 sm:pt-8 mb-8">
          <div className="flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 rounded-2xl border border-[var(--border-color)] flex items-center justify-center bg-[var(--bg-secondary)]">
                <span className="text-2xl font-serif font-bold text-[var(--accent-primary)]">E</span>
              </div>
              <span className="text-xs tracking-widest text-[var(--text-tertiary)] font-medium">ELITE</span>
            </div>
          </div>
        </div>

        {/* Main content area - vertically centered */}
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-12 py-8">
          {/* Premium headline */}
          <div className="space-y-6 max-w-xl">
            <h1 className="text-5xl sm:text-6xl font-serif font-bold leading-tight text-[var(--text-primary)]">
              <span>Connect with</span>
              <br />
              <span className="text-[var(--accent-primary)]">Intention</span>
            </h1>
            <p className="text-base sm:text-lg text-[var(--text-secondary)] font-light leading-relaxed">
              Meet individuals who share your values. Premium, curated connections for meaningful relationships.
            </p>
          </div>

          {/* Elegant visual divider */}
          <div className="w-12 h-px bg-[var(--accent-primary)]" />
        </div>

        {/* Action buttons section */}
        <div className="space-y-4 pb-8">
          {/* Primary CTA */}
          <Link
            href="/onboarding"
            className="w-full py-4 px-6 bg-[var(--accent-primary)] text-[var(--bg-primary)] rounded-lg font-serif font-semibold text-center transition-all duration-200 hover:opacity-90 active:scale-98 flex items-center justify-center"
          >
            Get Started
          </Link>

          {/* Secondary CTA */}
          <Link
            href="/login"
            className="w-full py-4 px-6 border border-[var(--border-color)] text-[var(--text-primary)] rounded-lg font-medium text-center transition-all duration-200 hover:bg-[var(--bg-secondary)] active:scale-98 flex items-center justify-center"
          >
            Login
          </Link>

          {/* Install App prompt - only show if not installed and prompt available */}
          {showInstallPrompt && !isInstalled && (
            <div className="mt-6 pt-6 border-t border-[var(--border-color)]">
              <div className="space-y-3">
                <div className="text-left">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">
                    Install Elite
                  </h3>
                  <p className="text-xs text-[var(--text-tertiary)]">
                    Add Elite to your home screen for faster access and a native app experience
                  </p>
                </div>
                <button
                  onClick={handleInstall}
                  className="w-full py-3 px-4 bg-[var(--bg-secondary)] border border-[var(--accent-primary)] text-[var(--accent-primary)] rounded-lg text-sm font-medium transition-all duration-200 hover:bg-[var(--bg-tertiary)] active:scale-98"
                >
                  Install App
                </button>
                <button
                  onClick={handleDismissInstall}
                  className="w-full py-2 px-4 text-xs text-[var(--text-tertiary)] transition-all duration-200 hover:text-[var(--text-secondary)]"
                >
                  Maybe later
                </button>
              </div>
            </div>
          )}

          {/* Legal notice */}
          <p className="text-xs text-[var(--text-tertiary)] pt-4 px-2 text-center leading-relaxed">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}

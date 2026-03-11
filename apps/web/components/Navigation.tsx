'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  return (
    <nav className="fixed w-full top-0 z-50 bg-[var(--bg-primary)]/95 backdrop-blur supports-[backdrop-filter]:bg-[var(--bg-primary)]/60 border-b border-[var(--border-color)]">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-[var(--accent-primary)] rounded-sm flex items-center justify-center">
            <span className="text-[var(--bg-primary)] font-bold text-sm">E</span>
          </div>
          <span className="text-lg font-semibold font-serif">Elite</span>
        </div>

        <div className="hidden md:flex items-center space-x-8">
          <a href="#how-it-works" className="text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition">
            How It Works
          </a>
          <a href="#difference" className="text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition">
            Why Elite
          </a>
          <a href="#pwa" className="text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition">
            About the App
          </a>

          {isAuthenticated ? (
            <Link href="/app" className="px-6 py-2 bg-[var(--accent-primary)] text-[var(--bg-primary)] rounded-full font-medium hover:bg-[var(--accent-secondary)] transition">
              Go to App
            </Link>
          ) : (
            <div className="flex items-center gap-4">
              <Link href="/login" className="text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition">
                Login
              </Link>
              <Link href="/onboarding" className="px-6 py-2 bg-[var(--accent-primary)] text-[var(--bg-primary)] rounded-full font-medium hover:bg-[var(--accent-secondary)] transition">
                Get Started
              </Link>
            </div>
          )}
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden w-6 h-6 flex flex-col justify-between"
        >
          <span className="block h-0.5 w-full bg-[var(--text-primary)]"></span>
          <span className="block h-0.5 w-full bg-[var(--text-primary)]"></span>
          <span className="block h-0.5 w-full bg-[var(--text-primary)]"></span>
        </button>
      </div>

      {isOpen && (
        <div className="md:hidden border-t border-[var(--border-color)] bg-[var(--bg-secondary)]">
          <div className="flex flex-col space-y-4 px-6 py-4">
            <a href="#how-it-works" className="text-[var(--text-secondary)]">
              How It Works
            </a>
            <a href="#difference" className="text-[var(--text-secondary)]">
              Why Elite
            </a>
            <a href="#pwa" className="text-[var(--text-secondary)]">
              About the App
            </a>
            {isAuthenticated ? (
              <Link href="/app" className="w-full px-6 py-2 bg-[var(--accent-primary)] text-[var(--bg-primary)] rounded-full font-medium text-center">
                Go to App
              </Link>
            ) : (
              <div className="space-y-2">
                <Link href="/login" className="block w-full px-6 py-2 border border-[var(--border-color)] text-[var(--text-secondary)] rounded-full font-medium text-center hover:bg-[var(--bg-tertiary)]">
                  Login
                </Link>
                <Link href="/onboarding" className="block w-full px-6 py-2 bg-[var(--accent-primary)] text-[var(--bg-primary)] rounded-full font-medium text-center">
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

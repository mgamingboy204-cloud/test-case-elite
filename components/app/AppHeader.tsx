'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function AppHeader() {
  const { logout } = useAuth();
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-[var(--bg-primary)] border-b border-[var(--border-color)] z-50 pt-safe">
      <div className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl border border-[var(--border-color)] flex items-center justify-center bg-[var(--bg-secondary)]">
            <span className="text-lg font-serif font-bold text-[var(--accent-primary)]">E</span>
          </div>
          <div>
            <h1 className="text-sm font-serif font-bold text-[var(--text-primary)]">Elite</h1>
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="w-10 h-10 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg shadow-lg">
              <nav className="p-2 space-y-1">
                <button
                  onClick={() => {
                    router.push('/app/profile');
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] rounded transition-colors"
                >
                  My Profile
                </button>
                <button
                  onClick={() => {
                    router.push('/app/settings');
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] rounded transition-colors"
                >
                  Settings
                </button>
                <hr className="border-[var(--border-color)] my-2" />
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-[var(--bg-tertiary)] rounded transition-colors"
                >
                  Logout
                </button>
              </nav>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

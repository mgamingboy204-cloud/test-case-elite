'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function SettingsPage() {
  const { logout, userId } = useAuth();
  const router = useRouter();
  const [showConfirmLogout, setShowConfirmLogout] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="pt-24 pb-24 px-6 space-y-6">
      <h1 className="text-3xl font-serif font-bold text-[var(--text-primary)]">Settings</h1>

      <div className="space-y-4">
        {/* Account section */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wide">Account</h2>
          <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border-color)] space-y-3">
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-[var(--text-secondary)]">User ID</span>
              <span className="text-xs text-[var(--text-tertiary)] font-mono">{userId?.slice(0, 8)}...</span>
            </div>

            <button className="w-full py-3 px-4 bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-secondary)] rounded-lg text-sm font-medium hover:bg-[var(--border-color)] transition-colors">
              Change Password
            </button>

            <button className="w-full py-3 px-4 bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-secondary)] rounded-lg text-sm font-medium hover:bg-[var(--border-color)] transition-colors">
              Update Email
            </button>
          </div>
        </div>

        {/* Preferences section */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wide">Preferences</h2>
          <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border-color)] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--text-secondary)]">Notifications</span>
              <button className="w-10 h-6 bg-[var(--accent-primary)] rounded-full transition-all relative">
                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--text-secondary)]">Marketing Emails</span>
              <button className="w-10 h-6 bg-[var(--bg-tertiary)] rounded-full transition-all">
                <div className="absolute left-1 top-1 w-4 h-4 bg-[var(--text-tertiary)] rounded-full" />
              </button>
            </div>
          </div>
        </div>

        {/* Danger zone */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wide">Danger Zone</h2>
          <button
            onClick={() => setShowConfirmLogout(true)}
            className="w-full py-3 px-4 bg-red-600/10 border border-red-600/20 text-red-500 rounded-lg font-medium hover:bg-red-600/20 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Confirmation modal */}
      {showConfirmLogout && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-6">
          <div className="bg-[var(--bg-secondary)] rounded-2xl p-6 border border-[var(--border-color)] space-y-4 max-w-sm">
            <h3 className="text-lg font-serif font-bold text-[var(--text-primary)]">Logout</h3>
            <p className="text-sm text-[var(--text-secondary)]">Are you sure you want to logout? You can login again anytime.</p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmLogout(false)}
                className="flex-1 py-2 px-4 bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-secondary)] rounded-lg font-medium hover:bg-[var(--border-color)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

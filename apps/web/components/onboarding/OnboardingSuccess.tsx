'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { clearOnboardingData } from '@/lib/storage';
import { useEffect } from 'react';

export default function OnboardingSuccess() {
  const router = useRouter();
  const { userId } = useAuth();

  useEffect(() => {
    clearOnboardingData();
  }, []);

  const handleEnterApp = () => {
    router.push('/app');
  };

  return (
    <div className="space-y-8 text-center">
      <div className="space-y-4">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-[var(--accent-primary)] flex items-center justify-center">
            <svg className="w-8 h-8 text-[var(--bg-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        <h2 className="text-4xl font-serif font-bold text-[var(--text-primary)]">
          Welcome to Elite
        </h2>

        <p className="text-base text-[var(--text-secondary)] max-w-sm mx-auto">
          Your profile is complete. Start connecting with intentional matches today.
        </p>
      </div>

      <div className="space-y-3">
        <div className="text-sm text-[var(--text-secondary)]">
          <p className="mb-4">Here's what you can do next:</p>
          <ul className="space-y-2 text-left max-w-sm mx-auto">
            <li className="flex items-start gap-2">
              <span className="text-[var(--accent-primary)] mt-1">•</span>
              <span>Browse verified profiles of people in your area</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[var(--accent-primary)] mt-1">•</span>
              <span>Send connection requests to people you're interested in</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[var(--accent-primary)] mt-1">•</span>
              <span>Get personalized match recommendations</span>
            </li>
          </ul>
        </div>
      </div>

      <button
        onClick={handleEnterApp}
        className="w-full py-4 px-6 bg-[var(--accent-primary)] text-[var(--bg-primary)] rounded-lg font-serif font-bold text-lg transition-all duration-200 hover:opacity-90 active:scale-98"
      >
        Start Browsing
      </button>

      <p className="text-xs text-[var(--text-tertiary)]">
        Your membership begins today. You'll have full access to all features.
      </p>
    </div>
  );
}

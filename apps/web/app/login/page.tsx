'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import PhoneInput from '@/components/auth/PhoneInput';
import OTPVerification from '@/components/auth/OTPVerification';

type LoginStep = 'phone' | 'otp';

export default function LoginPage() {
  const [step, setStep] = useState<LoginStep>('phone');
  const [phone, setPhone] = useState('');
  const { isLoading: authLoading } = useAuth();
  const router = useRouter();

  const handlePhoneSubmitted = (phoneNumber: string) => {
    setPhone(phoneNumber);
    setStep('otp');
  };

  const handleBackToPhone = () => {
    setStep('phone');
    setPhone('');
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex flex-col items-center justify-center px-6 pt-safe pb-safe">
      {/* Subtle background accent */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute top-1/3 right-0 w-80 h-80 bg-[var(--accent-primary)] rounded-full blur-3xl opacity-5" />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 rounded-2xl border border-[var(--border-color)] flex items-center justify-center bg-[var(--bg-secondary)]">
              <span className="text-xl font-serif font-bold text-[var(--accent-primary)]">E</span>
            </div>
          </div>
          <h1 className="text-3xl font-serif font-bold mb-2">Elite</h1>
          <p className="text-xs text-[var(--text-tertiary)] tracking-widest">CONNECT WITH INTENTION</p>
        </div>

        {/* Steps indicator */}
        <div className="flex gap-2 mb-12 justify-center">
          <div className={`h-1 flex-1 rounded-full ${step === 'phone' ? 'bg-[var(--accent-primary)]' : 'bg-[var(--bg-secondary)]'}`} />
          <div className={`h-1 flex-1 rounded-full ${step === 'otp' ? 'bg-[var(--accent-primary)]' : 'bg-[var(--bg-secondary)]'}`} />
        </div>

        {/* Content */}
        <div className="flex justify-center">
          {step === 'phone' ? (
            <PhoneInput onPhoneSubmitted={handlePhoneSubmitted} isLoading={authLoading} />
          ) : (
            <OTPVerification phone={phone} onBack={handleBackToPhone} />
          )}
        </div>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-[var(--border-color)] text-center space-y-2">
          <p className="text-xs text-[var(--text-tertiary)]">
            Don't have an account?
          </p>
          <button
            onClick={() => router.push('/onboarding')}
            className="text-sm text-[var(--accent-primary)] hover:text-[var(--accent-secondary)] font-medium transition-colors"
          >
            Start Creating Your Profile
          </button>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect, useRef } from 'react';
import { apiClient } from '@/lib/api';
import { getOnboardingData } from '@/lib/storage';

interface OnboardingOTPProps {
  onNext: () => void;
  onBack: () => void;
  isLoading?: boolean;
}

export default function OnboardingOTP({ onNext, onBack, isLoading = false }: OnboardingOTPProps) {
  const phone = getOnboardingData().phone || '';
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  const handleCodeChange = (value: string, index: number) => {
    if (!/^\d?$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    setError('');
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setIsVerifying(true);
    setError('');
    try {
      await apiClient.verifyOtp(phone, fullCode);
      onNext();
    } catch (err: any) {
      setError(err.message || 'Invalid code');
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    try {
      await apiClient.requestOtp(phone);
      setResendCountdown(60);
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      setError(err.message || 'Failed to resend code');
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <button
          onClick={onBack}
          className="text-sm text-[var(--accent-primary)] hover:text-[var(--accent-secondary)] transition-colors"
        >
          ← Back
        </button>
        <h2 className="text-3xl font-serif font-bold text-[var(--text-primary)]">
          Verify Your Code
        </h2>
        <p className="text-sm text-[var(--text-secondary)]">
          We sent a 6-digit code to {phone}
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex gap-2 justify-center">
          {code.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleCodeChange(e.target.value, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className="w-12 h-12 text-center text-lg font-semibold bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)]"
              disabled={isVerifying || isLoading}
            />
          ))}
        </div>

        {error && <p className="text-xs text-red-500 text-center">{error}</p>}

        <button
          onClick={handleVerify}
          disabled={isVerifying || isLoading || code.join('').length !== 6}
          className="w-full py-3 px-4 bg-[var(--accent-primary)] text-[var(--bg-primary)] rounded-lg font-semibold transition-all duration-200 hover:opacity-90 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isVerifying || isLoading ? 'Verifying...' : 'Verify'}
        </button>
      </div>

      <div className="space-y-2 text-center">
        <p className="text-xs text-[var(--text-tertiary)]">Didn't receive a code?</p>
        <button
          onClick={handleResend}
          disabled={resendCountdown > 0 || isVerifying || isLoading}
          className="text-sm text-[var(--accent-primary)] hover:text-[var(--accent-secondary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : 'Resend Code'}
        </button>
      </div>
    </div>
  );
}

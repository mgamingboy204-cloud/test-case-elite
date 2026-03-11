'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api';
import { setOnboardingData } from '@/lib/storage';

interface PhoneInputProps {
  onPhoneSubmitted: (phone: string) => void;
  isLoading?: boolean;
}

export default function PhoneInput({ onPhoneSubmitted, isLoading = false }: PhoneInputProps) {
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatPhone = (value: string) => {
    // Remove non-digits
    const digits = value.replace(/\D/g, '');
    // Simple formatting: +1 (555) 123-4567
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setPhone(formatted);
    setError('');
  };

  const getDigitsOnly = (phoneStr: string) => {
    return phoneStr.replace(/\D/g, '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const digitsOnly = getDigitsOnly(phone);
    if (digitsOnly.length < 10) {
      setError('Please enter a valid phone number');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.requestOtp(`+1${digitsOnly}`);
      setOnboardingData({ phone: `+1${digitsOnly}` });
      onPhoneSubmitted(`+1${digitsOnly}`);
    } catch (err: any) {
      setError(err.message || 'Failed to request OTP. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="space-y-3">
        <h2 className="text-3xl font-serif font-bold text-[var(--text-primary)]">
          Enter Your Phone
        </h2>
        <p className="text-sm text-[var(--text-secondary)]">
          We'll send you a verification code to confirm your number
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">
            Phone Number
          </label>
          <input
            type="tel"
            value={phone}
            onChange={handleChange}
            placeholder="(555) 123-4567"
            className="w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)]"
            disabled={isSubmitting || isLoading}
            autoComplete="tel"
            inputMode="tel"
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting || isLoading || getDigitsOnly(phone).length < 10}
          className="w-full py-3 px-4 bg-[var(--accent-primary)] text-[var(--bg-primary)] rounded-lg font-semibold transition-all duration-200 hover:opacity-90 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting || isLoading ? 'Sending Code...' : 'Send Verification Code'}
        </button>
      </form>

      <p className="text-xs text-[var(--text-tertiary)] text-center">
        We'll never share your phone number. Elite is private and secure.
      </p>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api';
import { setOnboardingData } from '@/lib/storage';

interface OnboardingPaymentProps {
  onNext: () => void;
  onBack: () => void;
}

const MEMBERSHIP_TIERS = [
  {
    id: 'premium',
    name: 'Premium',
    price: 99,
    period: 'month',
    description: 'Full access to verified matches',
    features: [
      'View all profiles',
      'Unlimited connections',
      '24/7 support',
      'Advanced filters'
    ]
  }
];

export default function OnboardingPayment({ onNext, onBack }: OnboardingPaymentProps) {
  const [selectedTier] = useState('premium');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  const tier = MEMBERSHIP_TIERS.find(t => t.id === selectedTier)!;

  const handleInitializePayment = async () => {
    setIsProcessing(true);
    setError('');
    try {
      const response = await apiClient.initializePayment({
        amount: tier.price * 100, // Convert to cents
        currency: 'USD'
      });
      
      setOnboardingData({ paymentSessionId: response.sessionId });
      
      // Redirect to Stripe checkout
      window.location.href = response.url;
    } catch (err: any) {
      setError(err.message || 'Failed to initialize payment');
      setIsProcessing(false);
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
          Choose Your Plan
        </h2>
        <p className="text-sm text-[var(--text-secondary)]">
          Unlock full access to our curated network
        </p>
      </div>

      <div className="space-y-4">
        {/* Tier card */}
        <div className="p-6 bg-[var(--bg-secondary)] border border-[var(--accent-primary)] rounded-lg">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-serif font-bold text-[var(--text-primary)]">
              {tier.name}
            </h3>
            <div className="text-right">
              <div className="text-3xl font-serif font-bold text-[var(--accent-primary)]">
                ${tier.price}
              </div>
              <p className="text-xs text-[var(--text-tertiary)]">per {tier.period}</p>
            </div>
          </div>

          <p className="text-sm text-[var(--text-secondary)] mb-4">
            {tier.description}
          </p>

          <ul className="space-y-2 mb-6">
            {tier.features.map((feature) => (
              <li key={feature} className="text-sm text-[var(--text-secondary)] flex items-start gap-2">
                <span className="text-[var(--accent-primary)] mt-1">✓</span>
                {feature}
              </li>
            ))}
          </ul>

          {error && <p className="text-xs text-red-500 mb-4">{error}</p>}

          <button
            onClick={handleInitializePayment}
            disabled={isProcessing}
            className="w-full py-3 px-4 bg-[var(--accent-primary)] text-[var(--bg-primary)] rounded-lg font-semibold transition-all duration-200 hover:opacity-90 active:scale-98 disabled:opacity-50"
          >
            {isProcessing ? 'Processing...' : 'Continue to Payment'}
          </button>
        </div>

        <p className="text-xs text-[var(--text-tertiary)] text-center">
          Your payment is secure and encrypted. Billing details coming next.
        </p>
      </div>
    </div>
  );
}

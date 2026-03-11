'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getOnboardingStep, setOnboardingStep } from '@/lib/storage';
import OnboardingPhone from '@/components/onboarding/OnboardingPhone';
import OnboardingOTP from '@/components/onboarding/OnboardingOTP';
import OnboardingVideo from '@/components/onboarding/OnboardingVideo';
import OnboardingPayment from '@/components/onboarding/OnboardingPayment';
import OnboardingProfile from '@/components/onboarding/OnboardingProfile';
import OnboardingPhotos from '@/components/onboarding/OnboardingPhotos';
import OnboardingSuccess from '@/components/onboarding/OnboardingSuccess';

type OnboardingStep = 'phone' | 'otp' | 'video' | 'payment' | 'profile' | 'photos' | 'success';

const STEPS: OnboardingStep[] = ['phone', 'otp', 'video', 'payment', 'profile', 'photos', 'success'];

export default function OnboardingPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('phone');

  // Restore step from localStorage on mount
  useEffect(() => {
    const savedStep = getOnboardingStep();
    if (savedStep > 0 && savedStep < STEPS.length) {
      setCurrentStep(STEPS[savedStep]);
    }
  }, []);

  // Redirect if already authenticated and completed onboarding
  useEffect(() => {
    if (authLoading) return;
    if (isAuthenticated && currentStep === 'phone') {
      router.push('/app');
    }
  }, [isAuthenticated, authLoading, currentStep, router]);

  const currentStepIndex = STEPS.indexOf(currentStep);
  const progress = ((currentStepIndex + 1) / STEPS.length) * 100;

  const handleNextStep = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < STEPS.length) {
      const nextStep = STEPS[nextIndex];
      setCurrentStep(nextStep);
      setOnboardingStep(nextIndex);
      window.scrollTo(0, 0);
    }
  };

  const handlePreviousStep = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      const prevStep = STEPS[prevIndex];
      setCurrentStep(prevStep);
      setOnboardingStep(prevIndex);
      window.scrollTo(0, 0);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex flex-col px-6 pt-safe pb-safe">
      {/* Subtle background accent */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute top-1/3 right-0 w-80 h-80 bg-[var(--accent-primary)] rounded-full blur-3xl opacity-5" />
      </div>

      <div className="relative z-10 flex flex-col flex-1">
        {/* Header */}
        <div className="pt-6 pb-8 text-center">
          <h1 className="text-2xl font-serif font-bold mb-2">Elite</h1>
          <p className="text-xs text-[var(--text-tertiary)] tracking-widest">CONNECT WITH INTENTION</p>
        </div>

        {/* Progress bar */}
        <div className="mb-12">
          <div className="w-full h-1 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--accent-primary)] transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-4 text-center text-xs text-[var(--text-tertiary)]">
            Step {currentStepIndex + 1} of {STEPS.length}
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 flex items-center justify-center mb-8">
          <div className="w-full max-w-md">
            {currentStep === 'phone' && (
              <OnboardingPhone onNext={handleNextStep} isLoading={authLoading} />
            )}
            {currentStep === 'otp' && (
              <OnboardingOTP onNext={handleNextStep} onBack={handlePreviousStep} isLoading={authLoading} />
            )}
            {currentStep === 'video' && (
              <OnboardingVideo onNext={handleNextStep} onBack={handlePreviousStep} />
            )}
            {currentStep === 'payment' && (
              <OnboardingPayment onNext={handleNextStep} onBack={handlePreviousStep} />
            )}
            {currentStep === 'profile' && (
              <OnboardingProfile onNext={handleNextStep} onBack={handlePreviousStep} />
            )}
            {currentStep === 'photos' && (
              <OnboardingPhotos onNext={handleNextStep} onBack={handlePreviousStep} />
            )}
            {currentStep === 'success' && <OnboardingSuccess />}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-[var(--text-tertiary)]">
            Already have an account?{' '}
            <button
              onClick={() => router.push('/login')}
              className="text-[var(--accent-primary)] hover:text-[var(--accent-secondary)] font-medium"
            >
              Login here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

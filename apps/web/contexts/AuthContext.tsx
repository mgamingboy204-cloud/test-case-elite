"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export type OnboardingStep = 'PHONE' | 'OTP' | 'PASSWORD' | 'VERIFICATION' | 'PAYMENT' | 'PROFILE' | 'PHOTOS' | 'COMPLETED';

interface User {
  phone: string;
  name?: string;
  isVerified?: boolean;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  onboardingStep: OnboardingStep;
  login: (phone: string) => void;
  signup: (phone: string) => void;
  verifyOTP: (otp: string) => boolean;
  completeOnboardingStep: (nextStep: OnboardingStep, userData?: Partial<User>) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock initial state for developmental preview
const MOCK_OTP = "123456";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [onboardingStep, setOnboardingStep] = useState<OnboardingStep>('PHONE');
  const [isInitialized, setIsInitialized] = useState(false);
  
  const router = useRouter();
  const pathname = usePathname();

  // Hydrate from localStorage on mount
  useEffect(() => {
    const storedAuth = localStorage.getItem('elite_auth');
    if (storedAuth) {
      try {
        const { auth, usr, step } = JSON.parse(storedAuth);
        setIsAuthenticated(auth);
        setUser(usr);
        setOnboardingStep(step);
      } catch (e) {
        console.error("Failed to parse auth state");
      }
    }
    setIsInitialized(true);
  }, []);

  // Persist state changes
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('elite_auth', JSON.stringify({
        auth: isAuthenticated,
        usr: user,
        step: onboardingStep
      }));
    }
  }, [isAuthenticated, user, onboardingStep, isInitialized]);

  const login = (phone: string) => {
    // Mock login flow initiation
    setUser({ phone });
    // In a real app, send OTP here
    router.push('/signin/otp');
  };

  const signup = (phone: string) => {
    setUser({ phone });
    setOnboardingStep('OTP');
    router.push('/signup/otp');
  };

  const verifyOTP = (otp: string) => {
    if (otp === MOCK_OTP) {
      if (pathname.includes('/signin')) {
        setIsAuthenticated(true);
        // Assuming signed in users have completed onboarding for now
        setOnboardingStep('COMPLETED');
        router.push('/discover');
      } else {
        // Sign up flow
        setOnboardingStep('PASSWORD');
        router.push('/signup/password');
      }
      return true;
    }
    return false;
  };

  const completeOnboardingStep = (nextStep: OnboardingStep, userData?: Partial<User>) => {
    if (userData) {
      setUser(prev => prev ? { ...prev, ...userData } : prev);
    }
    setOnboardingStep(nextStep);
    
    // Route based on next step — each step maps to its own dedicated sub-route
    switch (nextStep) {
      case 'VERIFICATION':
        router.push('/onboarding/verification');
        break;
      case 'PAYMENT':
        router.push('/onboarding/payment');
        break;
      case 'PROFILE':
        router.push('/onboarding/profile');
        break;
      case 'PHOTOS':
        router.push('/onboarding/photos');
        break;
      case 'COMPLETED':
        setIsAuthenticated(true);
        router.push('/discover');
        break;
      default:
        break;
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    setOnboardingStep('PHONE');
    localStorage.removeItem('elite_auth');
    router.push('/');
  };

  if (!isInitialized) return null; // Avoid hydration mismatch

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, onboardingStep, login, signup, verifyOTP, completeOnboardingStep, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

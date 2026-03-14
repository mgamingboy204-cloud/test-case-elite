"use client";

import React, { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { apiRequest, setAuthToken } from "@/lib/api";

type BackendOnboardingStep =
  | "PHONE_VERIFIED"
  | "VIDEO_VERIFICATION_PENDING"
  | "VIDEO_VERIFIED"
  | "PAYMENT_PENDING"
  | "PAID"
  | "PROFILE_PENDING"
  | "ACTIVE";

export type OnboardingStep = "PHONE" | "OTP" | "PASSWORD" | "VERIFICATION" | "PAYMENT" | "PROFILE" | "PHOTOS" | "COMPLETED";

interface User {
  id: string;
  phone: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  displayName?: string | null;
  onboardingStep: BackendOnboardingStep;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  onboardingStep: OnboardingStep;
  pendingPhone: string | null;
  signupToken: string | null;
  startSignup: (phone: string) => Promise<void>;
  verifySignupOtp: (otp: string) => Promise<void>;
  completeSignup: (password: string) => Promise<void>;
  startLogin: (phone: string, password: string) => Promise<{ otpRequired: boolean }>;
  verifySigninOtp: (otp: string) => Promise<void>;
  refreshCurrentUser: () => Promise<void>;
  completeOnboardingStep: (nextStep: OnboardingStep) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapOnboardingStep(user: User | null): OnboardingStep {
  if (!user) return "PHONE";

  if (user.onboardingStep === "ACTIVE") return "COMPLETED";
  if (user.onboardingStep === "PAID" || user.onboardingStep === "PROFILE_PENDING") return "PROFILE";
  if (user.onboardingStep === "PAYMENT_PENDING") return "PAYMENT";
  return "VERIFICATION";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [pendingPhone, setPendingPhone] = useState<string | null>(null);
  const [signupToken, setSignupToken] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const router = useRouter();

  const isAuthenticated = Boolean(user);
  const onboardingStep = useMemo(() => mapOnboardingStep(user), [user]);

  const refreshCurrentUser = async () => {
    const me = await apiRequest<User>("/me", { auth: true });
    setUser(me);
  };

  useEffect(() => {
    const hydrate = async () => {
      const storedPendingPhone = localStorage.getItem("elite_pending_phone");
      const storedSignupToken = localStorage.getItem("elite_signup_token");
      setPendingPhone(storedPendingPhone || null);
      setSignupToken(storedSignupToken || null);

      try {
        await refreshCurrentUser();
      } catch {
        setUser(null);
      } finally {
        setIsInitialized(true);
      }
    };

    void hydrate();
  }, []);

  const startSignup = async (phone: string) => {
    await apiRequest<{ ok: boolean }>("/auth/signup/start", {
      method: "POST",
      body: JSON.stringify({ phone })
    });

    setPendingPhone(phone);
    localStorage.setItem("elite_pending_phone", phone);
    router.push("/signup/otp");
  };

  const verifySignupOtp = async (otp: string) => {
    if (!pendingPhone) throw new Error("Phone number is missing");

    const response = await apiRequest<{ ok: true; signupToken: string }>("/auth/signup/verify", {
      method: "POST",
      body: JSON.stringify({ phone: pendingPhone, code: otp })
    });

    setSignupToken(response.signupToken);
    localStorage.setItem("elite_signup_token", response.signupToken);
    router.push("/signup/password");
  };

  const completeSignup = async (password: string) => {
    if (!signupToken) throw new Error("Signup session missing");

    const response = await apiRequest<{ ok: true; accessToken: string }>("/auth/signup/complete", {
      method: "POST",
      body: JSON.stringify({ signupToken, password })
    });

    setAuthToken(response.accessToken);
    await refreshCurrentUser();

    setSignupToken(null);
    localStorage.removeItem("elite_signup_token");
    router.push("/onboarding/verification");
  };

  const startLogin = async (phone: string, password: string) => {
    const response = await apiRequest<{ ok: true; otpRequired?: boolean; accessToken?: string; user?: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ phone, password, rememberMe: true })
    });

    setPendingPhone(phone);
    localStorage.setItem("elite_pending_phone", phone);

    if (response.otpRequired) {
      return { otpRequired: true };
    }

    if (response.accessToken && response.user) {
      setAuthToken(response.accessToken);
      setUser(response.user);
      router.push(mapOnboardingStep(response.user) === "COMPLETED" ? "/discover" : "/onboarding/verification");
    }

    return { otpRequired: false };
  };

  const verifySigninOtp = async (otp: string) => {
    if (!pendingPhone) throw new Error("Phone number is missing");

    const response = await apiRequest<{ ok: true; accessToken: string; user: User }>("/auth/otp/verify", {
      method: "POST",
      body: JSON.stringify({ phone: pendingPhone, code: otp, rememberMe: true })
    });

    setAuthToken(response.accessToken);
    setUser(response.user);
    router.push(mapOnboardingStep(response.user) === "COMPLETED" ? "/discover" : "/onboarding/verification");
  };

  const completeOnboardingStep = (nextStep: OnboardingStep) => {
    if (nextStep === "COMPLETED") {
      router.push("/discover");
      return;
    }

    const routeMap: Partial<Record<OnboardingStep, string>> = {
      VERIFICATION: "/onboarding/verification",
      PAYMENT: "/onboarding/payment",
      PROFILE: "/onboarding/profile",
      PHOTOS: "/onboarding/photos"
    };

    const route = routeMap[nextStep];
    if (route) router.push(route);
  };

  const logout = async () => {
    try {
      await apiRequest<{ ok: true }>("/auth/logout", { method: "POST" });
    } catch {
      // ignore logout API errors
    }
    setAuthToken(null);
    setUser(null);
    setPendingPhone(null);
    setSignupToken(null);
    localStorage.removeItem("elite_pending_phone");
    localStorage.removeItem("elite_signup_token");
    router.push("/");
  };

  if (!isInitialized) return null;

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        onboardingStep,
        pendingPhone,
        signupToken,
        startSignup,
        verifySignupOtp,
        completeSignup,
        startLogin,
        verifySigninOtp,
        refreshCurrentUser,
        completeOnboardingStep,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

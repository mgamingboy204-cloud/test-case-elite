"use client";

import React, { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ApiError, apiRequest, apiRequestAuth, clearAccessToken, initializeAccessToken, setAccessToken, subscribeToAuthFailure } from "@/lib/api";
import {
  type BackendOnboardingStep,
  type FrontendOnboardingStep,
  resolveFrontendOnboardingStep,
  routeForFrontendOnboardingStep
} from "@/lib/onboarding";

export type OnboardingStep = FrontendOnboardingStep;


export function routeForOnboardingStep(step: OnboardingStep) {
  return routeForFrontendOnboardingStep(step);
}

type AppState = {
  code: "guest" | "onboarding_required" | "verification_required" | "payment_required" | "profile_incomplete" | "matching_ineligible" | "profile_data_missing" | "eligible";
  redirectTo?: string | null;
  reasons?: string[];
};

interface User {
  id: string;
  phone: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  displayName?: string | null;
  onboardingStep: BackendOnboardingStep;
  profileCompletedAt?: string | null;
  photoCount?: number;
  onboardingToken?: string | null;
  appState?: AppState;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isAuthResolved: boolean;
  user: User | null;
  onboardingStep: OnboardingStep;
  pendingPhone: string | null;
  signupToken: string | null;
  startSignup: (phone: string) => Promise<void>;
  verifySignupOtp: (otp: string) => Promise<void>;
  verifySignupOtpMock: () => Promise<void>;
  completeSignup: (password: string) => Promise<void>;
  startLogin: (phone: string, password: string) => Promise<{ otpRequired: boolean }>;
  verifySigninOtp: (otp: string) => Promise<void>;
  verifySigninOtpMock: () => Promise<void>;
  resendSigninOtp: () => Promise<void>;
  resendSignupOtp: () => Promise<void>;
  refreshCurrentUser: () => Promise<void>;
  completeOnboardingStep: (nextStep: OnboardingStep) => void;
  logout: () => Promise<void>;
  appStateCode: AppState["code"] | null;
  appStateRedirectTo: string | null;
}

type LoginApiResponse =
  | { ok: true; otpRequired: true }
  | { ok: true; otpRequired?: false; onboardingToken?: string | null; accessToken: string; user: User };

type SignupCompleteResponse = {
  ok: true;
  onboardingToken?: string | null;
  accessToken: string;
  user?: User;
};

function isSessionPayload(value: unknown): value is { user: User; onboardingToken?: string | null } {
  if (!value || typeof value !== "object") return false;
  const candidate = value as { user?: unknown };
  return typeof candidate.user === "object" && candidate.user !== null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
export const allowTestBypass = process.env.NEXT_PUBLIC_ALLOW_TEST_BYPASS === "true";
const authDebug = process.env.NODE_ENV !== "production";

function debugLog(message: string, details?: unknown) {
  if (!authDebug) return;
  console.info(message, details);
}

function debugError(message: string, details?: unknown) {
  if (!authDebug) return;
  console.error(message, details);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [pendingPhone, setPendingPhone] = useState<string | null>(null);
  const [signupToken, setSignupToken] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const router = useRouter();

  const isAuthenticated = Boolean(user);
  const appStateCode = user?.appState?.code ?? null;
  const appStateRedirectTo = user?.appState?.redirectTo ?? null;
  const onboardingStep = useMemo(
    () =>
      resolveFrontendOnboardingStep({
        isAuthenticated,
        pendingPhone,
        signupToken,
        backendStep: user?.onboardingStep,
        profileCompletedAt: user?.profileCompletedAt,
        photoCount: user?.photoCount
      }),
    [isAuthenticated, pendingPhone, signupToken, user]
  );

  const refreshCurrentUser = async () => {
    const me = await apiRequestAuth<User>("/me");
    setUser(me);
  };

  useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {
      initializeAccessToken();

      const storedPendingPhone = localStorage.getItem("vael_pending_phone");
      const storedSignupToken = localStorage.getItem("vael_signup_token");
      setPendingPhone(storedPendingPhone || null);
      setSignupToken(storedSignupToken || null);

      try {
        await refreshCurrentUser();
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          // Session missing/expired; treat as logged out.
        }
        clearAccessToken();
        setUser(null);
      } finally {
        if (!cancelled) setIsInitialized(true);
      }
    };

    void hydrate();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToAuthFailure(() => {
      setUser(null);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const startSignup = async (phone: string) => {
    await apiRequest<{ ok: boolean }>("/auth/signup/start", {
      method: "POST",
      body: JSON.stringify({ phone })
    });

    setPendingPhone(phone);
    localStorage.setItem("vael_pending_phone", phone);
    router.push("/signup/otp");
  };

  const verifySignupOtp = async (otp: string) => {
    if (!pendingPhone) throw new Error("Phone number is missing");

    const response = await apiRequest<{ ok: true; signupToken: string }>("/auth/signup/verify", {
      method: "POST",
      body: JSON.stringify({ phone: pendingPhone, code: otp })
    });

    setSignupToken(response.signupToken);
    localStorage.setItem("vael_signup_token", response.signupToken);
    router.push("/signup/password");
  };

  const verifySignupOtpMock = async () => {
    if (!pendingPhone) throw new Error("Phone number is missing");
    if (!allowTestBypass) throw new Error("Mock OTP is disabled.");

    const response = await apiRequest<{ ok: true; signupToken: string }>("/auth/signup/mock-verify", {
      method: "POST",
      body: JSON.stringify({ phone: pendingPhone })
    });

    setSignupToken(response.signupToken);
    localStorage.setItem("vael_signup_token", response.signupToken);
    router.push("/signup/password");
  };

  const completeSignup = async (password: string) => {
    if (!signupToken) throw new Error("Signup session missing");

    const response = await apiRequest<SignupCompleteResponse>("/auth/signup/complete", {
      method: "POST",
      body: JSON.stringify({ signupToken, password })
    });

    debugLog("[signup] complete response", response);

    setAccessToken(response.accessToken);

    const onboardingToken = response.onboardingToken ?? response.user?.onboardingToken ?? null;

    debugLog("[signup] storing tokens", {
      hasOnboardingToken: Boolean(onboardingToken)
    });

    if (response.user) {
      setUser(response.user);
    } else {
      try {
        await refreshCurrentUser();
      } catch (error) {
        debugError("[signup] failed to fetch /me immediately after signup complete", error);
        throw error;
      }
    }

    setPendingPhone(null);
    localStorage.removeItem("vael_pending_phone");
    setSignupToken(null);
    localStorage.removeItem("vael_signup_token");

    const nextRoute = routeForOnboardingStep(resolveFrontendOnboardingStep({
      isAuthenticated: true,
      backendStep: response.user?.onboardingStep ?? user?.onboardingStep,
      profileCompletedAt: response.user?.profileCompletedAt ?? user?.profileCompletedAt,
      photoCount: response.user?.photoCount ?? user?.photoCount
    }));

    debugLog("[signup] navigation target", { nextRoute });
    router.push(nextRoute);
  };

  const startLogin = async (phone: string, password: string) => {
    const response = await apiRequest<LoginApiResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ phone, password, rememberMe: true })
    });

    setPendingPhone(phone);
    localStorage.setItem("vael_pending_phone", phone);

    if (response.otpRequired) {
      return { otpRequired: true };
    }

    if (!isSessionPayload(response)) {
      throw new Error("Unexpected login response. Please try again.");
    }

    setAccessToken(response.accessToken);
    setUser(response.user);
    setPendingPhone(null);
    localStorage.removeItem("vael_pending_phone");
    router.push(routeForOnboardingStep(resolveFrontendOnboardingStep({
      isAuthenticated: true,
      backendStep: response.user.onboardingStep,
      profileCompletedAt: response.user.profileCompletedAt,
      photoCount: response.user.photoCount
    })));

    return { otpRequired: false };
  };

  const verifySigninOtp = async (otp: string) => {
    if (!pendingPhone) throw new Error("Phone number is missing");

    const response = await apiRequest<{ ok: true; onboardingToken: string; accessToken: string; user: User }>("/auth/otp/verify", {
      method: "POST",
      body: JSON.stringify({ phone: pendingPhone, code: otp, rememberMe: true })
    });

    setAccessToken(response.accessToken);
    setUser(response.user);
    setPendingPhone(null);
    localStorage.removeItem("vael_pending_phone");
    router.push(routeForOnboardingStep(resolveFrontendOnboardingStep({
      isAuthenticated: true,
      backendStep: response.user.onboardingStep,
      profileCompletedAt: response.user.profileCompletedAt,
      photoCount: response.user.photoCount
    })));
  };

  const resendSigninOtp = async () => {
    if (!pendingPhone) throw new Error("Phone number is missing");

    await apiRequest<{ ok: true }>("/auth/otp/send", {
      method: "POST",
      body: JSON.stringify({ phone: pendingPhone })
    });
  };

  const verifySigninOtpMock = async () => {
    if (!pendingPhone) throw new Error("Phone number is missing");
    if (!allowTestBypass) throw new Error("Mock OTP is disabled.");

    const response = await apiRequest<{ ok: true; onboardingToken: string; accessToken: string; user: User }>("/auth/otp/mock-verify", {
      method: "POST",
      body: JSON.stringify({ phone: pendingPhone, rememberMe: true })
    });

    setAccessToken(response.accessToken);
    setUser(response.user);
    setPendingPhone(null);
    localStorage.removeItem("vael_pending_phone");
    router.push(routeForOnboardingStep(resolveFrontendOnboardingStep({
      isAuthenticated: true,
      backendStep: response.user.onboardingStep,
      profileCompletedAt: response.user.profileCompletedAt,
      photoCount: response.user.photoCount
    })));
  };

  const resendSignupOtp = async () => {
    if (!pendingPhone) throw new Error("Phone number is missing");

    await apiRequest<{ ok: true }>("/auth/signup/start", {
      method: "POST",
      body: JSON.stringify({ phone: pendingPhone })
    });
  };

  const completeOnboardingStep = (nextStep: OnboardingStep) => {
    router.push(routeForOnboardingStep(nextStep));
  };

  const logout = async () => {
    try {
      await apiRequestAuth<{ ok: true }>("/auth/logout", { method: "POST" });
    } catch {
      // ignore logout API errors
    }
    clearAccessToken();
    setUser(null);
    setPendingPhone(null);
    setSignupToken(null);
    localStorage.removeItem("vael_pending_phone");
    localStorage.removeItem("vael_signup_token");
    router.push("/");
  };

  if (!isInitialized) return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        height: "var(--app-height, 100dvh)",
        width: "100vw",
        background: "var(--background, #13181f)",
        zIndex: 9999,
      }}
    />
  );

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isAuthResolved: isInitialized,
        user,
        onboardingStep,
        pendingPhone,
        signupToken,
        startSignup,
        verifySignupOtp,
        verifySignupOtpMock,
        completeSignup,
        startLogin,
        verifySigninOtp,
        verifySigninOtpMock,
        resendSigninOtp,
        resendSignupOtp,
        refreshCurrentUser,
        completeOnboardingStep,
        logout,
        appStateCode,
        appStateRedirectTo
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

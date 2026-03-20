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
import { clearAllCaches } from "@/lib/cache";
import {
  readStoredPendingPhone,
  writeStoredPendingPhone,
  readStoredSignupToken,
  writeStoredSignupToken,
} from "@/lib/auth/tokenStorage";
import { performSessionCleanup } from "@/lib/auth/tokenService";

// Timeout for initial /me bootstrap call (prevents infinite hang)
const AUTH_BOOTSTRAP_TIMEOUT_MS = 8000;

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

  const maybeSaveFcmToken = async () => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("vael_fcm_token");
    if (!token) return;
    try {
      await apiRequestAuth("/users/fcm-token", {
        method: "POST",
        body: JSON.stringify({ token })
      });
    } catch {
      // Best-effort: token storage should never break login.
    }
  };

  useEffect(() => {
    let cancelled = false;
    let timeoutId: NodeJS.Timeout | null = null;

    const hydrate = async () => {
      initializeAccessToken();

      // Restore temporary signup/login state from storage
      const storedPendingPhone = readStoredPendingPhone();
      const storedSignupToken = readStoredSignupToken();
      setPendingPhone(storedPendingPhone);
      setSignupToken(storedSignupToken);

      try {
        // Attempt to restore session with timeout protection
        await Promise.race([
          refreshCurrentUser(),
          new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error("Auth bootstrap timeout")),
              AUTH_BOOTSTRAP_TIMEOUT_MS
            )
          ),
        ]);
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          // Session missing/expired; treat as logged out
        } else if (error instanceof Error && error.message === "Auth bootstrap timeout") {
          // Timeout occurred; clear auth and proceed unauthenticated
          if (process.env.NODE_ENV !== "production") {
            console.warn("[auth] Bootstrap timeout; proceeding as unauthenticated");
          }
        }
        clearAccessToken();
        setUser(null);
      } finally {
        if (!cancelled) {
          setIsInitialized(true);
        }
        // Clean up timeout
        if (timeoutId) clearTimeout(timeoutId);
      }
    };

    void hydrate();

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToAuthFailure(() => {
      setUser(null);
      clearAllCaches();
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
    writeStoredPendingPhone(phone);
    router.push("/signup/otp");
  };

  const verifySignupOtp = async (otp: string) => {
    if (!pendingPhone) throw new Error("Phone number is missing");

    const response = await apiRequest<{ ok: true; signupToken: string }>("/auth/signup/verify", {
      method: "POST",
      body: JSON.stringify({ phone: pendingPhone, code: otp })
    });

    setSignupToken(response.signupToken);
    writeStoredSignupToken(response.signupToken);
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
    writeStoredSignupToken(response.signupToken);
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
    writeStoredPendingPhone(null);
    setSignupToken(null);
    writeStoredSignupToken(null);

    const nextRoute = routeForOnboardingStep(resolveFrontendOnboardingStep({
      isAuthenticated: true,
      backendStep: response.user?.onboardingStep ?? user?.onboardingStep,
      profileCompletedAt: response.user?.profileCompletedAt ?? user?.profileCompletedAt,
      photoCount: response.user?.photoCount ?? user?.photoCount
    }));

    debugLog("[signup] navigation target", { nextRoute });
    router.push(nextRoute);

    // Best-effort FCM token registration (if client provided one).
    void maybeSaveFcmToken();
  };

  const startLogin = async (phone: string, password: string) => {
    const response = await apiRequest<LoginApiResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ phone, password, rememberMe: true })
    });

    setPendingPhone(phone);
    writeStoredPendingPhone(phone);

    if (response.otpRequired) {
      return { otpRequired: true };
    }

    if (!isSessionPayload(response)) {
      throw new Error("Unexpected login response. Please try again.");
    }

    setAccessToken(response.accessToken);
    setUser(response.user);
    setPendingPhone(null);
    writeStoredPendingPhone(null);
    router.push(routeForOnboardingStep(resolveFrontendOnboardingStep({
      isAuthenticated: true,
      backendStep: response.user.onboardingStep,
      profileCompletedAt: response.user.profileCompletedAt,
      photoCount: response.user.photoCount
    })));

    void maybeSaveFcmToken();
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
    writeStoredPendingPhone(null);
    router.push(routeForOnboardingStep(resolveFrontendOnboardingStep({
      isAuthenticated: true,
      backendStep: response.user.onboardingStep,
      profileCompletedAt: response.user.profileCompletedAt,
      photoCount: response.user.photoCount
    })));

    void maybeSaveFcmToken();
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
    writeStoredPendingPhone(null);
    router.push(routeForOnboardingStep(resolveFrontendOnboardingStep({
      isAuthenticated: true,
      backendStep: response.user.onboardingStep,
      profileCompletedAt: response.user.profileCompletedAt,
      photoCount: response.user.photoCount
    })));

    void maybeSaveFcmToken();
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
      // Best-effort: ignore logout API errors
    }
    // Centralized cleanup: clears all auth storage, bumps generation, notifies listeners
    performSessionCleanup();
    clearAllCaches();
    setUser(null);
    setPendingPhone(null);
    setSignupToken(null);
    router.push("/signin");
  };

  if (!isInitialized) return null;

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

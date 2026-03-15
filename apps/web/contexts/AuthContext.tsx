"use client";

import React, { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ApiError, apiRequest, setAuthToken, setOnboardingToken } from "@/lib/api";
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
}

type LoginApiResponse =
  | { ok: true; otpRequired: true }
  | { ok: true; otpRequired?: false; accessToken: string; onboardingToken?: string | null; user: User };

type SignupCompleteResponse = {
  ok: true;
  accessToken?: string;
  onboardingToken?: string | null;
  user?: User;
};

function isSessionPayload(value: unknown): value is { accessToken: string; user: User; onboardingToken?: string | null } {
  if (!value || typeof value !== "object") return false;
  const candidate = value as { accessToken?: unknown; user?: unknown };
  return typeof candidate.accessToken === "string" && typeof candidate.user === "object" && candidate.user !== null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
export const allowTestBypass = process.env.NEXT_PUBLIC_ALLOW_TEST_BYPASS === "true";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [pendingPhone, setPendingPhone] = useState<string | null>(null);
  const [signupToken, setSignupToken] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const router = useRouter();

  const isAuthenticated = Boolean(user);
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
    const me = await apiRequest<User>("/me", { auth: true });
    setUser(me);
    if (me.onboardingToken) {
      setOnboardingToken(me.onboardingToken);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {
      const storedPendingPhone = localStorage.getItem("elite_pending_phone");
      const storedSignupToken = localStorage.getItem("elite_signup_token");
      const storedOnboardingToken = localStorage.getItem("elite_onboarding_token");
      setPendingPhone(storedPendingPhone || null);
      setSignupToken(storedSignupToken || null);
      setOnboardingToken(storedOnboardingToken || null);

      try {
        await refreshCurrentUser();
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          setAuthToken(null);
          setOnboardingToken(null);
        }
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

  const verifySignupOtpMock = async () => {
    if (!pendingPhone) throw new Error("Phone number is missing");
    if (!allowTestBypass) throw new Error("Mock OTP is disabled.");

    const response = await apiRequest<{ ok: true; signupToken: string }>("/auth/signup/mock-verify", {
      method: "POST",
      body: JSON.stringify({ phone: pendingPhone })
    });

    setSignupToken(response.signupToken);
    localStorage.setItem("elite_signup_token", response.signupToken);
    router.push("/signup/password");
  };

  const completeSignup = async (password: string) => {
    if (!signupToken) throw new Error("Signup session missing");

    const response = await apiRequest<SignupCompleteResponse>("/auth/signup/complete", {
      method: "POST",
      body: JSON.stringify({ signupToken, password })
    });

    console.info("[signup] complete response", response);

    const accessToken = response.accessToken;
    if (!accessToken) {
      console.error("[signup] Missing access token in signup complete response", response);
      throw new Error("Signup completed, but no access token was returned.");
    }

    const onboardingToken = response.onboardingToken ?? response.user?.onboardingToken ?? null;

    console.info("[signup] storing tokens", {
      hasAccessToken: Boolean(accessToken),
      hasOnboardingToken: Boolean(onboardingToken)
    });

    setAuthToken(accessToken);
    setOnboardingToken(onboardingToken);

    if (response.user) {
      setUser(response.user);
    } else {
      try {
        await refreshCurrentUser();
      } catch (error) {
        console.error("[signup] failed to fetch /me immediately after signup complete", error);
        throw error;
      }
    }

    setPendingPhone(null);
    localStorage.removeItem("elite_pending_phone");
    setSignupToken(null);
    localStorage.removeItem("elite_signup_token");

    const nextRoute = routeForOnboardingStep(resolveFrontendOnboardingStep({
      isAuthenticated: true,
      backendStep: response.user?.onboardingStep ?? user?.onboardingStep,
      profileCompletedAt: response.user?.profileCompletedAt ?? user?.profileCompletedAt,
      photoCount: response.user?.photoCount ?? user?.photoCount
    }));

    console.info("[signup] navigation target", { nextRoute });
    router.push(nextRoute);
  };

  const startLogin = async (phone: string, password: string) => {
    const response = await apiRequest<LoginApiResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ phone, password, rememberMe: true })
    });

    setPendingPhone(phone);
    localStorage.setItem("elite_pending_phone", phone);

    if (response.otpRequired) {
      return { otpRequired: true };
    }

    if (!isSessionPayload(response)) {
      throw new Error("Unexpected login response. Please try again.");
    }

    setAuthToken(response.accessToken);
    setOnboardingToken(response.onboardingToken ?? response.user.onboardingToken ?? null);
    setUser(response.user);
    setPendingPhone(null);
    localStorage.removeItem("elite_pending_phone");
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

    const response = await apiRequest<{ ok: true; accessToken: string; onboardingToken: string; user: User }>("/auth/otp/verify", {
      method: "POST",
      body: JSON.stringify({ phone: pendingPhone, code: otp, rememberMe: true })
    });

    setAuthToken(response.accessToken);
    setOnboardingToken(response.onboardingToken);
    setUser(response.user);
    setPendingPhone(null);
    localStorage.removeItem("elite_pending_phone");
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

    const response = await apiRequest<{ ok: true; accessToken: string; onboardingToken: string; user: User }>("/auth/otp/mock-verify", {
      method: "POST",
      body: JSON.stringify({ phone: pendingPhone, rememberMe: true })
    });

    setAuthToken(response.accessToken);
    setOnboardingToken(response.onboardingToken);
    setUser(response.user);
    setPendingPhone(null);
    localStorage.removeItem("elite_pending_phone");
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
      await apiRequest<{ ok: true }>("/auth/logout", { method: "POST" });
    } catch {
      // ignore logout API errors
    }
    setAuthToken(null);
    setUser(null);
    setPendingPhone(null);
    setSignupToken(null);
    setOnboardingToken(null);
    localStorage.removeItem("elite_pending_phone");
    localStorage.removeItem("elite_signup_token");
    localStorage.removeItem("elite_onboarding_token");
    router.push("/");
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

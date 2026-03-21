"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { apiRequest, apiRequestAuth, setAccessToken } from "@/lib/api";
import {
  type BackendOnboardingStep,
  type FrontendOnboardingStep,
  resolveFrontendOnboardingStep,
  routeForAuthenticatedUser,
} from "@/lib/onboarding";
import {
  type AuthFlowMode,
  readStoredAuthFlowMode,
  readStoredPendingPhone,
  readStoredSignupToken,
  writeStoredAuthFlowMode,
  writeStoredPendingPhone,
  writeStoredSignupToken,
} from "@/lib/auth/flowStorage";
import {
  bootstrapSession,
  clearClientAuthState,
  clearMemberSessionState,
  subscribeToSessionInvalidation,
} from "@/lib/authSession";
import { API_ENDPOINTS } from "@/lib/api/endpoints";

const AUTH_BOOTSTRAP_TIMEOUT_MS = 8000;

export type OnboardingStep = FrontendOnboardingStep;
export type SessionRole = "USER" | "EMPLOYEE" | "ADMIN";

type AppState = {
  code:
    | "guest"
    | "onboarding_required"
    | "verification_required"
    | "payment_required"
    | "profile_incomplete"
    | "matching_ineligible"
    | "profile_data_missing"
    | "eligible";
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
  gender?: string | null;
  role: SessionRole;
  isAdmin?: boolean;
  mustResetPassword?: boolean;
  status?: string;
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
  authFlowMode: AuthFlowMode | null;
  onboardingStep: OnboardingStep;
  pendingPhone: string | null;
  signupToken: string | null;
  resetAuthFlow: () => void;
  startSignup: (phone: string) => Promise<void>;
  verifySignupOtp: (otp: string) => Promise<void>;
  verifySignupOtpMock: () => Promise<void>;
  completeSignup: (password: string) => Promise<void>;
  startLogin: (phone: string, password: string) => Promise<{ otpRequired: boolean }>;
  startEmployeeLogin: (employeeId: string, password: string) => Promise<void>;
  verifySigninOtp: (otp: string) => Promise<void>;
  verifySigninOtpMock: () => Promise<void>;
  resendSigninOtp: () => Promise<void>;
  resendSignupOtp: () => Promise<void>;
  refreshCurrentUser: () => Promise<User>;
  refreshCurrentUserAndRoute: (options?: { replace?: boolean }) => Promise<User>;
  logout: () => Promise<void>;
  appStateCode: AppState["code"] | null;
  appStateRedirectTo: string | null;
}

type AuthenticatedSessionResponse = {
  ok: true;
  accessToken: string;
  user: User;
};

type LoginApiResponse =
  | { ok: true; otpRequired: true }
  | AuthenticatedSessionResponse;

function isAuthenticatedSessionResponse(
  value: unknown
): value is AuthenticatedSessionResponse {
  if (!value || typeof value !== "object") return false;
  const candidate = value as { accessToken?: unknown; user?: unknown };
  return (
    typeof candidate.accessToken === "string" &&
    typeof candidate.user === "object" &&
    candidate.user !== null
  );
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
export const allowTestBypass =
  process.env.NEXT_PUBLIC_ALLOW_TEST_BYPASS === "true";
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
  const [authFlowMode, setAuthFlowMode] = useState<AuthFlowMode | null>(null);
  const [pendingPhone, setPendingPhone] = useState<string | null>(null);
  const [signupToken, setSignupToken] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const authStateRevisionRef = useRef(0);
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
        photoCount: user?.photoCount,
      }),
    [isAuthenticated, pendingPhone, signupToken, user]
  );

  const clearPendingAuthFlow = () => {
    setAuthFlowMode(null);
    setPendingPhone(null);
    setSignupToken(null);
    writeStoredAuthFlowMode(null);
    writeStoredPendingPhone(null);
    writeStoredSignupToken(null);
  };

  const bumpAuthStateRevision = () => {
    authStateRevisionRef.current += 1;
    return authStateRevisionRef.current;
  };

  const clearAllLocalAuthState = (options?: { bumpRevision?: boolean }) => {
    if (options?.bumpRevision !== false) {
      bumpAuthStateRevision();
    }
    clearClientAuthState();
    setUser(null);
    setAuthFlowMode(null);
    setPendingPhone(null);
    setSignupToken(null);
    setIsInitialized(true);
  };

  const applyAuthenticatedUser = (accessToken: string, nextUser: User) => {
    bumpAuthStateRevision();
    setAccessToken(accessToken);
    setUser(nextUser);
    clearPendingAuthFlow();
    setIsInitialized(true);
  };

  const resetAuthFlow = () => {
    clearPendingAuthFlow();
  };

  const refreshCurrentUser = async () => {
    const me = await apiRequestAuth<User>(API_ENDPOINTS.user.me);
    setUser(me);
    return me;
  };

  const refreshCurrentUserAndRoute = async (options?: { replace?: boolean }) => {
    const me = await refreshCurrentUser();
    const nextRoute = routeForAuthenticatedUser(me);

    if (options?.replace === false) {
      router.push(nextRoute);
    } else {
      router.replace(nextRoute);
    }

    return me;
  };

  const maybeSaveFcmToken = async () => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("vael_fcm_token");
    if (!token) return;
    try {
      await apiRequestAuth(API_ENDPOINTS.user.fcmToken, {
        method: "POST",
        body: JSON.stringify({ token }),
      });
    } catch {
      // Best-effort only.
    }
  };

  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const hydrate = async () => {
      const bootstrapRevision = authStateRevisionRef.current;
      const storedAuthFlowMode = readStoredAuthFlowMode();
      const storedPendingPhone = readStoredPendingPhone();
      const storedSignupToken = readStoredSignupToken();
      setAuthFlowMode(storedAuthFlowMode);
      setPendingPhone(storedPendingPhone);
      setSignupToken(storedSignupToken);

      try {
        const restoredUser = await Promise.race([
          bootstrapSession<User>(),
          new Promise<null>((_, reject) => {
            timeoutId = setTimeout(
              () => reject(new Error("Auth bootstrap timeout")),
              AUTH_BOOTSTRAP_TIMEOUT_MS
            );
          }),
        ]);

        if (cancelled) {
          return;
        }

        if (authStateRevisionRef.current !== bootstrapRevision) {
          debugLog("[auth] Ignoring stale bootstrap result");
          return;
        }

        if (restoredUser) {
          setUser(restoredUser);
          clearPendingAuthFlow();
        } else {
          clearMemberSessionState();
          setUser(null);
          setIsInitialized(true);
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        if (authStateRevisionRef.current !== bootstrapRevision) {
          debugLog("[auth] Ignoring stale bootstrap error");
          return;
        }

        clearMemberSessionState();
        setUser(null);
        setIsInitialized(true);
        if (
          error instanceof Error &&
          error.message === "Auth bootstrap timeout"
        ) {
          if (authDebug) {
            console.warn(
              "[auth] Bootstrap timeout; proceeding as unauthenticated"
            );
          }
        } else {
          debugError("[auth] failed to bootstrap session", error);
        }
      } finally {
        if (!cancelled) {
          setIsInitialized(true);
        }
        if (timeoutId !== undefined) clearTimeout(timeoutId);
      }
    };

    void hydrate();

    return () => {
      cancelled = true;
      if (timeoutId !== undefined) clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToSessionInvalidation(() => {
      bumpAuthStateRevision();
      setUser(null);
      setIsInitialized(true);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const startSignup = async (phone: string) => {
    await apiRequest<{ ok: boolean }>(API_ENDPOINTS.auth.signup.start, {
      method: "POST",
      body: JSON.stringify({ phone }),
    });

    setAuthFlowMode("signup");
    setPendingPhone(phone);
    writeStoredAuthFlowMode("signup");
    writeStoredPendingPhone(phone);
    router.push("/signup/otp");
  };

  const verifySignupOtp = async (otp: string) => {
    if (authFlowMode !== "signup") {
      throw new Error("Signup verification has expired. Please start again.");
    }
    if (!pendingPhone) throw new Error("Phone number is missing");

    const response = await apiRequest<{ ok: true; signupToken: string }>(
      API_ENDPOINTS.auth.signup.verify,
      {
        method: "POST",
        body: JSON.stringify({ phone: pendingPhone, code: otp }),
      }
    );

    setAuthFlowMode("signup");
    setSignupToken(response.signupToken);
    writeStoredAuthFlowMode("signup");
    writeStoredSignupToken(response.signupToken);
    router.push("/signup/password");
  };

  const verifySignupOtpMock = async () => {
    if (authFlowMode !== "signup") {
      throw new Error("Signup verification has expired. Please start again.");
    }
    if (!pendingPhone) throw new Error("Phone number is missing");
    if (!allowTestBypass) throw new Error("Mock OTP is disabled.");

    const response = await apiRequest<{ ok: true; signupToken: string }>(
      API_ENDPOINTS.auth.signup.mockVerify,
      {
        method: "POST",
        body: JSON.stringify({ phone: pendingPhone }),
      }
    );

    setAuthFlowMode("signup");
    setSignupToken(response.signupToken);
    writeStoredAuthFlowMode("signup");
    writeStoredSignupToken(response.signupToken);
    router.push("/signup/password");
  };

  const completeSignup = async (password: string) => {
    if (authFlowMode !== "signup") {
      throw new Error("Signup session missing");
    }
    if (!signupToken) throw new Error("Signup session missing");

    const response = await apiRequest<AuthenticatedSessionResponse>(
      API_ENDPOINTS.auth.signup.complete,
      {
        method: "POST",
        body: JSON.stringify({ signupToken, password }),
      }
    );

    debugLog("[signup] complete response", {
      hasAccessToken: Boolean(response.accessToken),
      role: response.user.role,
    });

    if (!isAuthenticatedSessionResponse(response)) {
      throw new Error("Unexpected signup response. Please try again.");
    }

    applyAuthenticatedUser(response.accessToken, response.user);
    router.push(routeForAuthenticatedUser(response.user));
    void maybeSaveFcmToken();
  };

  const startLogin = async (phone: string, password: string) => {
    const response = await apiRequest<LoginApiResponse>(API_ENDPOINTS.auth.login, {
      method: "POST",
      body: JSON.stringify({ phone, password, rememberMe: true }),
    });

    setAuthFlowMode("signin");
    setPendingPhone(phone);
    writeStoredAuthFlowMode("signin");
    writeStoredPendingPhone(phone);

    if ("otpRequired" in response && response.otpRequired) {
      return { otpRequired: true };
    }

    if (!isAuthenticatedSessionResponse(response)) {
      throw new Error("Unexpected login response. Please try again.");
    }

    applyAuthenticatedUser(response.accessToken, response.user);
    router.push(routeForAuthenticatedUser(response.user));
    void maybeSaveFcmToken();
    return { otpRequired: false };
  };

  const startEmployeeLogin = async (employeeId: string, password: string) => {
    const response = await apiRequest<AuthenticatedSessionResponse>(
      API_ENDPOINTS.employee.auth.login,
      {
        method: "POST",
        body: JSON.stringify({ employeeId, password, rememberMe: true }),
      }
    );

    if (!isAuthenticatedSessionResponse(response)) {
      throw new Error("Unexpected employee login response. Please try again.");
    }

    applyAuthenticatedUser(response.accessToken, response.user);
    router.push(routeForAuthenticatedUser(response.user));
  };

  const verifySigninOtp = async (otp: string) => {
    if (authFlowMode !== "signin") {
      throw new Error("Sign-in verification has expired. Please sign in again.");
    }
    if (!pendingPhone) throw new Error("Phone number is missing");

    const response = await apiRequest<AuthenticatedSessionResponse>(
      API_ENDPOINTS.auth.otp.verify,
      {
        method: "POST",
        body: JSON.stringify({
          phone: pendingPhone,
          code: otp,
          rememberMe: true,
        }),
      }
    );

    if (!isAuthenticatedSessionResponse(response)) {
      throw new Error("Unexpected OTP response. Please try again.");
    }

    applyAuthenticatedUser(response.accessToken, response.user);
    router.push(routeForAuthenticatedUser(response.user));
    void maybeSaveFcmToken();
  };

  const resendSigninOtp = async () => {
    if (authFlowMode !== "signin") {
      throw new Error("Sign-in verification has expired. Please sign in again.");
    }
    if (!pendingPhone) throw new Error("Phone number is missing");

    await apiRequest<{ ok: true }>(API_ENDPOINTS.auth.otp.send, {
      method: "POST",
      body: JSON.stringify({ phone: pendingPhone }),
    });
  };

  const verifySigninOtpMock = async () => {
    if (authFlowMode !== "signin") {
      throw new Error("Sign-in verification has expired. Please sign in again.");
    }
    if (!pendingPhone) throw new Error("Phone number is missing");
    if (!allowTestBypass) throw new Error("Mock OTP is disabled.");

    const response = await apiRequest<AuthenticatedSessionResponse>(
      API_ENDPOINTS.auth.otp.mockVerify,
      {
        method: "POST",
        body: JSON.stringify({ phone: pendingPhone, rememberMe: true }),
      }
    );

    if (!isAuthenticatedSessionResponse(response)) {
      throw new Error("Unexpected OTP response. Please try again.");
    }

    applyAuthenticatedUser(response.accessToken, response.user);
    router.push(routeForAuthenticatedUser(response.user));
    void maybeSaveFcmToken();
  };

  const resendSignupOtp = async () => {
    if (authFlowMode !== "signup") {
      throw new Error("Signup verification has expired. Please start again.");
    }
    if (!pendingPhone) throw new Error("Phone number is missing");

    await apiRequest<{ ok: true }>(API_ENDPOINTS.auth.signup.start, {
      method: "POST",
      body: JSON.stringify({ phone: pendingPhone }),
    });
  };

  const logout = async () => {
    const nextRoute =
      user?.role === "EMPLOYEE" || user?.role === "ADMIN"
        ? "/staff/login"
        : "/signin";

    try {
      await apiRequest<{ ok: true }>(API_ENDPOINTS.auth.logout, {
        method: "POST",
        body: JSON.stringify({}),
      });
    } catch {
      // Best-effort.
    }

    clearAllLocalAuthState();
    router.push(nextRoute);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isAuthResolved: isInitialized,
        user,
        authFlowMode,
        onboardingStep,
        pendingPhone,
        signupToken,
        resetAuthFlow,
        startSignup,
        verifySignupOtp,
        verifySignupOtpMock,
        completeSignup,
        startLogin,
        startEmployeeLogin,
        verifySigninOtp,
        verifySigninOtpMock,
        resendSigninOtp,
        resendSignupOtp,
        refreshCurrentUser,
        refreshCurrentUserAndRoute,
        logout,
        appStateCode,
        appStateRedirectTo,
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

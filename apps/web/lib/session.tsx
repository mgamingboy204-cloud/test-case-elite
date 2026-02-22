"use client";

import { createContext, type CSSProperties, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch, refreshAccessToken } from "./api";
import { clearAccessToken, getAccessToken } from "./authToken";
import { queryKeys } from "./queryKeys";

export type SessionStatus = "loading" | "logged-in" | "logged-out";

export type SessionUser = {
  id: string;
  phone: string;
  role: "USER" | "ADMIN";
  isAdmin: boolean;
  status: string;
  email?: string | null;
  verifiedAt?: string | null;
  phoneVerifiedAt?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  displayName?: string | null;
  gender?: string | null;
  onboardingStep?: string | null;
  videoVerificationStatus?: string | null;
  paymentStatus?: string | null;
  profileCompletedAt?: string | null;
};

type AuthContextValue = {
  status: SessionStatus;
  user: SessionUser | null;
  refresh: () => Promise<SessionUser | null>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const BLOCKED_STORAGE_DISMISSED_KEY = "em_auth_storage_prompt_dismissed";
const APP_OPEN_MARKER_KEY = "em_app_has_opened";

const AUTH_ROUTES = new Set(["/login", "/signup", "/otp"]);

function isAuthRoute(pathname: string | null) {
  if (!pathname) return false;
  if (AUTH_ROUTES.has(pathname)) return true;
  return pathname.startsWith("/auth");
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const onAuthRoute = isAuthRoute(pathname);
  const logoutTriggeredRef = useRef(false);
  const [showBlockedStoragePrompt, setShowBlockedStoragePrompt] = useState(false);
  const [isFreshOpen, setIsFreshOpen] = useState(false);
  const [refreshAttempted, setRefreshAttempted] = useState(false);

  const meQuery = useQuery({
    enabled: !onAuthRoute,
    queryKey: queryKeys.me,
    queryFn: () => apiFetch<SessionUser>("/me", { retryOnUnauthorized: true }),
    retry: false,
    staleTime: 15000,
    refetchOnWindowFocus: true
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hasOpened = window.sessionStorage.getItem(APP_OPEN_MARKER_KEY) === "1";
    if (!hasOpened) {
      setIsFreshOpen(true);
      window.sessionStorage.setItem(APP_OPEN_MARKER_KEY, "1");
    }
  }, []);

  useEffect(() => {
    const hasAccessToken = Boolean(getAccessToken());
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.debug("[auth-client] bootstrap-refresh", { hasAccessToken });
    }
    if (onAuthRoute || hasAccessToken) return;
    void refreshAccessToken().then((token) => {
      setRefreshAttempted(true);
      if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.debug("[auth-client] bootstrap-refresh-result", { success: Boolean(token) });
      }
      if (token) {
        queryClient.invalidateQueries({ queryKey: queryKeys.me });
      }
    });
  }, [onAuthRoute, queryClient]);

  useEffect(() => {
    if (!meQuery.isError) {
      logoutTriggeredRef.current = false;
      return;
    }
    if (logoutTriggeredRef.current) return;
    logoutTriggeredRef.current = true;
    void apiFetch("/auth/logout", { method: "POST", auth: "omit" }).catch(() => undefined);
    clearAccessToken();
  }, [meQuery.isError]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isFreshOpen || !refreshAttempted) return;
    if (getAccessToken()) return;
    if (meQuery.isLoading) return;
    if (meQuery.data) return;

    const dismissed = window.localStorage.getItem(BLOCKED_STORAGE_DISMISSED_KEY) === "1";
    if (!dismissed) {
      setShowBlockedStoragePrompt(true);
    }
  }, [isFreshOpen, meQuery.data, meQuery.isLoading, refreshAttempted]);

  const status: SessionStatus = meQuery.isLoading
    ? "loading"
    : meQuery.data
      ? "logged-in"
      : "logged-out";
  const user = meQuery.data ?? null;

  const refresh = useCallback(async () => {
    try {
      const result = await queryClient.fetchQuery({
        queryKey: queryKeys.me,
        queryFn: () => apiFetch<SessionUser>("/me", { retryOnUnauthorized: true }),
        retry: false
      });
      return result ?? null;
    } catch {
      return null;
    }
  }, [queryClient]);

  const value = useMemo(() => ({ status, user, refresh }), [status, user, refresh]);

  const handleBlockedStorageEnable = useCallback(async () => {
    setShowBlockedStoragePrompt(false);
    window.localStorage.setItem(BLOCKED_STORAGE_DISMISSED_KEY, "1");
    await refreshAccessToken();
    await queryClient.invalidateQueries({ queryKey: queryKeys.me });
  }, [queryClient]);

  const handleBlockedStorageDismiss = useCallback(() => {
    setShowBlockedStoragePrompt(false);
    window.localStorage.setItem(BLOCKED_STORAGE_DISMISSED_KEY, "1");
  }, []);

  return (
    <AuthContext.Provider value={value}>
      {children}
      {showBlockedStoragePrompt ? (
        <div style={promptBackdropStyle} role="dialog" aria-modal="false" aria-label="Stay signed in">
          <div style={promptCardStyle}>
            <h3 style={{ margin: 0 }}>Stay signed in?</h3>
            <p style={{ margin: "8px 0 0", fontSize: 14, color: "var(--muted)" }}>
              Enable essential cookies/storage to keep you logged in.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
              <button type="button" onClick={handleBlockedStorageDismiss} style={promptSecondaryButtonStyle}>
                Not now
              </button>
              <button type="button" onClick={handleBlockedStorageEnable} style={promptPrimaryButtonStyle}>
                Enable
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AuthContext.Provider>
  );
}

export function useSession() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useSession must be used within AuthProvider");
  return context;
}

const promptBackdropStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(15, 23, 42, 0.24)",
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "center",
  padding: "16px",
  pointerEvents: "none",
  zIndex: 9998
};

const promptCardStyle: CSSProperties = {
  width: "100%",
  maxWidth: 420,
  borderRadius: "14px",
  background: "var(--panel)",
  boxShadow: "var(--shadow-lg)",
  border: "1px solid var(--border)",
  padding: "16px",
  pointerEvents: "auto"
};

const promptSecondaryButtonStyle: CSSProperties = {
  borderRadius: "10px",
  padding: "8px 12px",
  background: "transparent",
  border: "1px solid var(--border)",
  fontWeight: 600
};

const promptPrimaryButtonStyle: CSSProperties = {
  borderRadius: "10px",
  padding: "8px 12px",
  background: "var(--primary)",
  color: "white",
  border: "none",
  fontWeight: 600
};

"use client";

import { createContext, ReactNode, useContext, useEffect, useMemo, useRef } from "react";
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const logoutTriggeredRef = useRef(false);
  const meQuery = useQuery({
    queryKey: queryKeys.me,
    queryFn: () => apiFetch<SessionUser>("/me", { retryOnUnauthorized: true }),
    staleTime: 15000,
    refetchOnWindowFocus: true
  });

  useEffect(() => {
    if (getAccessToken()) return;
    void refreshAccessToken().then((token) => {
      if (token) {
        queryClient.invalidateQueries({ queryKey: queryKeys.me });
      }
    });
  }, [queryClient]);

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

  const status: SessionStatus = meQuery.isLoading
    ? "loading"
    : meQuery.data
      ? "logged-in"
      : "logged-out";
  const user = meQuery.data ?? null;

  const refresh = async () => {
    try {
      const result = await queryClient.fetchQuery({
        queryKey: queryKeys.me,
        queryFn: () => apiFetch<SessionUser>("/me", { retryOnUnauthorized: true })
      });
      return result ?? null;
    } catch {
      return null;
    }
  };

  const value = useMemo(() => ({ status, user, refresh }), [status, user, refresh]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useSession() {
  const context = useContext(AuthContext);
  if (!context) {
    return { status: "logged-out" as const, user: null, refresh: async () => null };
  }
  return context;
}

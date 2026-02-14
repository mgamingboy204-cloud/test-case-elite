"use client";

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { apiFetch, refreshAccessToken } from "./api";
import { apiEndpoints } from "./apiEndpoints";
import { clearAccessToken, getAccessToken } from "./authToken";

export type SessionStatus = "loading" | "logged-in" | "logged-out";

export type SessionUser = import("@elite/contracts").SessionUser;


type AuthContextValue = {
  status: SessionStatus;
  user: SessionUser | null;
  refresh: () => Promise<SessionUser | null>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SessionStatus>("loading");
  const [user, setUser] = useState<SessionUser | null>(null);

  const loadUser = useCallback(async () => {
    try {
      const me = await apiFetch(apiEndpoints.me, { retryOnUnauthorized: true });
      setUser(me);
      setStatus("logged-in");
      return me;
    } catch {
      setUser(null);
      setStatus("logged-out");
      return null;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const bootstrapSession = async () => {
      setStatus("loading");

      const hasToken = Boolean(getAccessToken());
      if (!hasToken) {
        const refreshed = await refreshAccessToken();
        if (!refreshed) {
          if (!mounted) return;
          setUser(null);
          setStatus("logged-out");
          return;
        }
      }

      if (!mounted) return;
      try {
        const me = await apiFetch(apiEndpoints.me, { retryOnUnauthorized: true });
        if (!mounted) return;
        setUser(me);
        setStatus("logged-in");
      } catch {
        if (!mounted) return;
        clearAccessToken();
        setUser(null);
        setStatus("logged-out");
      }
    };

    void bootstrapSession();

    return () => {
      mounted = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    return loadUser();
  }, [loadUser]);

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

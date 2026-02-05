"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import { apiFetch } from "./api";
import { clearAuthToken, getAuthToken, setAuthToken } from "./authToken";

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
  token: string | null;
  refresh: () => Promise<SessionUser | null>;
  setUser: (user: SessionUser | null) => void;
  setStatus: (status: SessionStatus) => void;
  setToken: (token: string | null, rememberMe?: boolean) => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SessionStatus>("loading");
  const [user, setUser] = useState<SessionUser | null>(null);
  const [token, setTokenState] = useState<string | null>(null);

  useEffect(() => {
    setTokenState(getAuthToken());
  }, []);

  const refresh = useCallback(async () => {
    try {
      const data = await apiFetch<SessionUser>("/me");
      setStatus("logged-in");
      setUser(data);
      return data;
    } catch (error) {
      setStatus("logged-out");
      setUser(null);
      clearAuthToken();
      setTokenState(null);
      return null;
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const setToken = useCallback((nextToken: string | null, rememberMe = true) => {
    if (nextToken) {
      setAuthToken(nextToken, rememberMe);
      setTokenState(nextToken);
    } else {
      clearAuthToken();
      setTokenState(null);
    }
  }, []);

  const value = useMemo(
    () => ({ status, user, token, refresh, setUser, setStatus, setToken }),
    [status, user, token, refresh, setToken]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useSession() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useSession must be used within AuthProvider");
  }
  return context;
}

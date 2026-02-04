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
import { API_URL } from "./api";
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
  setToken: (token: string | null) => void;
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
      const authToken = getAuthToken();
      const res = await fetch(`${API_URL}/me`, {
        credentials: "include",
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined
      });
      if (!res.ok) {
        setStatus("logged-out");
        setUser(null);
        clearAuthToken();
        setTokenState(null);
        return null;
      }
      const data = (await res.json()) as SessionUser;
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

  const setToken = useCallback((nextToken: string | null) => {
    if (nextToken) {
      setAuthToken(nextToken);
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

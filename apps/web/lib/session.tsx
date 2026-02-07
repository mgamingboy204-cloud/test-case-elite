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
import { apiFetch, refreshAccessToken } from "./api";
import { clearAccessToken, setAccessToken } from "./authToken";

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
  setUser: (user: SessionUser | null) => void;
  setStatus: (status: SessionStatus) => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SessionStatus>("loading");
  const [user, setUser] = useState<SessionUser | null>(null);

  const refresh = useCallback(async () => {
    try {
      const token = await refreshAccessToken();
      if (!token) {
        clearAccessToken();
        setStatus("logged-out");
        setUser(null);
        return null;
      }
      setAccessToken(token);
      const data = await apiFetch<SessionUser>("/me");
      setStatus("logged-in");
      setUser(data);
      return data;
    } catch (error) {
      clearAccessToken();
      setStatus("logged-out");
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({ status, user, refresh, setUser, setStatus }),
    [status, user, refresh]
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

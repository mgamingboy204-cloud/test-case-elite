'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { apiClient } from './api';

interface AuthContextType {
  token: string | null;
  userId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setToken: (token: string, userId: string) => void;
  logout: () => void;
  getHeaders: () => Record<string, string>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);
  const [userId, setUserIdState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session from storage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    const storedUserId = localStorage.getItem('user_id');
    if (storedToken && storedUserId) {
      setTokenState(storedToken);
      setUserIdState(storedUserId);
    }
    setIsLoading(false);
  }, []);

  const setToken = useCallback((newToken: string, newUserId: string) => {
    setTokenState(newToken);
    setUserIdState(newUserId);
    localStorage.setItem('auth_token', newToken);
    localStorage.setItem('user_id', newUserId);
  }, []);

  const logout = useCallback(() => {
    setTokenState(null);
    setUserIdState(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_id');
  }, []);

  const getHeaders = useCallback(() => {
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };
  }, [token]);

  // Initialize apiClient with getHeaders on every token change
  useEffect(() => {
    apiClient.setGetHeaders(getHeaders);
  }, [getHeaders]);

  return (
    <AuthContext.Provider
      value={{
        token,
        userId,
        isAuthenticated: !!token,
        isLoading,
        setToken,
        logout,
        getHeaders,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

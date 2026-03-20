/**
 * Token storage abstraction.
 * Handles all persistent storage of auth tokens.
 * Provides a single interface to read/write/clear tokens.
 */

import { AUTH_STORAGE_KEYS, ALL_AUTH_STORAGE_KEYS } from "./constants";

function isClientSide(): boolean {
  return typeof window !== "undefined";
}

/**
 * Read access token from localStorage.
 * Returns null if not set or on server side.
 */
export function readStoredAccessToken(): string | null {
  if (!isClientSide()) return null;
  try {
    return localStorage.getItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN);
  } catch {
    return null;
  }
}

/**
 * Write access token to localStorage.
 * Does nothing on server side or if token is null.
 */
export function writeStoredAccessToken(token: string | null): void {
  if (!isClientSide()) return;
  try {
    if (token) {
      localStorage.setItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN, token);
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN);
    }
  } catch {
    // Silently fail on quota exceeded or other storage errors
  }
}

/**
 * Read pending phone from localStorage (temp during signup).
 */
export function readStoredPendingPhone(): string | null {
  if (!isClientSide()) return null;
  try {
    return localStorage.getItem(AUTH_STORAGE_KEYS.PENDING_PHONE);
  } catch {
    return null;
  }
}

/**
 * Write pending phone to localStorage.
 */
export function writeStoredPendingPhone(phone: string | null): void {
  if (!isClientSide()) return;
  try {
    if (phone) {
      localStorage.setItem(AUTH_STORAGE_KEYS.PENDING_PHONE, phone);
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEYS.PENDING_PHONE);
    }
  } catch {
    // Silently fail
  }
}

/**
 * Read signup token from localStorage (temp after OTP verify).
 */
export function readStoredSignupToken(): string | null {
  if (!isClientSide()) return null;
  try {
    return localStorage.getItem(AUTH_STORAGE_KEYS.SIGNUP_TOKEN);
  } catch {
    return null;
  }
}

/**
 * Write signup token to localStorage.
 */
export function writeStoredSignupToken(token: string | null): void {
  if (!isClientSide()) return;
  try {
    if (token) {
      localStorage.setItem(AUTH_STORAGE_KEYS.SIGNUP_TOKEN, token);
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEYS.SIGNUP_TOKEN);
    }
  } catch {
    // Silently fail
  }
}

/**
 * Clear all auth-related storage (tokens, temp states).
 * Used on logout or session revocation.
 */
export function clearAllAuthStorage(): void {
  if (!isClientSide()) return;
  try {
    for (const key of ALL_AUTH_STORAGE_KEYS) {
      localStorage.removeItem(key);
    }
  } catch {
    // Silently fail
  }
}

/**
 * Centralized auth storage key constants.
 * All auth-related localStorage keys defined in one place.
 */

export const AUTH_STORAGE_KEYS = {
  // Main access token
  ACCESS_TOKEN: "vael_access_token",

  // Temporary tokens during signup flow
  PENDING_PHONE: "vael_pending_phone",
  SIGNUP_TOKEN: "vael_signup_token",
} as const;

/** All auth keys for cleanup operations */
export const ALL_AUTH_STORAGE_KEYS = Object.values(AUTH_STORAGE_KEYS);

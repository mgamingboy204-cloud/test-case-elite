const PENDING_PHONE_STORAGE_KEY = "vael_pending_phone";
const SIGNUP_TOKEN_STORAGE_KEY = "vael_signup_token";

function canUseStorage() {
  return typeof window !== "undefined";
}

function readStorageValue(key: string) {
  if (!canUseStorage()) return null;
  const value = window.localStorage.getItem(key)?.trim() ?? "";
  if (!value || value === "undefined" || value === "null") {
    window.localStorage.removeItem(key);
    return null;
  }
  return value;
}

function writeStorageValue(key: string, value: string | null) {
  if (!canUseStorage()) return;
  const normalized = value?.trim() ?? "";
  if (!normalized || normalized === "undefined" || normalized === "null") {
    window.localStorage.removeItem(key);
    return;
  }
  window.localStorage.setItem(key, normalized);
}

export function readPendingPhone() {
  return readStorageValue(PENDING_PHONE_STORAGE_KEY);
}

export function savePendingPhone(phone: string | null) {
  writeStorageValue(PENDING_PHONE_STORAGE_KEY, phone);
}

export function clearPendingPhone() {
  writeStorageValue(PENDING_PHONE_STORAGE_KEY, null);
}

export function readSignupToken() {
  return readStorageValue(SIGNUP_TOKEN_STORAGE_KEY);
}

export function saveSignupToken(token: string | null) {
  writeStorageValue(SIGNUP_TOKEN_STORAGE_KEY, token);
}

export function clearSignupToken() {
  writeStorageValue(SIGNUP_TOKEN_STORAGE_KEY, null);
}

export function clearTransientAuthStorage() {
  clearPendingPhone();
  clearSignupToken();
}

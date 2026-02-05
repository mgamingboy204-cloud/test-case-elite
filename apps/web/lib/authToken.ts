const storageKey = "authToken";
const storageModeKey = "authTokenStorage";

type StorageMode = "local" | "session";

export function getAuthToken() {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(storageKey) ?? window.localStorage.getItem(storageKey);
}

export function getAuthTokenStorage(): StorageMode | null {
  if (typeof window === "undefined") return null;
  if (window.sessionStorage.getItem(storageKey)) return "session";
  if (window.localStorage.getItem(storageKey)) return "local";
  const mode = window.localStorage.getItem(storageModeKey);
  return mode === "session" || mode === "local" ? mode : null;
}

export function setAuthToken(token: string, rememberMe = true) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(storageKey);
  window.sessionStorage.removeItem(storageKey);
  if (rememberMe) {
    window.localStorage.setItem(storageKey, token);
    window.localStorage.setItem(storageModeKey, "local");
  } else {
    window.sessionStorage.setItem(storageKey, token);
    window.localStorage.setItem(storageModeKey, "session");
  }
}

export function clearAuthToken() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(storageKey);
  window.sessionStorage.removeItem(storageKey);
  window.localStorage.removeItem(storageModeKey);
}

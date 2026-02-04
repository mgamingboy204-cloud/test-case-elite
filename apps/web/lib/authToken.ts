const storageKey = "authToken";

export function getAuthToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(storageKey);
}

export function setAuthToken(token: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKey, token);
}

export function clearAuthToken() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(storageKey);
}

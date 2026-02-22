let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
  if (typeof window !== "undefined") {
    try {
      if (token) {
        window.localStorage.setItem("em_access_token", token);
      } else {
        window.localStorage.removeItem("em_access_token");
      }
    } catch {
      // Ignore storage failures (private mode / blocked storage).
    }
  }
}

export function getAccessToken() {
  if (accessToken) return accessToken;
  if (typeof window === "undefined") return null;
  try {
    const stored = window.localStorage.getItem("em_access_token");
    accessToken = stored;
    return stored;
  } catch {
    return null;
  }
}

export function clearAccessToken() {
  accessToken = null;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem("em_access_token");
    } catch {
      // Ignore storage failures (private mode / blocked storage).
    }
  }
}

export function hasPersistentStorageAccess() {
  if (typeof window === "undefined") return false;
  try {
    const key = "__em_storage_probe";
    window.localStorage.setItem(key, "1");
    window.localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

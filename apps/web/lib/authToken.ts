let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
  if (typeof window !== "undefined") {
    if (token) {
      window.localStorage.setItem("em_access_token", token);
    } else {
      window.localStorage.removeItem("em_access_token");
    }
  }
}

export function getAccessToken() {
  if (accessToken) return accessToken;
  if (typeof window === "undefined") return null;
  const stored = window.localStorage.getItem("em_access_token");
  accessToken = stored;
  return stored;
}

export function clearAccessToken() {
  accessToken = null;
  if (typeof window !== "undefined") {
    window.localStorage.removeItem("em_access_token");
  }
}

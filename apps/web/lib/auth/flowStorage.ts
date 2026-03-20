import { AUTH_FLOW_STORAGE_KEYS, AUTH_FLOW_TTL_MS } from "./constants";

type AuthFlowKey = keyof typeof AUTH_FLOW_STORAGE_KEYS;
export type AuthFlowMode = "signin" | "signup";

type StoredAuthFlowValue = {
  value: string;
  expiresAt: number;
};

function canUseSessionStorage() {
  return typeof window !== "undefined";
}

function readStoredValue(key: AuthFlowKey): string | null {
  if (!canUseSessionStorage()) return null;

  try {
    const raw = window.sessionStorage.getItem(AUTH_FLOW_STORAGE_KEYS[key]);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<StoredAuthFlowValue>;
    const value = typeof parsed.value === "string" ? parsed.value.trim() : "";
    const expiresAt = typeof parsed.expiresAt === "number" ? parsed.expiresAt : 0;

    if (!value || value === "undefined" || value === "null" || expiresAt <= Date.now()) {
      window.sessionStorage.removeItem(AUTH_FLOW_STORAGE_KEYS[key]);
      return null;
    }

    return value;
  } catch {
    window.sessionStorage.removeItem(AUTH_FLOW_STORAGE_KEYS[key]);
    return null;
  }
}

function writeStoredValue(key: AuthFlowKey, value: string | null) {
  if (!canUseSessionStorage()) return;

  try {
    const normalized = value?.trim() ?? "";
    if (!normalized || normalized === "undefined" || normalized === "null") {
      window.sessionStorage.removeItem(AUTH_FLOW_STORAGE_KEYS[key]);
      return;
    }

    const payload: StoredAuthFlowValue = {
      value: normalized,
      expiresAt: Date.now() + AUTH_FLOW_TTL_MS[key]
    };

    window.sessionStorage.setItem(AUTH_FLOW_STORAGE_KEYS[key], JSON.stringify(payload));
  } catch {
    window.sessionStorage.removeItem(AUTH_FLOW_STORAGE_KEYS[key]);
  }
}

export function readStoredPendingPhone() {
  return readStoredValue("pendingPhone");
}

export function readStoredAuthFlowMode(): AuthFlowMode | null {
  const value = readStoredValue("mode");
  if (value === "signin" || value === "signup") return value;
  return null;
}

export function writeStoredPendingPhone(phone: string | null) {
  writeStoredValue("pendingPhone", phone);
}

export function readStoredSignupToken() {
  return readStoredValue("signupToken");
}

export function writeStoredAuthFlowMode(mode: AuthFlowMode | null) {
  writeStoredValue("mode", mode);
}

export function writeStoredSignupToken(token: string | null) {
  writeStoredValue("signupToken", token);
}

export function clearAuthFlowStorage() {
  if (!canUseSessionStorage()) return;

  try {
    for (const key of Object.values(AUTH_FLOW_STORAGE_KEYS)) {
      window.sessionStorage.removeItem(key);
    }
  } catch {
    // ignore storage failures
  }
}

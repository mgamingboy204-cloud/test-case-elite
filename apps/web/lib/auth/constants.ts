export const AUTH_FLOW_STORAGE_KEYS = {
  mode: "vael_auth_flow_mode",
  pendingPhone: "vael_auth_flow_pending_phone",
  signupToken: "vael_auth_flow_signup_token"
} as const;

export const AUTH_FLOW_TTL_MS = {
  mode: 1000 * 60 * 30,
  pendingPhone: 1000 * 60 * 30,
  signupToken: 1000 * 60 * 30
} as const;

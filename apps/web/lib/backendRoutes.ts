import { apiFetch } from "./api";

export const backendRoutes = {
  health: {
    get: () => apiFetch<{ ok: boolean; uptime: number }>("/health", { auth: "omit" })
  },
  auth: {
    sendOtp: (body: { phone: string }) => apiFetch("/auth/otp/send", { method: "POST", auth: "omit", body: JSON.stringify(body) }),
    verifyOtp: (body: { phone: string; code: string }) =>
      apiFetch("/auth/otp/verify", { method: "POST", auth: "omit", body: JSON.stringify(body) }),
    register: (body: Record<string, unknown>) =>
      apiFetch("/auth/register", { method: "POST", auth: "omit", body: JSON.stringify(body) }),
    login: (body: { phone: string; password: string }) =>
      apiFetch("/auth/login", { method: "POST", auth: "omit", body: JSON.stringify(body) }),
    refresh: () => apiFetch("/auth/token/refresh", { method: "POST", auth: "omit", body: JSON.stringify({}) }),
    logout: () => apiFetch("/auth/logout", { method: "POST", auth: "omit" })
  },
  user: {
    me: () => apiFetch("/me"),
    devWhoAmI: () => apiFetch("/dev/whoami")
  },
  profile: {
    get: () => apiFetch("/profile"),
    update: (body: Record<string, unknown>) => apiFetch("/profile", { method: "PUT", body: JSON.stringify(body) }),
    complete: () => apiFetch("/profile/complete", { method: "POST" })
  },
  photos: {
    listMe: () => apiFetch("/photos/me"),
    upload: (body: { filename: string; dataUrl: string }) =>
      apiFetch("/photos/upload", { method: "POST", body: JSON.stringify(body) })
  },
  discover: {
    profiles: (query = "") => apiFetch(`/profiles${query}`),
    feed: (query = "") => apiFetch(`/discover${query}`),
    profileDetail: (userId: string) => apiFetch(`/profiles/${userId}`)
  },
  likes: {
    create: (body: Record<string, unknown>) => apiFetch("/likes", { method: "POST", body: JSON.stringify(body) }),
    incoming: () => apiFetch("/likes/incoming")
  },
  matches: {
    list: () => apiFetch("/matches"),
    respondConsent: (body: Record<string, unknown>) =>
      apiFetch("/consent/respond", { method: "POST", body: JSON.stringify(body) }),
    phoneUnlock: (matchId: string) => apiFetch(`/phone-unlock/${matchId}`)
  },
  reports: {
    create: (body: Record<string, unknown>) => apiFetch("/reports", { method: "POST", body: JSON.stringify(body) })
  },
  refunds: {
    request: (body: Record<string, unknown>) => apiFetch("/refunds/request", { method: "POST", body: JSON.stringify(body) }),
    me: () => apiFetch("/refunds/me")
  },
  admin: {
    users: () => apiFetch("/admin/users"),
    dashboard: () => apiFetch("/admin/dashboard"),
    reports: () => apiFetch("/admin/reports"),
    refunds: () => apiFetch("/admin/refunds"),
    verificationRequests: () => apiFetch("/admin/verification-requests"),
    approveUser: (id: string) => apiFetch(`/admin/users/${id}/approve`, { method: "POST" }),
    rejectUser: (id: string) => apiFetch(`/admin/users/${id}/reject`, { method: "POST" }),
    banUser: (id: string) => apiFetch(`/admin/users/${id}/ban`, { method: "POST" }),
    deactivateUser: (id: string) => apiFetch(`/admin/users/${id}/deactivate`, { method: "POST" }),
    deleteUser: (id: string) => apiFetch(`/admin/users/${id}/delete`, { method: "POST" }),
    approveRefund: (id: string) => apiFetch(`/admin/refunds/${id}/approve`, { method: "POST" }),
    denyRefund: (id: string) => apiFetch(`/admin/refunds/${id}/deny`, { method: "POST" }),
    startVerificationRequest: (id: string, meetUrl: string) =>
      apiFetch(`/admin/verification-requests/${id}/start`, { method: "POST", body: JSON.stringify({ meetUrl }) }),
    approveVerificationRequest: (id: string) => apiFetch(`/admin/verification-requests/${id}/approve`, { method: "POST" }),
    rejectVerificationRequest: (id: string, reason: string) =>
      apiFetch(`/admin/verification-requests/${id}/reject`, { method: "POST", body: JSON.stringify({ reason }) }),
    setVerificationMeetLink: (userId: string, meetUrl: string) =>
      apiFetch(`/admin/verifications/${userId}/meet-link`, { method: "POST", body: JSON.stringify({ meetUrl }) }),
    approveVerificationForUser: (userId: string, reason?: string) =>
      apiFetch(`/admin/verifications/${userId}/approve`, { method: "POST", body: JSON.stringify({ reason }) }),
    rejectVerificationForUser: (userId: string, reason: string) =>
      apiFetch(`/admin/verifications/${userId}/reject`, { method: "POST", body: JSON.stringify({ reason }) }),
    shiftPaymentDate: (body: { userId: string; daysBack: number }) =>
      apiFetch("/admin/dev/shift-payment-date", { method: "POST", body: JSON.stringify(body) })
  },
  verification: {
    createRequest: () => apiFetch("/verification-requests", { method: "POST" }),
    myRequest: () => apiFetch("/verification-requests/me"),
    status: () => apiFetch("/verification/status"),
    myStatus: () => apiFetch("/me/verification-status")
  },
  payments: {
    me: () => apiFetch("/payments/me"),
    validateCoupon: (code: string) => apiFetch("/payments/coupon/validate", { method: "POST", body: JSON.stringify({ code }) }),
    mock: () => apiFetch("/payments/mock", { method: "POST" }),
    startMock: () => apiFetch("/payments/mock/start", { method: "POST" }),
    confirmMock: (paymentIntentId: string) =>
      apiFetch("/payments/mock/confirm", { method: "POST", body: JSON.stringify({ paymentIntentId }) })
  },
  notifications: {
    list: () => apiFetch("/notifications")
  }
};

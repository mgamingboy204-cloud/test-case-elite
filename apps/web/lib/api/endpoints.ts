/**
 * Centralized API endpoint path definitions.
 * Use these constants instead of hardcoding paths throughout the app.
 * This provides a single source of truth for all API routes.
 */

export const API_ENDPOINTS = {
  // AUTH
  auth: {
    signup: {
      start: "/auth/signup/start",
      verify: "/auth/signup/verify",
      mockVerify: "/auth/signup/mock-verify",
      complete: "/auth/signup/complete",
    },
    login: "/auth/login",
    otp: {
      verify: "/auth/otp/verify",
      mockVerify: "/auth/otp/mock-verify",
      send: "/auth/otp/send",
    },
    session: {
      bootstrap: "/auth/session",
    },
    logout: "/auth/logout",
    refreshToken: "/auth/token/refresh",
    changePassword: "/auth/change-password",
  },

  // EMPLOYEE
  employee: {
    auth: {
      login: "/employee/auth/login",
    },
    members: "/employee/members",
  },

  // USER
  user: {
    me: "/me",
    account: "/users/account",
    fcmToken: "/users/fcm-token",
  },

  // PROFILE
  profile: {
    get: "/me/profile",
    update: "/me/profile",
    details: "/me/profile/details",
    complete: "/me/profile/complete",
    settings: "/me/profile/settings",
    photos: {
      list: "/me/profile/photos",
      presignedUrl: "/me/profile/photos/presigned-url",
      confirm: "/me/profile/photos/confirm",
      reorder: "/me/profile/photos/reorder",
      delete: (photoId: string) => `/me/profile/photos/${photoId}`,
    },
  },

  // SETTINGS
  settings: {
    notifications: "/settings/notifications",
  },

  // DISCOVER
  discover: {
    feed: "/discover/feed",
  },

  // LIKES
  likes: {
    list: "/likes/incoming",
    send: "/likes",
  },

  // MATCHES
  matches: {
    list: "/matches",
    unmatch: (matchId: string) => `/matches/${matchId}`,
    consent: "/consent/respond",
  },

  // OFFLINE MEET
  offlineMeet: {
    list: (statusView?: string) => `/admin/offline-meets${statusView ? `?statusView=${statusView}` : ""}`,
    get: (matchId: string) => `/offline-meet-cases/${matchId}`,
    submitSelections: (matchId: string) => `/offline-meet-cases/${matchId}/selections`,
    employeeActions: {
      list: (statusView?: string) => `/admin/offline-meets${statusView ? `?statusView=${statusView}` : ""}`,
      assign: (caseId: string) => `/admin/offline-meets/${caseId}/assign`,
      sendOptions: (caseId: string) => `/admin/offline-meets/${caseId}/options`,
      finalize: (caseId: string) => `/admin/offline-meets/${caseId}/finalize`,
      timeout: (caseId: string) => `/admin/offline-meets/${caseId}/timeout`,
      noOverlap: (caseId: string) => `/admin/offline-meets/${caseId}/no-overlap`,
      caseUpdate: (caseId: string) => `/admin/offline-meets/${caseId}/case-update`,
    },
  },

  // ONLINE MEET
  onlineMeet: {
    list: (statusView?: string) => `/admin/online-meets${statusView ? `?statusView=${statusView}` : ""}`,
    get: (matchId: string) => `/online-meet-cases/${matchId}`,
    submitSelections: (matchId: string) => `/online-meet-cases/${matchId}/selections`,
    employeeActions: {
      list: (statusView?: string) => `/admin/online-meets${statusView ? `?statusView=${statusView}` : ""}`,
      assign: (caseId: string) => `/admin/online-meets/${caseId}/assign`,
      sendOptions: (caseId: string) => `/admin/online-meets/${caseId}/options`,
      finalize: (caseId: string) => `/admin/online-meets/${caseId}/finalize`,
      timeout: (caseId: string) => `/admin/online-meets/${caseId}/timeout`,
      noOverlap: (caseId: string) => `/admin/online-meets/${caseId}/no-overlap`,
      caseUpdate: (caseId: string) => `/admin/online-meets/${caseId}/case-update`,
    },
  },

  // SOCIAL EXCHANGE
  socialExchange: {
    cases: (matchId: string) => `/social-exchange-cases/${matchId}`,
    request: (matchId: string) => `/social-exchange-cases/${matchId}/request`,
    respond: (caseId: string) => `/social-exchange-cases/${caseId}/respond`,
    submitHandle: (caseId: string) => `/social-exchange-cases/${caseId}/handle`,
    reveal: (caseId: string) => `/social-exchange-cases/${caseId}/reveal`,
  },

  // ALERTS
  alerts: {
    list: "/alerts",
    markRead: (alertId: string) => `/alerts/${alertId}/read`,
  },

  // ADMIN
  admin: {
    dashboard: "/admin/dashboard",
    users: "/admin/users",
    verification: {
      list: (statusView?: string) => `/admin/verification-requests${statusView ? `?statusView=${statusView}` : ""}`,
      assign: (requestId: string) => `/admin/verification-requests/${requestId}/assign`,
      start: (requestId: string) => `/admin/verification-requests/${requestId}/start`,
      approve: (requestId: string) => `/admin/verification-requests/${requestId}/approve`,
      reject: (requestId: string) => `/admin/verification-requests/${requestId}/reject`,
    },
  },

  // PAYMENTS
  payments: {
    overview: "/payments/me",
    initiate: "/payments/initiate",
    verify: "/payments/verify",
    fail: "/payments/fail",
    mockComplete: "/payments/mock/complete",
  },

  // VERIFICATION
  verification: {
    video: "/verification/video",
    request: "/verification-requests",
    status: "/verification/status",
    whatsapp: "/verification/help/whatsapp",
  },
} as const;

export const invalidationMap = {
  uploadMedia: ["me", "profile", "uploads", "adminQueues"],
  likeSwipe: ["discoverFeed", "matches", "likes", "notificationsCount"],
  sendMessage: ["conversation", "inbox", "unreadCount"],
  adminVerificationAction: ["adminVideoQueue", "userVerificationStatus", "me"],
  profileUpdate: ["me", "profile"],
  refundUpdate: ["adminRefunds", "refunds"],
  refundRequest: ["refundEligibility", "refunds"],
  adminUserUpdate: ["adminUsers", "me"],
  paymentUpdate: ["paymentStatus", "me"],
  verificationRequest: ["userVerificationStatus", "adminVideoQueue", "me"]
} as const;

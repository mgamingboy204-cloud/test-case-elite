import "express-session";

declare module "express-session" {
  interface SessionData {
    userId?: string;
    otpVerifiedPhone?: string;
    pendingUserId?: string;
    pendingPhone?: string;
    pendingRememberDevice?: boolean;
  }
}

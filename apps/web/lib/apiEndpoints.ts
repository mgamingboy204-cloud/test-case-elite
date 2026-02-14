import {
  AuthLogoutResponseSchema,
  AuthOtpSendResponseSchema,
  AuthRefreshResponseSchema,
  AuthRegisterResponseSchema,
  AuthSuccessSchema,
  LoginSchema,
  OtpSendSchema,
  OtpVerifySchema,
  ProfileCompleteResponseSchema,
  ProfileReadResponseSchema,
  ProfileSchema,
  ProfileUpdateResponseSchema,
  RefreshTokenSchema,
  RegisterSchema,
  SessionUserSchema,
  VerificationRequestEnvelopeSchema,
  VerificationStatusSchema,
  VideoVerificationStatus,
  VideoVerificationStatusSchema
} from "@elite/contracts";
import { z } from "zod";

export type ApiEndpoint<TReq, TRes> = {
  name: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string | ((params: Record<string, string>) => string);
  requestSchema?: z.ZodType<TReq>;
  responseSchema: z.ZodType<TRes>;
};

const anyObj: z.ZodType<any> = z.any();

export const apiEndpoints = {
  me: { name: "me", method: "GET", path: "/me", responseSchema: SessionUserSchema },
  authOtpSend: { name: "authOtpSend", method: "POST", path: "/auth/otp/send", requestSchema: OtpSendSchema, responseSchema: AuthOtpSendResponseSchema },
  authOtpVerify: { name: "authOtpVerify", method: "POST", path: "/auth/otp/verify", requestSchema: OtpVerifySchema, responseSchema: AuthSuccessSchema },
  authRegister: { name: "authRegister", method: "POST", path: "/auth/register", requestSchema: RegisterSchema, responseSchema: AuthRegisterResponseSchema },
  authLogin: { name: "authLogin", method: "POST", path: "/auth/login", requestSchema: LoginSchema, responseSchema: z.union([AuthSuccessSchema, AuthRegisterResponseSchema]) },
  authTokenRefresh: { name: "authTokenRefresh", method: "POST", path: "/auth/token/refresh", requestSchema: RefreshTokenSchema, responseSchema: AuthRefreshResponseSchema },
  authLogout: { name: "authLogout", method: "POST", path: "/auth/logout", responseSchema: AuthLogoutResponseSchema },
  profileGet: { name: "profileGet", method: "GET", path: "/profile", responseSchema: ProfileReadResponseSchema },
  profilePut: { name: "profilePut", method: "PUT", path: "/profile", requestSchema: ProfileSchema, responseSchema: ProfileUpdateResponseSchema },
  profileComplete: { name: "profileComplete", method: "POST", path: "/profile/complete", responseSchema: ProfileCompleteResponseSchema },
  verificationCreate: { name: "verificationCreate", method: "POST", path: "/verification-requests", responseSchema: VerificationRequestEnvelopeSchema },
  verificationStatus: { name: "verificationStatus", method: "GET", path: "/me/verification-status", responseSchema: VerificationStatusSchema },

  photosUpload: { name: "photosUpload", method: "POST", path: "/photos/upload", requestSchema: anyObj, responseSchema: anyObj },
  likesIncoming: { name: "likesIncoming", method: "GET", path: "/likes/incoming", responseSchema: anyObj },
  discover: { name: "discover", method: "GET", path: ({ query }) => `/discover?${query}`, responseSchema: anyObj },
  matches: { name: "matches", method: "GET", path: "/matches", responseSchema: anyObj },
  phoneUnlock: { name: "phoneUnlock", method: "GET", path: ({ matchId }) => `/phone-unlock/${matchId}`, responseSchema: anyObj },
  adminUsers: { name: "adminUsers", method: "GET", path: "/admin/users", responseSchema: anyObj },
  adminDashboard: { name: "adminDashboard", method: "GET", path: "/admin/dashboard", responseSchema: anyObj },
  adminReports: { name: "adminReports", method: "GET", path: "/admin/reports", responseSchema: anyObj },
  adminRefunds: { name: "adminRefunds", method: "GET", path: "/admin/refunds", responseSchema: anyObj },
  adminVerificationRequests: { name: "adminVerificationRequests", method: "GET", path: ({ query }) => `/admin/verification-requests${query}`, responseSchema: anyObj },

  paymentsCouponValidate: { name: "paymentsCouponValidate", method: "POST", path: "/payments/coupon/validate", requestSchema: anyObj, responseSchema: anyObj },
  paymentsMockStart: { name: "paymentsMockStart", method: "POST", path: "/payments/mock/start", responseSchema: anyObj },
  paymentsMockConfirm: { name: "paymentsMockConfirm", method: "POST", path: "/payments/mock/confirm", responseSchema: anyObj },
  refundsMe: { name: "refundsMe", method: "GET", path: "/refunds/me", responseSchema: anyObj },
  refundsRequest: { name: "refundsRequest", method: "POST", path: "/refunds/request", requestSchema: anyObj, responseSchema: anyObj },
  likes: { name: "likes", method: "POST", path: "/likes", requestSchema: anyObj, responseSchema: anyObj },
  consentRespond: { name: "consentRespond", method: "POST", path: "/consent/respond", requestSchema: anyObj, responseSchema: anyObj },
  reports: { name: "reports", method: "POST", path: "/reports", requestSchema: anyObj, responseSchema: anyObj },
  adminVerificationStart: { name: "adminVerificationStart", method: "POST", path: ({ id }) => `/admin/verification-requests/${id}/start`, requestSchema: anyObj, responseSchema: anyObj },
  adminVerificationApprove: { name: "adminVerificationApprove", method: "POST", path: ({ id }) => `/admin/verification-requests/${id}/approve`, responseSchema: anyObj },
  adminVerificationReject: { name: "adminVerificationReject", method: "POST", path: ({ id }) => `/admin/verification-requests/${id}/reject`, requestSchema: anyObj, responseSchema: anyObj },
  adminUserAction: { name: "adminUserAction", method: "POST", path: ({ id, action }) => `/admin/users/${id}/${action}`, responseSchema: anyObj },
  adminRefundAction: { name: "adminRefundAction", method: "POST", path: ({ id, action }) => `/admin/refunds/${id}/${action}`, responseSchema: anyObj }
} satisfies Record<string, ApiEndpoint<any, any>>;

export function normalizeStatus(value: string | null | undefined): VideoVerificationStatus {
  return VideoVerificationStatusSchema.safeParse(value).success ? (value as VideoVerificationStatus) : "NOT_REQUESTED";
}

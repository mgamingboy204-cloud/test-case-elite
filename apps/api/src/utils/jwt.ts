import jwt, { JwtPayload } from "jsonwebtoken";
import { env } from "../config/env";

type TokenPayload = JwtPayload & {
  sub: string;
  type: "access" | "refresh" | "signup";
  phone?: string;
  tokenVersion?: number;
  sessionId?: string;
};

export function signAccessToken(userId: string, options?: { rememberMe?: boolean; tokenVersion?: number }) {
  const ttlMinutes = options?.rememberMe ? env.ACCESS_TOKEN_TTL_MINUTES : env.ACCESS_TOKEN_TTL_MINUTES_SHORT;
  return jwt.sign({ sub: userId, type: "access", tokenVersion: options?.tokenVersion ?? 0 }, env.JWT_ACCESS_SECRET, {
    expiresIn: `${ttlMinutes}m`
  });
}

export function signRefreshToken(userId: string, options: { rememberMe?: boolean; tokenVersion?: number; sessionId: string }) {
  const rememberMe = options?.rememberMe ?? false;
  const ttlDays = rememberMe ? env.REFRESH_TOKEN_TTL_DAYS : env.REFRESH_TOKEN_TTL_DAYS_SHORT;
  return jwt.sign({ sub: userId, type: "refresh", sessionId: options.sessionId, tokenVersion: options?.tokenVersion ?? 0 }, env.JWT_REFRESH_SECRET, {
    expiresIn: `${ttlDays}d`
  });
}

export function verifyAccessToken(token: string) {
  const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;
  if (!payload?.sub || payload.type !== "access") {
    throw new Error("Invalid access token");
  }
  return { userId: payload.sub, tokenVersion: payload.tokenVersion ?? 0 };
}

export function verifyRefreshToken(token: string) {
  const payload = jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
  if (!payload?.sub || payload.type !== "refresh" || !payload.sessionId) {
    throw new Error("Invalid refresh token");
  }
  return { userId: payload.sub, sessionId: payload.sessionId, tokenVersion: payload.tokenVersion ?? 0 };
}

export function signSignupToken(phone: string) {
  return jwt.sign({ sub: phone, type: "signup", phone }, env.JWT_ACCESS_SECRET, {
    expiresIn: "15m"
  });
}

export function verifySignupToken(token: string) {
  const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;
  if (!payload?.sub || payload.type !== "signup" || !payload.phone) {
    throw new Error("Invalid signup token");
  }
  return payload.phone;
}

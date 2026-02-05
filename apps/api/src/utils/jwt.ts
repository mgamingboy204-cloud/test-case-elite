import jwt, { JwtPayload } from "jsonwebtoken";
import { env } from "../config/env";

type TokenPayload = JwtPayload & {
  sub: string;
  type: "access" | "refresh";
  rememberMe?: boolean;
};

export function signAccessToken(userId: string, options?: { rememberMe?: boolean }) {
  const ttlMinutes = options?.rememberMe ? env.ACCESS_TOKEN_TTL_MINUTES : env.ACCESS_TOKEN_TTL_MINUTES_SHORT;
  return jwt.sign({ sub: userId, type: "access" }, env.JWT_ACCESS_SECRET, {
    expiresIn: `${ttlMinutes}m`
  });
}

export function signRefreshToken(userId: string, options?: { rememberMe?: boolean }) {
  const rememberMe = options?.rememberMe ?? false;
  const ttlDays = rememberMe ? env.REFRESH_TOKEN_TTL_DAYS : env.REFRESH_TOKEN_TTL_DAYS_SHORT;
  return jwt.sign({ sub: userId, type: "refresh", rememberMe }, env.JWT_REFRESH_SECRET, {
    expiresIn: `${ttlDays}d`
  });
}

export function verifyAccessToken(token: string) {
  const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;
  if (!payload?.sub || payload.type !== "access") {
    throw new Error("Invalid access token");
  }
  return payload.sub;
}

export function verifyRefreshToken(token: string) {
  const payload = jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
  if (!payload?.sub || payload.type !== "refresh") {
    throw new Error("Invalid refresh token");
  }
  return { userId: payload.sub, rememberMe: payload.rememberMe ?? false };
}

import jwt, { JwtPayload } from "jsonwebtoken";
import { env } from "../config/env";

type TokenPayload = JwtPayload & {
  sub: string;
  type: "access" | "refresh";
};

export function signAccessToken(userId: string) {
  return jwt.sign({ sub: userId, type: "access" }, env.JWT_ACCESS_SECRET, {
    expiresIn: `${env.ACCESS_TOKEN_TTL_MINUTES}m`
  });
}

export function signRefreshToken(userId: string) {
  return jwt.sign({ sub: userId, type: "refresh" }, env.JWT_REFRESH_SECRET, {
    expiresIn: `${env.REFRESH_TOKEN_TTL_DAYS}d`
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
  return payload.sub;
}

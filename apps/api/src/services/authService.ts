import bcrypt from "bcrypt";
import crypto from "crypto";
import { prisma } from "../db/prisma";
import { deviceCookieOptions } from "../config/auth";
import { env } from "../config/env";
import { HttpError } from "../utils/httpErrors";
import { logger } from "../utils/logger";
import { resolveBackendOnboardingStep } from "@elite/shared";
import { sendTwilioOtp, verifyTwilioOtp } from "./twilioVerifyService";

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function resolveOnboardingStep(user: {
  onboardingStep?: string;
  videoVerificationStatus?: string;
  paymentStatus?: string;
  profileCompletedAt?: Date | null;
  subscriptionEndsAt?: Date | null;
  photoCount?: number;
}) {
  return resolveBackendOnboardingStep(user);
}

async function resolveUserOnboardingStep(user: {
  id: string;
  onboardingStep?: string;
  videoVerificationStatus?: string;
  paymentStatus?: string;
  profileCompletedAt?: Date | null;
  subscriptionEndsAt?: Date | null;
}) {
  const photoCount = await prisma.photo.count({ where: { userId: user.id } });
  return resolveOnboardingStep({ ...user, photoCount });
}

export async function issueOnboardingToken(userId: string) {
  const onboardingToken = crypto.randomBytes(24).toString("hex");
  const onboardingTokenExpiresAt = new Date(Date.now() + 1000 * 60 * 60 * 2);
  await prisma.user.update({
    where: { id: userId },
    data: { onboardingToken, onboardingTokenExpiresAt }
  });
  return { onboardingToken, onboardingTokenExpiresAt };
}

export async function upsertOtpCode(phone: string) {
  const marker = crypto.randomBytes(16).toString("hex");
  const codeHash = await bcrypt.hash(marker, 10);
  const expiresAt = new Date(Date.now() + 1000 * 60 * 5);

  await prisma.otpCode.upsert({
    where: { phone },
    update: { codeHash, expiresAt, attempts: 0 },
    create: { phone, codeHash, expiresAt, attempts: 0 }
  });

  await sendTwilioOtp(phone);
  if (env.DEV_OTP_LOG === "true") logger.info(`[OTP SENT] ${phone}`);
}

export async function verifyOtpAndGetUser(phone: string, code: string) {
  const record = await prisma.otpCode.findUnique({ where: { phone } });
  if (!record) {
    throw new HttpError(401, { message: "OTP not found. Please request a new code." });
  }
  if (record.expiresAt < new Date()) {
    throw new HttpError(401, { message: "OTP expired. Please request a new code." });
  }
  if (record.attempts >= 5) {
    throw new HttpError(401, { message: "Too many attempts. Request a new OTP." });
  }
  try {
    await verifyTwilioOtp(phone, code);
  } catch (error) {
    if (error instanceof HttpError && error.status >= 500) {
      throw error;
    }
    await prisma.otpCode.update({
      where: { phone },
      data: { attempts: record.attempts + 1 }
    });
    throw new HttpError(401, { message: "Invalid OTP. Please try again." });
  }

  await prisma.otpCode.delete({ where: { phone } });

  const pending = await prisma.pendingUser.findUnique({ where: { phone } });
  let user = await prisma.user.findUnique({ where: { phone } });

  if (!user && pending) {
    user = await prisma.user.create({
      data: {
        phone: pending.phone,
        email: pending.email ?? null,
        passwordHash: pending.passwordHash,
        phoneVerifiedAt: new Date(),
        verifiedAt: new Date(),
        onboardingStep: "PHONE_VERIFIED",
        videoVerificationStatus: "NOT_REQUESTED",
        paymentStatus: "NOT_STARTED"
      }
    });
    await prisma.pendingUser.delete({ where: { phone } });
  } else if (user) {
    if (pending) {
      await prisma.pendingUser.delete({ where: { phone } });
    }
    const onboardingStep = await resolveUserOnboardingStep(user);
    if (!user.phoneVerifiedAt || user.onboardingStep !== onboardingStep) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          phoneVerifiedAt: user.phoneVerifiedAt ?? new Date(),
          verifiedAt: user.verifiedAt ?? new Date(),
          onboardingStep
        }
      });
    }
  } else {
    throw new HttpError(401, { message: "No account found for this phone. Please sign up first." });
  }

  return user;
}

export async function verifyOtpBypassAndGetUser(phone: string) {
  const pending = await prisma.pendingUser.findUnique({ where: { phone } });
  let user = await prisma.user.findUnique({ where: { phone } });

  if (!user && pending) {
    user = await prisma.user.create({
      data: {
        phone: pending.phone,
        email: pending.email ?? null,
        passwordHash: pending.passwordHash,
        phoneVerifiedAt: new Date(),
        verifiedAt: new Date(),
        onboardingStep: "PHONE_VERIFIED",
        videoVerificationStatus: "NOT_REQUESTED",
        paymentStatus: "NOT_STARTED"
      }
    });
    await prisma.pendingUser.delete({ where: { phone } });
  } else if (user) {
    const onboardingStep = await resolveUserOnboardingStep(user);
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        phoneVerifiedAt: user.phoneVerifiedAt ?? new Date(),
        verifiedAt: user.verifiedAt ?? new Date(),
        onboardingStep
      }
    });
  } else {
    throw new HttpError(401, { message: "No account found for this phone. Please sign up first." });
  }

  return user;
}

export async function createDeviceToken(userId: string) {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + deviceCookieOptions.maxAge);

  await prisma.deviceToken.create({
    data: { userId, tokenHash, expiresAt }
  });

  return { token, expiresAt };
}

export async function verifyDeviceToken(userId: string, token: string) {
  const tokenHash = hashToken(token);
  const tokenRecord = await prisma.deviceToken.findUnique({ where: { tokenHash } });
  if (!tokenRecord) return false;
  if (tokenRecord.expiresAt <= new Date()) {
    await prisma.deviceToken.delete({ where: { tokenHash } });
    return false;
  }
  if (tokenRecord.userId !== userId) return false;
  await prisma.deviceToken.update({
    where: { tokenHash },
    data: { lastUsedAt: new Date() }
  });
  return true;
}

export async function registerPendingUser(options: { phone: string; email?: string | null; password: string }) {
  const existing = await prisma.user.findUnique({ where: { phone: options.phone } });
  if (existing) {
    throw new HttpError(400, { message: "Phone already registered" });
  }
  const passwordHash = await bcrypt.hash(options.password, 10);
  await prisma.pendingUser.upsert({
    where: { phone: options.phone },
    update: {
      email: options.email ?? null,
      passwordHash,
      createdAt: new Date()
    },
    create: {
      phone: options.phone,
      email: options.email ?? null,
      passwordHash
    }
  });

  await upsertOtpCode(options.phone);
}

export async function requestOtp(phone: string) {
  const [pending, existing] = await Promise.all([
    prisma.pendingUser.findUnique({ where: { phone } }),
    prisma.user.findUnique({ where: { phone } })
  ]);
  if (!pending && !existing) {
    throw new HttpError(404, { message: "No signup in progress for this phone." });
  }
  await upsertOtpCode(phone);
}

export async function requestSignupOtp(phone: string) {
  const existing = await prisma.user.findUnique({ where: { phone } });
  if (existing) {
    throw new HttpError(400, { message: "Phone already registered" });
  }
  await upsertOtpCode(phone);
}

export async function verifyOtpCodeOnly(phone: string, code: string) {
  const record = await prisma.otpCode.findUnique({ where: { phone } });
  if (!record) {
    throw new HttpError(401, { message: "OTP not found. Please request a new code." });
  }
  if (record.expiresAt < new Date()) {
    throw new HttpError(401, { message: "OTP expired. Please request a new code." });
  }
  if (record.attempts >= 5) {
    throw new HttpError(401, { message: "Too many attempts. Request a new OTP." });
  }

  try {
    await verifyTwilioOtp(phone, code);
  } catch (error) {
    if (error instanceof HttpError && error.status >= 500) {
      throw error;
    }
    await prisma.otpCode.update({
      where: { phone },
      data: { attempts: record.attempts + 1 }
    });
    throw new HttpError(401, { message: "Invalid OTP. Please try again." });
  }

  await prisma.otpCode.delete({ where: { phone } });
}

export async function completeSignupWithPassword(options: { phone: string; password: string }) {
  const existing = await prisma.user.findUnique({ where: { phone: options.phone } });
  if (existing) {
    throw new HttpError(400, { message: "Phone already registered" });
  }
  const passwordHash = await bcrypt.hash(options.password, 10);
  const user = await prisma.user.create({
    data: {
      phone: options.phone,
      passwordHash,
      phoneVerifiedAt: new Date(),
      verifiedAt: new Date(),
      onboardingStep: "PHONE_VERIFIED",
      videoVerificationStatus: "NOT_REQUESTED",
      paymentStatus: "NOT_STARTED"
    }
  });
  await prisma.pendingUser.deleteMany({ where: { phone: options.phone } });
  return user;
}

export async function validateLogin(options: {
  phone: string;
  password: string;
}) {
  const user = await prisma.user.findUnique({ where: { phone: options.phone } });
  if (!user) {
    throw new HttpError(401, { message: "Invalid credentials" });
  }
  if (user.deletedAt) {
    throw new HttpError(403, { message: "Account deleted" });
  }
  if (user.deactivatedAt) {
    throw new HttpError(403, { message: "Account deactivated" });
  }
  if (user.status === "BANNED") {
    throw new HttpError(403, { message: "Account banned" });
  }

  const valid = await bcrypt.compare(options.password, user.passwordHash);
  if (!valid) {
    throw new HttpError(401, { message: "Invalid credentials" });
  }

  const onboardingStep = await resolveUserOnboardingStep(user);
  if (user.onboardingStep !== onboardingStep) {
    await prisma.user.update({ where: { id: user.id }, data: { onboardingStep } });
  }

  return { user, onboardingStep, otpRequired: !user.phoneVerifiedAt };
}

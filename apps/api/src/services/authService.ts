import bcrypt from "bcrypt";
import crypto from "crypto";
import { prisma } from "../db/prisma";
import { deviceCookieOptions } from "../config/auth";
import { env } from "../config/env";
import { HttpError } from "../utils/httpErrors";
import { logger } from "../utils/logger";

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function resolveOnboardingStep(user: {
  onboardingStep?: string;
  videoVerificationStatus?: string;
  paymentStatus?: string;
  profileCompletedAt?: Date | null;
}) {
  if (user.onboardingStep === "ACTIVE") return "ACTIVE";
  if (user.profileCompletedAt) return "ACTIVE";
  if (user.paymentStatus === "PAID") return "PROFILE_PENDING";
  if (user.paymentStatus === "PENDING") return "PAYMENT_PENDING";
  if (user.videoVerificationStatus === "APPROVED") return "VIDEO_VERIFIED";
  if (user.videoVerificationStatus === "IN_PROGRESS" || user.videoVerificationStatus === "PENDING") {
    return "VIDEO_VERIFICATION_PENDING";
  }
  return "PHONE_VERIFIED";
}

export async function upsertOtpCode(phone: string) {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const codeHash = await bcrypt.hash(otp, 10);
  const expiresAt = new Date(Date.now() + 1000 * 60 * 5);

  await prisma.otpCode.upsert({
    where: { phone },
    update: { codeHash, expiresAt, attempts: 0 },
    create: { phone, codeHash, expiresAt, attempts: 0 }
  });

  if (env.DEV_OTP_LOG === "true") {
    logger.info(`[DEV OTP] ${phone}: ${otp}`);
  }
}

export async function verifyOtpAndGetUser(phone: string, code: string) {
  const record = await prisma.otpCode.findUnique({ where: { phone } });
  if (!record) {
    throw new HttpError(401, { error: "OTP not found. Please request a new code." });
  }
  if (record.expiresAt < new Date()) {
    throw new HttpError(401, { error: "OTP expired. Please request a new code." });
  }
  if (record.attempts >= 5) {
    throw new HttpError(401, { error: "Too many attempts. Request a new OTP." });
  }
  if (!record.codeHash) {
    throw new HttpError(401, { error: "Invalid OTP. Please request a new code." });
  }

  const valid = await bcrypt.compare(code, record.codeHash);
  if (!valid) {
    await prisma.otpCode.update({
      where: { phone },
      data: { attempts: record.attempts + 1 }
    });
    throw new HttpError(401, { error: "Invalid OTP. Please try again." });
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
    const onboardingStep = resolveOnboardingStep(user);
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
    throw new HttpError(401, { error: "No account found for this phone. Please sign up first." });
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
    throw new HttpError(400, { error: "Phone already registered" });
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
    throw new HttpError(404, { error: "No signup in progress for this phone." });
  }
  await upsertOtpCode(phone);
}

export async function validateLogin(options: {
  phone: string;
  password: string;
}) {
  const user = await prisma.user.findUnique({ where: { phone: options.phone } });
  if (!user) {
    throw new HttpError(401, { error: "Invalid credentials" });
  }
  if (user.deletedAt) {
    throw new HttpError(403, { error: "Account deleted" });
  }
  if (user.deactivatedAt) {
    throw new HttpError(403, { error: "Account deactivated" });
  }
  if (user.status === "BANNED") {
    throw new HttpError(403, { error: "Account banned" });
  }

  const valid = await bcrypt.compare(options.password, user.passwordHash);
  if (!valid) {
    throw new HttpError(401, { error: "Invalid credentials" });
  }

  if (!user.phoneVerifiedAt) {
    throw new HttpError(403, { error: "Phone not verified. Please verify your phone to continue." });
  }

  const onboardingStep = resolveOnboardingStep(user);
  if (user.onboardingStep !== onboardingStep) {
    await prisma.user.update({ where: { id: user.id }, data: { onboardingStep } });
  }

  return { user, onboardingStep };
}

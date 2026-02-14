import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import bcrypt from "bcrypt";
import {
  AuthOtpSendResponseSchema,
  AuthRefreshResponseSchema,
  AuthSuccessSchema,
  ProfileReadResponseSchema,
  ProfileUpdateResponseSchema,
  VerificationStatusSchema
} from "@elite/contracts";
import { app } from "../src/app";
import { prisma } from "../src/db/prisma";

async function resetDb() {
  await prisma.notification.deleteMany();
  await prisma.verificationSlot.deleteMany();
  await prisma.verificationRequest.deleteMany();
  await prisma.deviceToken.deleteMany();
  await prisma.consent.deleteMany();
  await prisma.phoneExchangeEvent.deleteMany();
  await prisma.match.deleteMany();
  await prisma.like.deleteMany();
  await prisma.refundRequest.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.photo.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.pendingUser.deleteMany();
  await prisma.user.deleteMany();
  await prisma.otpCode.deleteMany();
}

async function createOtp(phone: string, code = "123456") {
  const codeHash = await bcrypt.hash(code, 10);
  await prisma.otpCode.upsert({
    where: { phone },
    update: { codeHash, expiresAt: new Date(Date.now() + 1000 * 60 * 5), attempts: 0 },
    create: { phone, codeHash, expiresAt: new Date(Date.now() + 1000 * 60 * 5), attempts: 0 }
  });
}

beforeEach(async () => {
  await resetDb();
});

describe("contract smoke", () => {
  it("validates auth/profile/verification contracts", async () => {
    const agent = request.agent(app);
    const phone = "5559990000";

    const send = await agent.post("/auth/otp/send").send({ phone });
    expect(send.status).toBe(200);
    AuthOtpSendResponseSchema.parse(send.body);

    await agent.post("/auth/register").send({ phone, password: "Password@1", email: "a@b.com" });
    await createOtp(phone);

    const verify = await agent.post("/auth/otp/verify").send({ phone, code: "123456" });
    expect(verify.status).toBe(200);
    const verified = AuthSuccessSchema.parse(verify.body);
    const token = verified.accessToken;

    const refresh = await agent.post("/auth/token/refresh").send({});
    expect(refresh.status).toBe(200);
    AuthRefreshResponseSchema.parse(refresh.body);

    await prisma.user.update({ where: { id: verified.user.id }, data: { paymentStatus: "PAID" } });

    const profilePut = await agent
      .put("/profile")
      .set("Authorization", `Bearer ${token}`)
      .send({ displayName: "Test User", age: 25, gender: "MALE", genderPreference: "ALL", city: "Austin", profession: "Engineer", bioShort: "Hi", preferences: {} });
    expect(profilePut.status).toBe(200);
    ProfileUpdateResponseSchema.parse(profilePut.body);

    const profileGet = await agent.get("/profile").set("Authorization", `Bearer ${token}`);
    expect(profileGet.status).toBe(200);
    ProfileReadResponseSchema.parse(profileGet.body);

    const verification = await agent.get("/me/verification-status").set("Authorization", `Bearer ${token}`);
    expect(verification.status).toBe(200);
    VerificationStatusSchema.parse(verification.body);
  });
});

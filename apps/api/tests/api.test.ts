import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import bcrypt from "bcrypt";
import { app } from "../src/app";
import { prisma } from "../src/db/prisma";

// Auth is cookie-based (httpOnly JWT cookies). The supertest agent carries cookies automatically.
const withAuth = (req: request.Test, _token: string) => req;

async function resetDb() {
  await prisma.notification.deleteMany();
  await prisma.verificationSlot.deleteMany();
  await prisma.verificationRequest.deleteMany();
  await prisma.deviceToken.deleteMany();
  await prisma.consent.deleteMany();
  await prisma.phoneExchangeCase.deleteMany();
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
    update: {
      codeHash,
      expiresAt: new Date(Date.now() + 1000 * 60 * 5),
      attempts: 0
    },
    create: {
      phone,
      codeHash,
      expiresAt: new Date(Date.now() + 1000 * 60 * 5),
      attempts: 0
    }
  });
}

async function registerAndLogin(agent: request.SuperAgentTest, phone: string, password: string) {
  await agent.post("/auth/register").send({ phone, password, email: `${phone}@example.com` });
  await createOtp(phone);
  await agent.post("/auth/otp/verify").send({ phone, code: "123456" });
  return "";
}

async function registerAndLoginSession(agent: request.SuperAgentTest, phone: string, password: string) {
  await agent.post("/auth/register").send({ phone, password, email: `${phone}@example.com` });
  await createOtp(phone);
  return {
    accessToken: "",
    onboardingToken: ""
  };
}

beforeEach(async () => {
  await resetDb();
});

describe("Health and notifications", () => {
  it("returns ok from health check", async () => {
    const response = await request(app).get("/health");
    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
  });

  it("returns notifications for the current user", async () => {
    const agent = request.agent(app);
    const phone = "5551002000";
    const token = await registerAndLogin(agent, phone, "Password@1");
    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) throw new Error("User missing");

    const actor = await prisma.user.create({
      data: {
        phone: "5551002001",
        email: "actor@example.com",
        passwordHash: await bcrypt.hash("Password@1", 10),
        status: "APPROVED",
        verifiedAt: new Date()
      }
    });

    await prisma.notification.create({
      data: {
        userId: user.id,
        actorUserId: actor.id,
        type: "NEW_LIKE"
      }
    });

    const response = await withAuth(agent.get("/notifications"), token);
    expect(response.status).toBe(200);
    expect(response.body.notifications).toHaveLength(1);
  });
});

describe("Auth routes", () => {
  it("registers a pending user and requests OTP", async () => {
    const response = await request(app)
      .post("/auth/register")
      .send({ phone: "5551010101", password: "Password@1", email: "user@example.com" });
    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(response.body.otpRequired).toBe(true);
  });

  it("sets a secure refresh cookie on login", async () => {
    const phone = "5551010102";
    await prisma.user.create({
      data: {
        phone,
        email: "login@example.com",
        passwordHash: await bcrypt.hash("Password@1", 10),
        status: "APPROVED",
        verifiedAt: new Date(),
        phoneVerifiedAt: new Date()
      }
    });

    const response = await request(app).post("/auth/login").send({ phone, password: "Password@1" });
    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);

    const cookies = response.headers["set-cookie"] as string[] | undefined;
    const refreshCookie = cookies?.find((cookie) => cookie.startsWith("em_refresh="));
    expect(refreshCookie).toBeTruthy();
    expect(refreshCookie).toContain("HttpOnly");
    expect(refreshCookie).toContain("Secure");
    expect(refreshCookie).toContain("SameSite=Lax");
    expect(refreshCookie).toContain("Path=/");
  });


  it("exposes cookie diagnostics in development", async () => {
    const phone = "5551010104";
    await prisma.user.create({
      data: {
        phone,
        email: "debug-cookie@example.com",
        passwordHash: await bcrypt.hash("Password@1", 10),
        status: "APPROVED",
        verifiedAt: new Date(),
        phoneVerifiedAt: new Date()
      }
    });

    const agent = request.agent(app);
    await agent.post("/auth/login").send({ phone, password: "Password@1" });

    const diagnostics = await agent.get("/debug/cookies");
    expect(diagnostics.status).toBe(200);
    expect(diagnostics.body.ok).toBe(true);
    expect(diagnostics.body.includesRefreshCookie).toBe(true);
    expect(diagnostics.body.cookieNames).toContain("em_refresh");
  });

  it("uses long refresh cookie ttl when remember device is selected", async () => {
    const phone = "5551010103";
    await prisma.user.create({
      data: {
        phone,
        email: "remember@example.com",
        passwordHash: await bcrypt.hash("Password@1", 10),
        status: "APPROVED",
        verifiedAt: new Date(),
        phoneVerifiedAt: new Date()
      }
    });

    const shortSessionLogin = await request(app).post("/auth/login").send({ phone, password: "Password@1" });
    const rememberedLogin = await request(app)
      .post("/auth/login")
      .send({ phone, password: "Password@1", rememberDevice30Days: true });

    const shortCookie = (shortSessionLogin.headers["set-cookie"] as string[] | undefined)?.find((cookie) =>
      cookie.startsWith("em_refresh=")
    );
    const longCookie = (rememberedLogin.headers["set-cookie"] as string[] | undefined)?.find((cookie) =>
      cookie.startsWith("em_refresh=")
    );

    expect(shortCookie).toContain("Max-Age=604800");
    expect(longCookie).toContain("Max-Age=2592000");
  });
});

describe("Discover routes", () => {
  it("exposes discover feed on both legacy and new paths", async () => {
    const discoverResponse = await request(app).get("/discover");
    const feedResponse = await request(app).get("/discover/feed");

    expect(discoverResponse.status).toBe(401);
    expect(feedResponse.status).toBe(401);
  });
});

describe("Refund eligibility logic", () => {
  it("marks refund ineligible before 90 days and eligible after shift", async () => {
    const agent = request.agent(app);
    const phone = "5551112222";
    const token = await registerAndLogin(agent, phone, "Password@1");
    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) throw new Error("User not found");

    await prisma.user.update({
      where: { id: user.id },
      data: {
        status: "APPROVED",
        verifiedAt: new Date(),
        phoneVerifiedAt: new Date(),
        onboardingStep: "ACTIVE",
        paymentStatus: "PAID",
        profileCompletedAt: new Date()
      }
    });
    await prisma.photo.create({ data: { userId: user.id, url: "/uploads/test.jpg" } });

    const other = await prisma.user.create({
      data: {
        phone: "5559990000",
        email: "other@example.com",
        passwordHash: await bcrypt.hash("Password@2", 10),
        status: "APPROVED",
        verifiedAt: new Date()
      }
    });

    await prisma.payment.create({
      data: {
        userId: user.id,
        plan: "TWELVE_MONTHS",
        amount: 100000,
        status: "PAID",
        paidAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10)
      }
    });

    await prisma.like.createMany({
      data: Array.from({ length: 5 }).map(() => ({
        fromUserId: user.id,
        toUserId: other.id,
        type: "LIKE"
      }))
    });

    const before = await withAuth(agent.post("/refunds/request"), token).send({});
    expect(before.body.eligibility.eligible).toBe(false);

    const adminPhone = "5551113333";
    await prisma.user.create({
      data: {
        phone: adminPhone,
        email: "refund-admin@example.com",
        passwordHash: await bcrypt.hash("Admin@12345", 10),
        role: "ADMIN",
        isAdmin: true,
        status: "APPROVED",
        verifiedAt: new Date(),
        phoneVerifiedAt: new Date()
      }
    });
    const adminAgent = request.agent(app);
    await adminAgent.post("/auth/login").send({ phone: adminPhone, password: "Admin@12345" });
    await adminAgent.post("/admin/dev/shift-payment-date").send({ userId: user.id, daysBack: 91 });

    const after = await withAuth(agent.post("/refunds/request"), token).send({});
    expect(after.body.eligibility.eligible).toBe(true);
  });
});

describe("Phone unlock authorization", () => {
  it("blocks unlock without phone exchange and allows after consents", async () => {
    const agentA = request.agent(app);
    const agentB = request.agent(app);
    const phoneA = "5550001111";
    const phoneB = "5550002222";

    const tokenA = await registerAndLogin(agentA, phoneA, "Password@1");
    const tokenB = await registerAndLogin(agentB, phoneB, "Password@1");

    const userA = await prisma.user.findUnique({ where: { phone: phoneA } });
    const userB = await prisma.user.findUnique({ where: { phone: phoneB } });
    if (!userA || !userB) throw new Error("Users missing");

    await prisma.user.updateMany({
      where: { id: { in: [userA.id, userB.id] } },
      data: {
        status: "APPROVED",
        verifiedAt: new Date(),
        phoneVerifiedAt: new Date(),
        onboardingStep: "ACTIVE",
        paymentStatus: "PAID",
        profileCompletedAt: new Date()
      }
    });
    await prisma.photo.createMany({
      data: [
        { userId: userA.id, url: "/uploads/a.jpg" },
        { userId: userB.id, url: "/uploads/b.jpg" }
      ]
    });

    const ordered = [userA.id, userB.id].sort();
    const match = await prisma.match.create({ data: { userAId: ordered[0], userBId: ordered[1] } });

    const blocked = await withAuth(agentA.get(`/phone-unlock/${match.id}`), tokenA);
    expect(blocked.status).toBe(403);

    await prisma.consent.createMany({
      data: [
        { matchId: match.id, userId: userA.id, response: "YES" },
        { matchId: match.id, userId: userB.id, response: "YES" }
      ]
    });
    const withoutExchange = await withAuth(agentA.get(`/phone-unlock/${match.id}`), tokenA);
    expect(withoutExchange.status).toBe(403);

    await prisma.phoneExchangeEvent.create({ data: { matchId: match.id } });
    const allowed = await withAuth(agentA.get(`/phone-unlock/${match.id}`), tokenA);
    expect(allowed.status).toBe(200);
    expect(allowed.body.users).toHaveLength(2);
  });

  it("supports offline, online, and social consent workflows", async () => {
    const agentA = request.agent(app);
    const agentB = request.agent(app);
    const tokenA = await registerAndLogin(agentA, "5550003333", "Password@1");
    const tokenB = await registerAndLogin(agentB, "5550004444", "Password@1");

    const userA = await prisma.user.findUnique({ where: { phone: "5550003333" } });
    const userB = await prisma.user.findUnique({ where: { phone: "5550004444" } });
    if (!userA || !userB) throw new Error("Users missing");

    await prisma.user.updateMany({
      where: { id: { in: [userA.id, userB.id] } },
      data: {
        status: "APPROVED",
        verifiedAt: new Date(),
        phoneVerifiedAt: new Date(),
        onboardingStep: "ACTIVE",
        paymentStatus: "PAID",
        profileCompletedAt: new Date()
      }
    });

    const ordered = [userA.id, userB.id].sort();
    const match = await prisma.match.create({ data: { userAId: ordered[0], userBId: ordered[1] } });

    await withAuth(agentA.post("/consent/respond"), tokenA).send({
      matchId: match.id,
      type: "OFFLINE_MEET",
      response: "YES",
      payload: { venues: ["Soho House"], times: ["Sat 4PM"] }
    });
    await withAuth(agentB.post("/consent/respond"), tokenB).send({
      matchId: match.id,
      type: "OFFLINE_MEET",
      response: "YES",
      payload: { venues: ["Blue Tokai Reserve"], times: ["Sun 11AM"] }
    });

    const offline = await withAuth(agentA.get(`/offline-meet/${match.id}`), tokenA);
    expect(offline.status).toBe(200);
    expect(offline.body.type).toBe("OFFLINE_MEET");

    await withAuth(agentA.post("/consent/respond"), tokenA).send({ matchId: match.id, type: "ONLINE_MEET", response: "YES", payload: { platforms: ["Zoom"], times: ["Sat 8PM"] } });
    await withAuth(agentB.post("/consent/respond"), tokenB).send({ matchId: match.id, type: "ONLINE_MEET", response: "YES", payload: { platforms: ["G-Meet"], times: ["Sat 8PM"] } });

    const online = await withAuth(agentA.get(`/online-meet/${match.id}`), tokenA);
    expect(online.status).toBe(200);
    expect(online.body.type).toBe("ONLINE_MEET");

    const socialRequested = await withAuth(agentA.post(`/social-exchange-cases/${match.id}/request`), tokenA).send({});
    expect(socialRequested.status).toBe(200);
    const caseId = socialRequested.body.socialExchange.id as string;

    const socialAccepted = await withAuth(agentB.post(`/social-exchange-cases/${caseId}/respond`), tokenB).send({ response: "ACCEPT" });
    expect(socialAccepted.status).toBe(200);

    const handleSubmitted = await withAuth(agentA.post(`/social-exchange-cases/${caseId}/handle`), tokenA).send({
      platform: "Instagram",
      handle: "@vael_a"
    });
    expect(handleSubmitted.status).toBe(200);

    const socialReveal = await withAuth(agentB.post(`/social-exchange-cases/${caseId}/reveal`), tokenB).send({});
    expect(socialReveal.status).toBe(200);
    expect(socialReveal.body.handle).toBe("@vael_a");
  });

});

describe("Session authentication", () => {
  it("sets session on register, returns /me, and clears on logout", async () => {
    const agent = request.agent(app);
    const phone = "5551230000";
    const token = await registerAndLogin(agent, phone, "Password@1");

    const me = await withAuth(agent.get("/me"), token);
    expect(me.status).toBe(200);
    expect(me.body.phone).toBe(phone);

    const logout = await withAuth(agent.post("/auth/logout"), token);
    expect(logout.status).toBe(200);

    const after = await withAuth(agent.get("/me"), token);
    expect(after.status).toBe(200);
  });
});

describe("OTP verification", () => {
  it("returns friendly error for invalid OTP and does not crash", async () => {
    const agent = request.agent(app);
    const phone = "5557778888";
    await createOtp(phone);
    const response = await agent.post("/auth/otp/verify").send({ phone, code: "000000" });
    expect(response.status).toBe(401);
    expect(response.body.error).toMatch(/invalid otp/i);
  });

  it("creates user only after OTP verification and blocks duplicate signups", async () => {
    const agent = request.agent(app);
    const phone = "5558889999";
    await agent.post("/auth/register").send({ phone, password: "Password@1", email: "new@example.com" });
    const before = await prisma.user.findUnique({ where: { phone } });
    expect(before).toBeNull();

    await createOtp(phone);
    const verified = await agent.post("/auth/otp/verify").send({ phone, code: "123456" });
    expect(verified.status).toBe(200);

    const user = await prisma.user.findUnique({ where: { phone } });
    expect(user).not.toBeNull();

    const duplicate = await agent.post("/auth/register").send({ phone, password: "Password@1", email: "new@example.com" });
    expect(duplicate.status).toBe(400);
  });
});

describe("Login without OTP for verified phones", () => {
  it("logs in verified users without OTP prompts", async () => {
    const agent = request.agent(app);
    const phone = "5552223333";
    const password = "Password@1";

    await registerAndLogin(agent, phone, password);

    const login = await agent.post("/auth/login").send({ phone, password, rememberDevice: true });
    expect(login.body.ok).toBe(true);
    expect(login.body.otpRequired).not.toBe(true);
    const setCookie = login.headers["set-cookie"] as string[] | undefined;
    expect(setCookie?.some((c) => c.startsWith("vael_access_token="))).toBe(true);
    expect(setCookie?.some((c) => c.startsWith("em_refresh="))).toBe(true);
  });
});

describe("Incoming likes", () => {
  it("returns incoming likes without mutual responses", async () => {
    const agentA = request.agent(app);
    const agentB = request.agent(app);
    const agentC = request.agent(app);
    const tokenA = await registerAndLogin(agentA, "5553000000", "Password@1");
    const tokenB = await registerAndLogin(agentB, "5553000001", "Password@1");
    await registerAndLogin(agentC, "5553000002", "Password@1");

    const userA = await prisma.user.findUnique({ where: { phone: "5553000000" } });
    const userB = await prisma.user.findUnique({ where: { phone: "5553000001" } });
    const userC = await prisma.user.findUnique({ where: { phone: "5553000002" } });
    if (!userA || !userB || !userC) throw new Error("Users missing");

    await prisma.user.updateMany({
      where: { id: { in: [userA.id, userB.id, userC.id] } },
      data: {
        status: "APPROVED",
        verifiedAt: new Date(),
        phoneVerifiedAt: new Date(),
        onboardingStep: "ACTIVE",
        paymentStatus: "PAID",
        profileCompletedAt: new Date()
      }
    });
    await prisma.photo.createMany({
      data: [
        { userId: userA.id, url: "/uploads/a.jpg" },
        { userId: userB.id, url: "/uploads/b.jpg" },
        { userId: userC.id, url: "/uploads/c.jpg" }
      ]
    });

    await prisma.like.create({ data: { fromUserId: userB.id, toUserId: userA.id, type: "LIKE" } });
    await prisma.like.create({ data: { fromUserId: userC.id, toUserId: userA.id, type: "LIKE" } });
    await prisma.like.create({ data: { fromUserId: userA.id, toUserId: userC.id, type: "PASS" } });

    const incoming = await withAuth(agentA.get("/likes/incoming"), tokenA);
    expect(incoming.status).toBe(200);
    const incomingIds = incoming.body.incoming.map((like: any) => like.fromUserId);
    expect(incomingIds).toContain(userB.id);
    expect(incomingIds).not.toContain(userC.id);
  });
});

describe("Admin authorization", () => {
  it("blocks non-admin access to admin endpoints", async () => {
    const agent = request.agent(app);
    const token = await registerAndLogin(agent, "5551114444", "Password@1");
    const response = await withAuth(agent.get("/admin/dashboard"), token);
    expect(response.status).toBe(403);
  });
});

describe("Verification concierge flow", () => {
  it("allows admin to send a Meet link and approve a verification request", async () => {
    const adminPhone = "5559000000";
    const passwordHash = await bcrypt.hash("Admin@123", 10);
    const admin = await prisma.user.create({
      data: {
        phone: adminPhone,
        email: "admin2@example.com",
        passwordHash,
        role: "ADMIN",
        isAdmin: true,
        status: "APPROVED",
        verifiedAt: new Date(),
        phoneVerifiedAt: new Date()
      }
    });

    const userPhone = "5559001111";
    await prisma.user.create({
      data: {
        phone: userPhone,
        email: "user@example.com",
        passwordHash: await bcrypt.hash("Password@1", 10),
        status: "PENDING",
        verifiedAt: new Date(),
        phoneVerifiedAt: new Date(),
        onboardingStep: "VIDEO_VERIFICATION_PENDING",
        videoVerificationStatus: "PENDING"
      }
    });

    const agent = request.agent(app);
    await agent.post("/auth/login").send({ phone: adminPhone, password: "Admin@123" });

    const userAgent = request.agent(app);
    await userAgent.post("/auth/login").send({ phone: userPhone, password: "Password@1" });

    const createRequest = await userAgent.post("/verification-requests");
    expect(createRequest.status).toBe(200);
    const requestId = createRequest.body.request.id;

    const start = await agent
      .post(`/admin/verification-requests/${requestId}/start`)
      .send({ meetUrl: "https://meet.google.com/abc-defg-hij" });
    expect(start.status).toBe(200);

    const statusResponse = await userAgent.get("/me/verification-status");
    expect(statusResponse.status).toBe(200);
    expect(statusResponse.body.status).toBe("IN_PROGRESS");
    expect(statusResponse.body.meetUrl).toBe("https://meet.google.com/abc-defg-hij");

    const approve = await agent.post(`/admin/verification-requests/${requestId}/approve`);
    expect(approve.status).toBe(200);

    const updatedUser = await prisma.user.findUnique({ where: { phone: userPhone } });
    const updatedRequest = await prisma.verificationRequest.findUnique({ where: { id: requestId } });
    expect(updatedUser?.status).toBe("APPROVED");
    expect(updatedUser?.onboardingStep).toBe("VIDEO_VERIFIED");
    expect(updatedRequest?.status).toBe("COMPLETED");
    expect(admin.id).toBeDefined();
  });

  it("does not return expired links to the user", async () => {
    const agent = request.agent(app);
    const token = await registerAndLogin(agent, "5552223333", "Password@1");
    const user = await prisma.user.findUnique({ where: { phone: "5552223333" } });
    if (!user) throw new Error("User not found");

    const requestRecord = await prisma.verificationRequest.create({
      data: {
        userId: user.id,
        status: "IN_PROGRESS",
        verificationLink: "https://meet.google.com/expired-link",
        meetUrl: "https://meet.google.com/expired-link",
        linkExpiresAt: new Date(Date.now() - 5 * 60 * 1000)
      }
    });

    const response = await withAuth(agent.get("/me/verification-status"), token);
    expect(response.status).toBe(200);
    expect(response.body.status).toBe("REQUESTED");
    expect(response.body.meetUrl).toBeNull();
  });

  it("allows admin to reject a verification request", async () => {
    const adminPhone = "5559000001";
    const passwordHash = await bcrypt.hash("Admin@123", 10);
    await prisma.user.create({
      data: {
        phone: adminPhone,
        email: "admin3@example.com",
        passwordHash,
        role: "ADMIN",
        isAdmin: true,
        status: "APPROVED",
        verifiedAt: new Date(),
        phoneVerifiedAt: new Date()
      }
    });

    const userPhone = "5559001112";
    await prisma.user.create({
      data: {
        phone: userPhone,
        email: "user2@example.com",
        passwordHash: await bcrypt.hash("Password@1", 10),
        status: "PENDING",
        verifiedAt: new Date(),
        phoneVerifiedAt: new Date(),
        onboardingStep: "VIDEO_VERIFICATION_PENDING",
        videoVerificationStatus: "PENDING"
      }
    });

    const adminAgent = request.agent(app);
    await adminAgent.post("/auth/login").send({ phone: adminPhone, password: "Admin@123" });

    const userAgent = request.agent(app);
    await userAgent.post("/auth/login").send({ phone: userPhone, password: "Password@1" });

    const createRequest = await userAgent.post("/verification-requests");
    const requestId = createRequest.body.request.id;

    await adminAgent.post(`/admin/verification-requests/${requestId}/start`).send({ meetUrl: "https://meet.google.com/reject-link" });

    const reject = await adminAgent.post(`/admin/verification-requests/${requestId}/reject`).send({
      reason: "No-show"
    });
    expect(reject.status).toBe(200);

    const updatedUser = await prisma.user.findUnique({ where: { phone: userPhone } });
    const updatedRequest = await prisma.verificationRequest.findUnique({ where: { id: requestId } });
    expect(updatedUser?.status).toBe("REJECTED");
    expect(updatedRequest?.status).toBe("REJECTED");
  });

  it("sets meet link and approves verification via user endpoints", async () => {
    const adminPhone = "5559002222";
    await prisma.user.create({
      data: {
        phone: adminPhone,
        email: "admin4@example.com",
        passwordHash: await bcrypt.hash("Admin@123", 10),
        role: "ADMIN",
        isAdmin: true,
        status: "APPROVED",
        verifiedAt: new Date(),
        phoneVerifiedAt: new Date()
      }
    });

    const userAgent = request.agent(app);
    await registerAndLogin(userAgent, "5559002223", "Password@1");
    const user = await prisma.user.findUnique({ where: { phone: "5559002223" } });
    if (!user) throw new Error("User not found");

    const adminAgent = request.agent(app);
    await adminAgent.post("/auth/login").send({ phone: adminPhone, password: "Admin@123" });

    const meetLink = await adminAgent.post(`/admin/verifications/${user.id}/meet-link`).send({
      meetUrl: "https://meet.google.com/meet-link-123"
    });
    expect(meetLink.status).toBe(200);

    const statusResponse = await userAgent.get("/me/verification-status");
    expect(statusResponse.status).toBe(200);
    expect(statusResponse.body.status).toBe("IN_PROGRESS");
    expect(statusResponse.body.meetUrl).toBe("https://meet.google.com/meet-link-123");

    const notification = await prisma.notification.findFirst({
      where: { userId: user.id, type: "VIDEO_VERIFICATION_UPDATE" }
    });
    expect(notification).toBeTruthy();

    const approve = await adminAgent.post(`/admin/verifications/${user.id}/approve`).send({
      reason: "Verified"
    });
    expect(approve.status).toBe(200);

    const updatedUser = await prisma.user.findUnique({ where: { id: user.id } });
    const updatedRequest = await prisma.verificationRequest.findFirst({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
    expect(updatedUser?.status).toBe("APPROVED");
    expect(updatedUser?.videoVerificationStatus).toBe("APPROVED");
    expect(updatedRequest?.status).toBe("COMPLETED");
  });

  it("requires a rejection reason for admin verification rejection", async () => {
    const adminPhone = "5559003333";
    await prisma.user.create({
      data: {
        phone: adminPhone,
        email: "admin5@example.com",
        passwordHash: await bcrypt.hash("Admin@123", 10),
        role: "ADMIN",
        isAdmin: true,
        status: "APPROVED",
        verifiedAt: new Date(),
        phoneVerifiedAt: new Date()
      }
    });

    const userAgent = request.agent(app);
    await registerAndLogin(userAgent, "5559003334", "Password@1");
    const user = await prisma.user.findUnique({ where: { phone: "5559003334" } });
    if (!user) throw new Error("User not found");

    const adminAgent = request.agent(app);
    const adminLogin = await adminAgent.post("/auth/login").send({ phone: adminPhone, password: "Admin@123" });
    const adminToken = adminLogin.body.accessToken as string;

    const response = await withAuth(adminAgent.post(`/admin/verifications/${user.id}/reject`), adminToken).send({ reason: "" });
    expect(response.status).toBe(400);
  });
});

describe("Profile activation", () => {
  it("requires at least one photo before activating profile", async () => {
    const agent = request.agent(app);
    const phone = "5552221111";
    const token = await registerAndLogin(agent, phone, "Password@1");
    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) throw new Error("User not found");

    await prisma.user.update({
      where: { id: user.id },
      data: {
        onboardingStep: "PROFILE_PENDING",
        paymentStatus: "PAID"
      }
    });

    const response = await withAuth(agent.put("/profile"), token).send({
      name: "Test User",
      gender: "OTHER",
      age: 30,
      city: "City",
      profession: "Tester",
      bioShort: "Bio",
      preferences: {}
    });

    expect(response.body.requiresPhoto).toBe(true);
    const refreshed = await prisma.user.findUnique({ where: { id: user.id } });
    expect(refreshed?.onboardingStep).toBe("PROFILE_PENDING");
  });
});

describe("Likes, matches, and notifications", () => {


  it("returns 401 for likes without auth and persists likes when authenticated", async () => {
    const anonymousResponse = await request(app).post("/likes").send({
      actionId: "anon-like-1",
      targetUserId: "2e4e1ffc-6da0-4300-9ce1-1d13d4f98f1f",
      action: "LIKE"
    });
    expect(anonymousResponse.status).toBe(401);

    const agentA = request.agent(app);
    const agentB = request.agent(app);
    const tokenA = await registerAndLogin(agentA, "5554100010", "Password@1");
    await registerAndLogin(agentB, "5554100011", "Password@1");

    const userA = await prisma.user.findUnique({ where: { phone: "5554100010" } });
    const userB = await prisma.user.findUnique({ where: { phone: "5554100011" } });
    if (!userA || !userB) throw new Error("Users missing");

    await prisma.user.updateMany({
      where: { id: { in: [userA.id, userB.id] } },
      data: {
        status: "APPROVED",
        verifiedAt: new Date(),
        phoneVerifiedAt: new Date(),
        onboardingStep: "ACTIVE",
        paymentStatus: "PAID",
        profileCompletedAt: new Date()
      }
    });

    await prisma.profile.createMany({
      data: [
        {
          userId: userA.id,
          name: "User A",
          gender: "MALE",
          age: 28,
          city: "City",
          profession: "Engineer",
          bioShort: "Bio",
          preferences: {}
        },
        {
          userId: userB.id,
          name: "User B",
          gender: "FEMALE",
          age: 26,
          city: "City",
          profession: "Designer",
          bioShort: "Bio",
          preferences: {}
        }
      ]
    });

    await prisma.photo.createMany({
      data: [
        { userId: userA.id, url: "/uploads/a.jpg" },
        { userId: userB.id, url: "/uploads/b.jpg" }
      ]
    });

    const likeResponse = await withAuth(agentA.post("/likes"), tokenA).send({ actionId: "a-like-main", targetUserId: userB.id, action: "LIKE" });
    expect(likeResponse.status).toBe(200);

    const persisted = await prisma.like.findFirst({
      where: { fromUserId: userA.id, toUserId: userB.id, type: "LIKE" }
    });
    expect(persisted).toBeTruthy();
  });

  it("enforces idempotent likes and passes, creates matches, and sends notifications", async () => {
    const agentA = request.agent(app);
    const agentB = request.agent(app);
    const tokenA = await registerAndLogin(agentA, "5554100000", "Password@1");
    const tokenB = await registerAndLogin(agentB, "5554100001", "Password@1");

    const userA = await prisma.user.findUnique({ where: { phone: "5554100000" } });
    const userB = await prisma.user.findUnique({ where: { phone: "5554100001" } });
    if (!userA || !userB) throw new Error("Users missing");

    await prisma.user.updateMany({
      where: { id: { in: [userA.id, userB.id] } },
      data: {
        status: "APPROVED",
        verifiedAt: new Date(),
        phoneVerifiedAt: new Date(),
        onboardingStep: "ACTIVE",
        paymentStatus: "PAID",
        profileCompletedAt: new Date()
      }
    });
    await prisma.profile.createMany({
      data: [
        {
          userId: userA.id,
          name: "User A",
          gender: "MALE",
          age: 28,
          city: "City",
          profession: "Engineer",
          bioShort: "Bio",
          preferences: {}
        },
        {
          userId: userB.id,
          name: "User B",
          gender: "FEMALE",
          age: 26,
          city: "City",
          profession: "Designer",
          bioShort: "Bio",
          preferences: {}
        }
      ]
    });
    await prisma.photo.createMany({
      data: [
        { userId: userA.id, url: "/uploads/a.jpg" },
        { userId: userB.id, url: "/uploads/b.jpg" }
      ]
    });

    await withAuth(agentA.post("/likes"), tokenA).send({ actionId: "a-pass-1", targetUserId: userB.id, action: "PASS" });
    await withAuth(agentA.post("/likes"), tokenA).send({ actionId: "a-pass-2", targetUserId: userB.id, action: "PASS" });
    const passRows = await prisma.like.findMany({
      where: { fromUserId: userA.id, toUserId: userB.id }
    });
    expect(passRows).toHaveLength(1);
    expect(passRows[0]?.type).toBe("PASS");

    await withAuth(agentA.post("/likes"), tokenA).send({ actionId: "a-like-1", targetUserId: userB.id, action: "LIKE" });
    await withAuth(agentA.post("/likes"), tokenA).send({ actionId: "a-like-2", targetUserId: userB.id, action: "LIKE" });
    const likeRows = await prisma.like.findMany({
      where: { fromUserId: userA.id, toUserId: userB.id }
    });
    expect(likeRows).toHaveLength(1);
    expect(likeRows[0]?.type).toBe("LIKE");

    const likeNotifications = await prisma.notification.findMany({
      where: { userId: userB.id, type: "NEW_LIKE" }
    });
    expect(likeNotifications).toHaveLength(1);

    await withAuth(agentB.post("/likes"), tokenB).send({ actionId: "b-like-1", targetUserId: userA.id, action: "LIKE" });
    await withAuth(agentB.post("/likes"), tokenB).send({ actionId: "b-like-2", targetUserId: userA.id, action: "LIKE" });
    const matches = await prisma.match.findMany({
      where: {
        OR: [
          { userAId: userA.id, userBId: userB.id },
          { userAId: userB.id, userBId: userA.id }
        ]
      }
    });
    expect(matches).toHaveLength(1);

    const matchNotifications = await prisma.notification.findMany({
      where: { type: "NEW_MATCH", matchId: matches[0]?.id }
    });
    expect(matchNotifications).toHaveLength(2);
  });

  it("supports unmatch by deactivating active match state", async () => {
    const agentA = request.agent(app);
    const agentB = request.agent(app);
    const tokenA = await registerAndLogin(agentA, "5554100010", "Password@1");
    const tokenB = await registerAndLogin(agentB, "5554100011", "Password@1");

    const userA = await prisma.user.findUnique({ where: { phone: "5554100010" } });
    const userB = await prisma.user.findUnique({ where: { phone: "5554100011" } });
    if (!userA || !userB) throw new Error("Users missing");

    await prisma.user.updateMany({
      where: { id: { in: [userA.id, userB.id] } },
      data: {
        status: "APPROVED",
        verifiedAt: new Date(),
        phoneVerifiedAt: new Date(),
        onboardingStep: "ACTIVE",
        videoVerificationStatus: "APPROVED",
        paymentStatus: "PAID",
        profileCompletedAt: new Date()
      }
    });

    await prisma.profile.createMany({
      data: [
        { userId: userA.id, name: "User A", gender: "MALE", age: 28, city: "City", profession: "Engineer", bioShort: "Bio", preferences: {} },
        { userId: userB.id, name: "User B", gender: "FEMALE", age: 26, city: "City", profession: "Designer", bioShort: "Bio", preferences: {} }
      ]
    });
    await prisma.photo.createMany({ data: [{ userId: userA.id, url: "/uploads/a.jpg" }, { userId: userB.id, url: "/uploads/b.jpg" }] });

    await withAuth(agentA.post("/likes"), tokenA).send({ actionId: "u-a-like", targetUserId: userB.id, action: "LIKE" });
    const likeBack = await withAuth(agentB.post("/likes"), tokenB).send({ actionId: "u-b-like", targetUserId: userA.id, action: "LIKE" });
    expect(likeBack.status).toBe(200);
    expect(likeBack.body.matchId).toBeTypeOf("string");

    const beforeUnmatch = await withAuth(agentA.get("/matches"), tokenA);
    expect(beforeUnmatch.body.matches).toHaveLength(1);

    const unmatchResponse = await withAuth(agentA.delete(`/matches/${likeBack.body.matchId}`), tokenA);
    expect(unmatchResponse.status).toBe(200);
    expect(unmatchResponse.body.ok).toBe(true);

    const afterUnmatchA = await withAuth(agentA.get("/matches"), tokenA);
    const afterUnmatchB = await withAuth(agentB.get("/matches"), tokenB);
    expect(afterUnmatchA.body.matches).toHaveLength(0);
    expect(afterUnmatchB.body.matches).toHaveLength(0);

    const storedMatch = await prisma.match.findUnique({ where: { id: likeBack.body.matchId } });
    expect(storedMatch?.unmatchedAt).toBeTruthy();

    const secondUnmatch = await withAuth(agentA.delete(`/matches/${likeBack.body.matchId}`), tokenA);
    expect(secondUnmatch.status).toBe(200);
    expect(secondUnmatch.body.alreadyUnmatched).toBe(true);
  });
});

describe("Discover feed filtering", () => {
  it("excludes passes and matches while respecting gender filters", async () => {
    const agent = request.agent(app);
    const token = await registerAndLogin(agent, "5554200000", "Password@1");
    const currentUser = await prisma.user.findUnique({ where: { phone: "5554200000" } });
    if (!currentUser) throw new Error("User missing");

    const users = await prisma.user.createMany({
      data: [
        {
          phone: "5554200001",
          email: "female1@example.com",
          passwordHash: await bcrypt.hash("Password@1", 10),
          status: "APPROVED",
          verifiedAt: new Date(),
          phoneVerifiedAt: new Date(),
          onboardingStep: "ACTIVE",
          paymentStatus: "PAID",
          profileCompletedAt: new Date()
        },
        {
          phone: "5554200002",
          email: "male1@example.com",
          passwordHash: await bcrypt.hash("Password@1", 10),
          status: "APPROVED",
          verifiedAt: new Date(),
          phoneVerifiedAt: new Date(),
          onboardingStep: "ACTIVE",
          paymentStatus: "PAID",
          profileCompletedAt: new Date()
        },
        {
          phone: "5554200003",
          email: "female2@example.com",
          passwordHash: await bcrypt.hash("Password@1", 10),
          status: "APPROVED",
          verifiedAt: new Date(),
          phoneVerifiedAt: new Date(),
          onboardingStep: "ACTIVE",
          paymentStatus: "PAID",
          profileCompletedAt: new Date()
        },
        {
          phone: "5554200004",
          email: "female3@example.com",
          passwordHash: await bcrypt.hash("Password@1", 10),
          status: "APPROVED",
          verifiedAt: new Date(),
          phoneVerifiedAt: new Date(),
          onboardingStep: "ACTIVE",
          paymentStatus: "PAID",
          profileCompletedAt: new Date()
        }
      ]
    });
    expect(users.count).toBe(4);

    const [femaleRecent, maleFriend, femaleMatched, femaleOldPass] = await prisma.user.findMany({
      where: { phone: { in: ["5554200001", "5554200002", "5554200003", "5554200004"] } }
    });
    if (!femaleRecent || !maleFriend || !femaleMatched || !femaleOldPass) {
      throw new Error("Seed users missing");
    }

    await prisma.user.update({
      where: { id: currentUser.id },
      data: {
        status: "APPROVED",
        verifiedAt: new Date(),
        phoneVerifiedAt: new Date(),
        onboardingStep: "ACTIVE",
        paymentStatus: "PAID",
        profileCompletedAt: new Date()
      }
    });

    await prisma.profile.createMany({
      data: [
        {
          userId: currentUser.id,
          name: "Current",
          gender: "MALE",
          age: 30,
          city: "City",
          profession: "Engineer",
          bioShort: "Bio",
          preferences: {}
        },
        {
          userId: femaleRecent.id,
          name: "Female Recent",
          gender: "FEMALE",
          age: 27,
          city: "City",
          profession: "Designer",
          bioShort: "Bio",
          preferences: {}
        },
        {
          userId: maleFriend.id,
          name: "Male Friend",
          gender: "MALE",
          age: 29,
          city: "City",
          profession: "Artist",
          bioShort: "Bio",
          preferences: {}
        },
        {
          userId: femaleMatched.id,
          name: "Female Matched",
          gender: "FEMALE",
          age: 26,
          city: "City",
          profession: "Writer",
          bioShort: "Bio",
          preferences: {}
        },
        {
          userId: femaleOldPass.id,
          name: "Female Old Pass",
          gender: "FEMALE",
          age: 31,
          city: "City",
          profession: "Analyst",
          bioShort: "Bio",
          preferences: {}
        }
      ]
    });
    await prisma.photo.createMany({
      data: [
        { userId: currentUser.id, url: "/uploads/current.jpg" },
        { userId: femaleRecent.id, url: "/uploads/f1.jpg" },
        { userId: maleFriend.id, url: "/uploads/m1.jpg" },
        { userId: femaleMatched.id, url: "/uploads/f2.jpg" },
        { userId: femaleOldPass.id, url: "/uploads/f3.jpg" }
      ]
    });

    await prisma.like.create({
      data: {
        fromUserId: currentUser.id,
        toUserId: femaleRecent.id,
        type: "PASS",
        createdAt: new Date()
      }
    });
    await prisma.like.create({
      data: {
        fromUserId: currentUser.id,
        toUserId: femaleOldPass.id,
        type: "PASS",
        createdAt: new Date(Date.now() - 26 * 60 * 60 * 1000)
      }
    });

    const ordered = [currentUser.id, femaleMatched.id].sort();
    await prisma.match.create({ data: { userAId: ordered[0], userBId: ordered[1] } });

    const defaultFeed = await withAuth(agent.get("/profiles"), token);
    expect(defaultFeed.status).toBe(200);
    const defaultIds = defaultFeed.body.profiles.map((profile: any) => profile.userId);
    expect(defaultIds).not.toContain(femaleRecent.id);
    expect(defaultIds).not.toContain(femaleOldPass.id);
    expect(defaultIds).not.toContain(femaleMatched.id);
    expect(defaultIds).toHaveLength(0);

    const friendsFeed = await withAuth(agent.get("/profiles?mode=friends"), token);
    expect(friendsFeed.status).toBe(200);
    const friendIds = friendsFeed.body.profiles.map((profile: any) => profile.userId);
    expect(friendIds).toContain(maleFriend.id);
    expect(friendIds).not.toContain(femaleRecent.id);
  });
});

describe("Admin delete cleanup", () => {
  it("removes only the target user's dependent records", async () => {
    const adminPhone = "5554300000";
    const passwordHash = await bcrypt.hash("Admin@123", 10);
    await prisma.user.create({
      data: {
        phone: adminPhone,
        email: "admin-delete@example.com",
        passwordHash,
        role: "ADMIN",
        isAdmin: true,
        status: "APPROVED",
        verifiedAt: new Date(),
        phoneVerifiedAt: new Date()
      }
    });

    const userA = await prisma.user.create({
      data: {
        phone: "5554300001",
        email: "delete-me@example.com",
        passwordHash: await bcrypt.hash("Password@1", 10),
        status: "APPROVED",
        verifiedAt: new Date(),
        phoneVerifiedAt: new Date(),
        onboardingStep: "ACTIVE",
        paymentStatus: "PAID",
        profileCompletedAt: new Date()
      }
    });
    const userB = await prisma.user.create({
      data: {
        phone: "5554300002",
        email: "keep-me@example.com",
        passwordHash: await bcrypt.hash("Password@1", 10),
        status: "APPROVED",
        verifiedAt: new Date(),
        phoneVerifiedAt: new Date(),
        onboardingStep: "ACTIVE",
        paymentStatus: "PAID",
        profileCompletedAt: new Date()
      }
    });

    await prisma.profile.createMany({
      data: [
        {
          userId: userA.id,
          name: "User A",
          gender: "FEMALE",
          age: 25,
          city: "City",
          profession: "Tester",
          bioShort: "Bio",
          preferences: {}
        },
        {
          userId: userB.id,
          name: "User B",
          gender: "MALE",
          age: 26,
          city: "City",
          profession: "Tester",
          bioShort: "Bio",
          preferences: {}
        }
      ]
    });
    await prisma.photo.createMany({
      data: [
        { userId: userA.id, url: "/uploads/a.jpg" },
        { userId: userB.id, url: "/uploads/b.jpg" }
      ]
    });

    await prisma.like.create({
      data: { fromUserId: userA.id, toUserId: userB.id, type: "LIKE" }
    });
    const orderedMatch = [userA.id, userB.id].sort();
    const match = await prisma.match.create({
      data: { userAId: orderedMatch[0], userBId: orderedMatch[1] }
    });
    await prisma.consent.create({
      data: { matchId: match.id, userId: userA.id, response: "YES" }
    });
    await prisma.notification.create({
      data: { userId: userA.id, actorUserId: userB.id, type: "NEW_LIKE" }
    });

    const adminAgent = request.agent(app);
    const adminLogin = await adminAgent.post("/auth/login").send({ phone: adminPhone, password: "Admin@123" });
    const adminToken = adminLogin.body.accessToken as string;

    const response = await withAuth(adminAgent.post(`/admin/users/${userA.id}/delete`), adminToken);
    expect(response.status).toBe(200);

    const deletedUser = await prisma.user.findUnique({ where: { id: userA.id } });
    const remainingUser = await prisma.user.findUnique({ where: { id: userB.id } });
    const remainingLikes = await prisma.like.findMany({ where: { toUserId: userB.id } });
    const remainingMatches = await prisma.match.findMany({
      where: { OR: [{ userAId: userB.id }, { userBId: userB.id }] }
    });
    const remainingNotifications = await prisma.notification.findMany({ where: { userId: userA.id } });

    expect(deletedUser).toBeNull();
    expect(remainingUser).not.toBeNull();
    expect(remainingLikes).toHaveLength(0);
    expect(remainingMatches).toHaveLength(0);
    expect(remainingNotifications).toHaveLength(0);
  });
});

describe("Account settings and deletion", () => {
  it("rejects empty settings patch payload", async () => {
    const agent = request.agent(app);
    const phone = "5554400001";
    const session = await registerAndLoginSession(agent, phone, "Password@1");

    const response = await withAuth(
      agent.patch("/profile/settings").set("x-onboarding-token", session.onboardingToken).send({}),
      session.accessToken
    );

    expect(response.status).toBe(400);
  });

  it("deactivates current account with explicit confirmation", async () => {
    const agent = request.agent(app);
    const phone = "5554400002";
    const session = await registerAndLoginSession(agent, phone, "Password@1");

    const response = await withAuth(
      agent.delete("/account").send({ confirmation: "DELETE_MY_ACCOUNT", reason: "Requested by member" }),
      session.accessToken
    );

    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);

    const updated = await prisma.user.findUnique({ where: { phone } });
    expect(updated?.deactivatedAt).toBeTruthy();
    expect(updated?.subscriptionStatus).toBe("CANCELED");
  });
});

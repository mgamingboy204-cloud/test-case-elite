import { describe, expect, it, vi, beforeEach } from "vitest";
import { errorHandler } from "../src/middlewares/errorHandler";
import { createLikeHandler } from "../src/controllers/likeController";
import { createLike } from "../src/services/likeService";
import { getDiscoverFeed } from "../src/services/discoverService";
import { likeLimiter } from "../src/middlewares/rateLimiters";
import express from "express";
import request from "supertest";

vi.mock("../src/services/likeService", () => ({
  createLike: vi.fn(),
  getIncomingLikes: vi.fn(),
  getOutgoingLikes: vi.fn()
}));

vi.mock("../src/db/prisma", () => ({
  prisma: {
    $transaction: vi.fn(),
    profile: {
      findUnique: vi.fn(),
      findMany: vi.fn()
    }
  }
}));

import { prisma } from "../src/db/prisma";

function mockReq(overrides: any = {}) {
  return {
    method: "POST",
    path: "/likes",
    body: {},
    user: undefined,
    headers: {},
    get(name: string) {
      return this.headers[name.toLowerCase()] ?? null;
    },
    ...overrides
  } as any;
}

function mockRes() {
  return {
    locals: { requestId: "req-test" },
    statusCode: 200,
    payload: undefined as any,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: any) {
      this.payload = payload;
      return this;
    }
  } as any;
}

describe("runtime contracts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("error middleware never throws when req.user is undefined", () => {
    const req = { path: "/likes", method: "POST", user: undefined, get: () => null } as any;
    const res = mockRes();
    const next = vi.fn();

    expect(() => errorHandler(new Error("boom"), req, res, next)).not.toThrow();
    expect(res.statusCode).toBe(500);
  });

  it("likes handler returns 401 when req.user missing", async () => {
    const req = mockReq({ body: { actionId: "a1", targetUserId: "u2", action: "LIKE" } });
    const res = mockRes();

    await createLikeHandler(req, res);

    expect(res.statusCode).toBe(401);
  });

  it("likes handler calls service with actorUserId = req.user.id", async () => {
    (createLike as any).mockResolvedValue({ matchId: null, alreadyProcessed: false });
    const req = mockReq({ user: { id: "actor-123" }, body: { actionId: "a1", targetUserId: "550e8400-e29b-41d4-a716-446655440000", action: "LIKE" } });
    const res = mockRes();

    await createLikeHandler(req, res);

    expect(createLike).toHaveBeenCalledWith({
      actionId: "a1",
      actorUserId: "actor-123",
      targetUserId: "550e8400-e29b-41d4-a716-446655440000",
      action: "LIKE"
    });
  });



  it("like limiter key generator does not throw when session is missing", async () => {
    const app = express();
    app.use((req, _res, next) => {
      req.user = { id: "actor-123" };
      next();
    });
    app.use(likeLimiter);
    app.post("/likes", (_req, res) => res.status(201).json({ ok: true }));

    const response = await request(app).post("/likes");

    expect(response.status).toBe(201);
  });

  it("discover excludes already swiped users", async () => {
    (prisma.profile.findUnique as any).mockResolvedValue({ gender: "MALE" });
    (prisma.profile.findMany as any).mockResolvedValue([]);

    await getDiscoverFeed({ userId: "u1" });

    const where = (prisma.profile.findMany as any).mock.calls[0][0].where;
    expect(JSON.stringify(where)).toContain("likesReceived");
    expect(JSON.stringify(where)).toContain("actorUserId");
  });
});

import { describe, expect, it, vi, beforeEach } from "vitest";
import { requireAuth } from "../src/middlewares/auth";
import { createLikeHandler } from "../src/controllers/likeController";
import { createLike } from "../src/services/likeService";

vi.mock("../src/db/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn()
    }
  }
}));

vi.mock("../src/utils/jwt", () => ({
  verifyAccessToken: vi.fn()
}));

vi.mock("../src/services/likeService", () => ({
  createLike: vi.fn(),
  getIncomingLikes: vi.fn(),
  getOutgoingLikes: vi.fn()
}));

import { prisma } from "../src/db/prisma";
import { verifyAccessToken } from "../src/utils/jwt";

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

describe("auth + likes unit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requireAuth sets req.user.id", async () => {
    (verifyAccessToken as any).mockReturnValue({ userId: "user-1", tokenVersion: 0 });
    (prisma.user.findUnique as any).mockResolvedValue({ id: "user-1", status: "APPROVED", tokenVersion: 0 });
    const req = mockReq({ headers: { authorization: "Bearer good-token" } });
    const res = mockRes();
    const next = vi.fn();

    await requireAuth(req, res, next);

    expect(req.user).toEqual({ id: "user-1" });
    expect(next).toHaveBeenCalled();
  });

  it("likes controller returns 401 when req.user missing", async () => {
    const req = mockReq({ body: { actionId: "a1", targetUserId: "u2", action: "LIKE" } });
    const res = mockRes();

    await createLikeHandler(req, res);

    expect(res.statusCode).toBe(401);
    expect((createLike as any)).not.toHaveBeenCalled();
  });

  it("likes controller returns 400 on bad payload", async () => {
    const req = mockReq({ user: { id: "u1" }, body: { actionId: "a1", targetUserId: "u2", action: "BAD" } });
    const res = mockRes();

    await createLikeHandler(req, res);

    expect(res.statusCode).toBe(400);
    expect((createLike as any)).not.toHaveBeenCalled();
  });

  it("likes controller calls service with actorUserId=req.user.id", async () => {
    (createLike as any).mockResolvedValue({ matchId: null, alreadyProcessed: false });
    const req = mockReq({ user: { id: "actor-123" }, body: { actionId: "a1", targetUserId: "u2", action: "LIKE" } });
    const res = mockRes();

    await createLikeHandler(req, res);

    expect(createLike).toHaveBeenCalledWith({
      actionId: "a1",
      actorUserId: "actor-123",
      targetUserId: "u2",
      action: "LIKE"
    });
    expect(res.statusCode).toBe(200);
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/db/prisma", () => ({
  prisma: {
    $transaction: vi.fn()
  }
}));

import { prisma } from "../src/db/prisma";
import { createLike } from "../src/services/likeService";

describe("like service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns alreadyProcessed=true when duplicate actionId arrives", async () => {
    const tx = {
      like: { findUnique: vi.fn().mockResolvedValue({ id: "like-1", actionId: "dup-1" }) }
    };
    (prisma.$transaction as any).mockImplementation(async (fn: any) => fn(tx));

    const result = await createLike({ actionId: "dup-1", actorUserId: "u1", targetUserId: "u2", action: "LIKE" });

    expect(result).toEqual({ matchId: null, alreadyProcessed: true });
  });
});

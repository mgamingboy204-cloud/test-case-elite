import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/db/prisma", () => ({
  prisma: {
    like: {
      findMany: vi.fn()
    },
    notification: {
      findMany: vi.fn()
    }
  }
}));

import { prisma } from "../src/db/prisma";
import { getIncomingLikes, getOutgoingLikes } from "../src/services/likeService";

describe("likes list service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns incoming likes with fromUser alias", async () => {
    (prisma.like.findMany as any).mockResolvedValue([
      {
        id: "l1",
        action: "LIKE",
        createdAt: new Date("2025-01-01T00:00:00Z"),
        actorUser: {
          id: "u2",
          displayName: "A Display",
          videoVerificationStatus: "APPROVED",
          profile: { name: "A", age: 28, city: "Paris" },
          photos: [{ url: "p1" }]
        }
      }
    ]);
    (prisma.notification.findMany as any).mockResolvedValue([{ actorUserId: "u2", isRead: false }]);

    const result = await getIncomingLikes("u1");

    expect(result.incoming[0].fromUser.id).toBe("u2");
    expect(result.incoming[0].actorUser.id).toBe("u2");
    expect(result.incoming[0].senderData.displayName).toBe("A");
    expect(result.incoming[0].senderData.primaryPhotoUrl).toBe("p1");
    expect(result.incoming[0].isSeen).toBe(false);
  });

  it("returns outgoing likes with toUser alias", async () => {
    (prisma.like.findMany as any).mockResolvedValue([
      {
        id: "l2",
        action: "LIKE",
        createdAt: new Date("2025-01-01T00:00:00Z"),
        targetUser: { id: "u3", profile: { name: "B" }, photos: [{ url: "p2" }] }
      }
    ]);

    const result = await getOutgoingLikes("u1");

    expect(result.outgoing[0].toUser.id).toBe("u3");
    expect(result.outgoing[0].targetUser.id).toBe("u3");
  });
});

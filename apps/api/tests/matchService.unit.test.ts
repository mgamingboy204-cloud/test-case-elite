import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/db/prisma", () => ({
  prisma: {
    match: {
      findMany: vi.fn()
    }
  }
}));

import { prisma } from "../src/db/prisma";
import { listMatches } from "../src/services/matchService";

describe("match service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("maps partner info and consent status for mutual matches", async () => {
    (prisma.match.findMany as any).mockResolvedValue([
      {
        id: "m1",
        userAId: "u1",
        userBId: "u2",
        createdAt: new Date("2025-01-10T00:00:00Z"),
        phoneExchange: null,
        consents: [{ userId: "u1", response: "YES" }],
        userA: { id: "u1", profile: { name: "Me" }, photos: [] },
        userB: {
          id: "u2",
          profile: { name: "Alex", age: 29, city: "Delhi", profession: "Designer" },
          photos: [{ url: "photo-1" }]
        }
      }
    ]);

    const result = await listMatches("u1");

    expect(result.matches[0].partnerInfo.name).toBe("Alex");
    expect(result.matches[0].partnerInfo.age).toBe(29);
    expect(result.matches[0].partnerInfo.likedPhotoUrl).toBe("photo-1");
    expect(result.matches[0].status).toBe("Awaiting their number");
    expect(result.matches[0].isNumberShared).toBe(false);
  });
});

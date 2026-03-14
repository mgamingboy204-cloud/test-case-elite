import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/db/prisma", () => ({
  prisma: {
    notification: {
      findMany: vi.fn(),
      count: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn()
    }
  }
}));

import { prisma } from "../src/db/prisma";
import { listNotifications, markNotificationRead } from "../src/services/notificationService";

describe("notification service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("maps notifications to actor preview and event metadata", async () => {
    (prisma.notification.findMany as any).mockResolvedValue([
      {
        id: "n1",
        type: "NEW_LIKE",
        isRead: false,
        createdAt: new Date("2025-01-01T00:00:00Z"),
        actor: { profile: { name: "Alex" }, photos: [{ url: "img-1" }] },
        match: null
      }
    ]);
    (prisma.notification.count as any).mockResolvedValue(1);

    const result = await listNotifications("u1");

    expect(result.unreadCount).toBe(1);
    expect(result.notifications[0].eventCategory).toBe("LIKE");
    expect(result.notifications[0].eventMessage).toBe("Alex liked you");
    expect(result.notifications[0].targetRoute).toBe("/likes");
    expect(result.notifications[0].actorPreview.actorImageUrl).toBe("img-1");
  });

  it("marks unread notification as read", async () => {
    (prisma.notification.findFirst as any).mockResolvedValue({ id: "n2", isRead: false, userId: "u1" });
    (prisma.notification.update as any).mockResolvedValue({ id: "n2", isRead: true });

    const result = await markNotificationRead({ userId: "u1", notificationId: "n2" });

    expect(result.ok).toBe(true);
    expect(prisma.notification.update).toHaveBeenCalledTimes(1);
  });
});

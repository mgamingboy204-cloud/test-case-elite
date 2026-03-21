import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  useAlertsData,
  useMarkAlertReadMutation
} from "@/lib/memberState";
import { renderWithQueryClient } from "@/tests/testUtils";

const store = {
  alerts: [] as Array<any>
};

vi.mock("@/lib/api", () => ({
  apiRequestAuth: vi.fn(async (path: string) => {
    const alertMatch = path.match(/^\/alerts\/(.+)\/read$/);
    if (alertMatch) {
      const alertId = alertMatch[1];
      store.alerts = store.alerts.map((alert) =>
        alert.id === alertId ? { ...alert, isUnread: false } : alert
      );
      const unreadCount = store.alerts.filter((alert) => alert.isUnread).length;
      return { alertId, updatedCount: 1, unreadCount };
    }
    throw new Error(`Unhandled path: ${path}`);
  })
}));

vi.mock("@/lib/queries", () => ({
  fetchAlerts: vi.fn(async () => store.alerts.map((alert) => ({ ...alert }))),
  fetchMatches: vi.fn(async () => []),
  fetchProfile: vi.fn(async () => ({ id: "profile-1" }))
}));

vi.mock("@/lib/likes", () => ({
  fetchIncomingLikes: vi.fn(async () => []),
  respondToIncomingLike: vi.fn(),
  sendLikeAction: vi.fn()
}));

vi.mock("@/lib/offlineMeet", () => ({
  fetchOfflineMeetCase: vi.fn(),
  submitOfflineMeetSelections: vi.fn()
}));

vi.mock("@/lib/onlineMeet", () => ({
  fetchOnlineMeetCase: vi.fn(),
  submitOnlineMeetSelections: vi.fn()
}));

vi.mock("@/lib/matches", () => ({
  initiateMatchInteractionRequest: vi.fn(),
  respondMatchConsent: vi.fn(),
  requestSocialExchange: vi.fn(),
  respondSocialExchange: vi.fn(),
  submitSocialExchangeHandle: vi.fn(),
  revealSocialExchange: vi.fn(),
  getPhoneUnlock: vi.fn(),
  unmatch: vi.fn()
}));

function AlertsHarness() {
  const alertsQuery = useAlertsData();
  const markReadMutation = useMarkAlertReadMutation();
  const firstAlert = alertsQuery.data?.[0] ?? null;
  const unreadCount = alertsQuery.data?.filter((alert) => alert.isUnread).length ?? 0;

  return (
    <div>
      <div data-testid="unread-count">{unreadCount}</div>
      <div data-testid="first-alert-state">{firstAlert?.isUnread ? "unread" : "read"}</div>
      <button type="button" disabled={!firstAlert} onClick={() => markReadMutation.mutate(firstAlert!.id)}>
        mark-read
      </button>
    </div>
  );
}

describe("alerts synchronization", () => {
  beforeEach(() => {
    store.alerts = [
      {
        id: "alert-1",
        type: "MATCH_CREATED",
        title: "New match",
        body: "Taylor matched with you",
        createdAt: "2026-03-21T10:00:00.000Z",
        isUnread: true,
        deepLinkUrl: "/matches"
      }
    ];
  });

  it("marks alerts read in-place without needing a manual refresh", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<AlertsHarness />);

    await waitFor(() => {
      expect(screen.getByTestId("unread-count")).toHaveTextContent("1");
      expect(screen.getByTestId("first-alert-state")).toHaveTextContent("unread");
    });

    await user.click(screen.getByText("mark-read"));

    await waitFor(() => {
      expect(screen.getByTestId("unread-count")).toHaveTextContent("0");
      expect(screen.getByTestId("first-alert-state")).toHaveTextContent("read");
    });
  });
});

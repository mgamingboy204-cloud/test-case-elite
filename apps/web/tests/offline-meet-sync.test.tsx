import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  useMatchesData,
  useOfflineMeetCaseData,
  useSubmitOfflineMeetSelectionsMutation
} from "@/lib/memberState";
import { renderWithQueryClient } from "@/tests/testUtils";

const matchStore = {
  matches: [] as Array<any>,
  offlineCases: {} as Record<string, any>
};

vi.mock("@/lib/queries", () => ({
  fetchIncomingLikes: vi.fn(async () => []),
  fetchAlerts: vi.fn(async () => []),
  fetchProfile: vi.fn(async () => ({ id: "profile-1" })),
  fetchMatches: vi.fn(async () => matchStore.matches.map((match) => ({ ...match })))
}));

vi.mock("@/lib/likes", () => ({
  fetchIncomingLikes: vi.fn(async () => []),
  respondToIncomingLike: vi.fn(),
  sendLikeAction: vi.fn()
}));

vi.mock("@/lib/offlineMeet", () => ({
  fetchOfflineMeetCase: vi.fn(async (matchId: string) => ({ ...matchStore.offlineCases[matchId] })),
  submitOfflineMeetSelections: vi.fn(async (matchId: string) => {
    matchStore.offlineCases[matchId] = {
      ...matchStore.offlineCases[matchId],
      status: "USER_ONE_RESPONDED"
    };
    matchStore.matches = matchStore.matches.map((match) =>
      match.id === matchId
        ? {
            ...match,
            offlineMeetCase: {
              ...match.offlineMeetCase,
              status: "USER_ONE_RESPONDED"
            }
          }
        : match
    );
    return { ok: true, status: "USER_ONE_RESPONDED" };
  })
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

function OfflineMeetHarness() {
  const matchesQuery = useMatchesData();
  const match = matchesQuery.data?.[0] ?? null;
  const offlineCaseQuery = useOfflineMeetCaseData(match?.id ?? null, Boolean(match));
  const submitMutation = useSubmitOfflineMeetSelectionsMutation();

  return (
    <div>
      <div data-testid="match-status">{match?.offlineMeetCase?.status ?? "none"}</div>
      <div data-testid="detail-status">{offlineCaseQuery.data?.status ?? "none"}</div>
      <button
        type="button"
        disabled={!match}
        onClick={() =>
          submitMutation.mutate({
            matchId: match!.id,
            cafes: ["cafe-1", "cafe-2"],
            timeSlots: ["slot-1", "slot-2", "slot-3"]
          })
        }
      >
        submit
      </button>
    </div>
  );
}

describe("offline meet cache synchronization", () => {
  beforeEach(() => {
    matchStore.matches = [
      {
        id: "match-1",
        name: "Taylor",
        age: 29,
        location: "BENGALURU",
        image: "/photo.jpg",
        bio: null,
        interactions: {
          OFFLINE_MEET: { type: "OFFLINE_MEET", status: "ACCEPTED", canInitiate: false, isInitiatedByMe: true, requestedAt: null },
          ONLINE_MEET: { type: "ONLINE_MEET", status: "PENDING", canInitiate: true, isInitiatedByMe: false, requestedAt: null },
          SOCIAL_EXCHANGE: { type: "SOCIAL_EXCHANGE", status: "PENDING", canInitiate: true, isInitiatedByMe: false, requestedAt: null },
          PHONE_EXCHANGE: { type: "PHONE_EXCHANGE", status: "PENDING", canInitiate: true, isInitiatedByMe: false, requestedAt: null }
        },
        offlineMeetCase: {
          id: "offline-1",
          status: "AWAITING_USER_SELECTIONS",
          responseDeadlineAt: null,
          cooldownUntil: null,
          finalCafe: null,
          finalTimeSlot: null
        },
        onlineMeetCase: null,
        socialExchangeCase: null,
        phoneExchangeCase: null
      }
    ];

    matchStore.offlineCases = {
      "match-1": {
        id: "offline-1",
        matchId: "match-1",
        status: "AWAITING_USER_SELECTIONS",
        assignedEmployeeId: null,
        responseDeadlineAt: null,
        cooldownUntil: null,
        finalCafe: null,
        finalTimeSlot: null,
        timeoutUserId: null,
        users: {
          me: { id: "user-1", name: "You", locationLabel: "Bengaluru" },
          other: { id: "user-2", name: "Taylor", locationLabel: "Bengaluru" }
        },
        options: {
          cafes: [
            { id: "cafe-1", name: "Cafe A", address: "Addr A" },
            { id: "cafe-2", name: "Cafe B", address: "Addr B" }
          ],
          timeSlots: [
            { id: "slot-1", label: "Mon 7 PM" },
            { id: "slot-2", label: "Tue 7 PM" },
            { id: "slot-3", label: "Wed 7 PM" }
          ]
        },
        selections: {
          mine: { cafes: [], timeSlots: [] },
          other: { cafes: [], timeSlots: [] }
        }
      }
    };
  });

  it("submitting selections updates both the match summary and the detail query without manual refresh", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<OfflineMeetHarness />);

    await waitFor(() => {
      expect(screen.getByTestId("match-status")).toHaveTextContent("AWAITING_USER_SELECTIONS");
      expect(screen.getByTestId("detail-status")).toHaveTextContent("AWAITING_USER_SELECTIONS");
    });

    await user.click(screen.getByText("submit"));

    await waitFor(() => {
      expect(screen.getByTestId("match-status")).toHaveTextContent("USER_ONE_RESPONDED");
      expect(screen.getByTestId("detail-status")).toHaveTextContent("USER_ONE_RESPONDED");
    });
  });
});

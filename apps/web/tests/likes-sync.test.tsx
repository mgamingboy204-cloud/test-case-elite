import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  useLikesData,
  useMatchesData,
  useRespondToIncomingLikeMutation
} from "@/lib/memberState";
import { renderWithQueryClient } from "@/tests/testUtils";

const store = {
  likes: [] as Array<any>,
  matches: [] as Array<any>
};

vi.mock("@/lib/queries", () => ({
  fetchMatches: vi.fn(async () => store.matches.map((match) => ({ ...match }))),
  fetchAlerts: vi.fn(async () => []),
  fetchProfile: vi.fn(async () => ({ id: "profile-1" }))
}));

vi.mock("@/lib/likes", () => ({
  fetchIncomingLikes: vi.fn(async () => store.likes.map((like) => ({ ...like }))),
  respondToIncomingLike: vi.fn(async ({ targetUserId }: { targetUserId: string }) => {
    store.likes = store.likes.filter((entry) => entry.profileId !== targetUserId);
    store.matches = [
      {
        id: "match-1",
        name: "Taylor",
        age: 29,
        location: "BENGALURU",
        image: "/match.jpg",
        bio: null,
        interactions: {
          OFFLINE_MEET: { type: "OFFLINE_MEET", status: "PENDING", canInitiate: true, isInitiatedByMe: false, requestedAt: null },
          ONLINE_MEET: { type: "ONLINE_MEET", status: "PENDING", canInitiate: true, isInitiatedByMe: false, requestedAt: null },
          SOCIAL_EXCHANGE: { type: "SOCIAL_EXCHANGE", status: "PENDING", canInitiate: true, isInitiatedByMe: false, requestedAt: null },
          PHONE_EXCHANGE: { type: "PHONE_EXCHANGE", status: "PENDING", canInitiate: true, isInitiatedByMe: false, requestedAt: null }
        },
        offlineMeetCase: null,
        onlineMeetCase: null,
        socialExchangeCase: null,
        phoneExchangeCase: null
      }
    ];
    return { matchId: "match-1" };
  }),
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

function LikesSyncHarness() {
  const likesQuery = useLikesData();
  const matchesQuery = useMatchesData();
  const respondMutation = useRespondToIncomingLikeMutation();
  const firstLike = likesQuery.data?.[0] ?? null;

  return (
    <div>
      <div data-testid="likes-count">{likesQuery.data?.length ?? 0}</div>
      <div data-testid="matches-count">{matchesQuery.data?.length ?? 0}</div>
      <button type="button" disabled={!firstLike} onClick={() => respondMutation.mutate({ targetUserId: firstLike!.profileId, action: "LIKE" })}>
        like-back
      </button>
    </div>
  );
}

describe("like to match synchronization", () => {
  beforeEach(() => {
    store.likes = [
      {
        likeId: "like-1",
        profileId: "user-2",
        name: "Taylor",
        age: 29,
        location: "Bengaluru",
        image: "/like.jpg"
      }
    ];
    store.matches = [];
  });

  it("removes the incoming like and refreshes matches after a successful like-back", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<LikesSyncHarness />);

    await waitFor(() => {
      expect(screen.getByTestId("likes-count")).toHaveTextContent("1");
      expect(screen.getByTestId("matches-count")).toHaveTextContent("0");
    });

    await user.click(screen.getByText("like-back"));

    await waitFor(() => {
      expect(screen.getByTestId("likes-count")).toHaveTextContent("0");
      expect(screen.getByTestId("matches-count")).toHaveTextContent("1");
    });
  });
});

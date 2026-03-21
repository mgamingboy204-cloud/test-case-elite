import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  canStartVerificationRequest,
  getVerificationOwnershipLabel,
  useAssignVerificationRequestMutation,
  useVerificationQueue
} from "@/lib/opsState";
import { listVerificationRequestsForWorker } from "@/lib/workerVerification";
import { renderWithQueryClient } from "@/tests/testUtils";

const store = {
  requests: [] as Array<{
    id: string;
    status: "PENDING" | "ASSIGNED";
    assignedEmployeeId: string | null;
    meetUrl: string | null;
    reason: string | null;
    createdAt: string;
    updatedAt: string;
    assignedAt: string | null;
    escalationRequestedAt: string | null;
    user: { id: string; phone: string; email: string | null };
  }>
};

type QueueResponse = {
  statusView: "ACTIVE";
  requests: Array<{
    id: string;
    status: "PENDING" | "ASSIGNED";
    assignedEmployeeId: string | null;
    meetUrl: string | null;
    reason: string | null;
    createdAt: string;
    updatedAt: string;
    assignedAt: string | null;
    escalationRequestedAt: string | null;
    user: { id: string; phone: string; email: string | null };
  }>;
};

const queuedListResponses: Array<QueueResponse | Promise<QueueResponse>> = [];

vi.mock("@/lib/workerVerification", () => ({
  isValidGoogleMeetUrl: (value: string) => value.startsWith("https://meet.google.com/"),
  listVerificationRequestsForWorker: vi.fn(async () => {
    const next = queuedListResponses.shift();
    if (next) {
      return await next;
    }
    return { statusView: "ACTIVE" as const, requests: store.requests.map((request) => ({ ...request })) };
  }),
  assignVerificationRequest: vi.fn(async (requestId: string) => {
    const request = store.requests.find((entry) => entry.id === requestId);
    if (!request) throw new Error("Missing request");
    request.status = "ASSIGNED";
    request.assignedEmployeeId = "emp-1";
    request.assignedAt = "2026-03-21T10:05:00.000Z";
    request.updatedAt = "2026-03-21T10:05:00.000Z";
    return { request: { ...request } };
  }),
  startVerificationRequest: vi.fn(),
  approveVerificationRequest: vi.fn(),
  rejectVerificationRequest: vi.fn()
}));

function VerificationHarness() {
  const queueQuery = useVerificationQueue("ACTIVE");
  const assignMutation = useAssignVerificationRequestMutation();
  const selected = queueQuery.data?.[0] ?? null;
  const canSendLink = canStartVerificationRequest(selected, "emp-1", false);

  return (
    <div>
      <div data-testid="owner">{selected ? getVerificationOwnershipLabel(selected, "emp-1") : "none"}</div>
      <div data-testid="status">{selected?.status ?? "none"}</div>
      <div data-testid="assigned-id">{selected?.assignedEmployeeId ?? "none"}</div>
      <div data-testid="can-send-link">{String(canSendLink)}</div>
      <button type="button" onClick={() => queueQuery.refetch()} disabled={!selected}>
        refetch
      </button>
      <button type="button" onClick={() => assignMutation.mutate(selected!.id)} disabled={!selected}>
        assign
      </button>
    </div>
  );
}

describe("verification queue synchronization", () => {
  beforeEach(() => {
    queuedListResponses.length = 0;
    vi.mocked(listVerificationRequestsForWorker).mockClear();
    store.requests = [
      {
        id: "vr-1",
        status: "PENDING",
        assignedEmployeeId: null,
        meetUrl: null,
        reason: null,
        createdAt: "2026-03-21T10:00:00.000Z",
        updatedAt: "2026-03-21T10:00:00.000Z",
        assignedAt: null,
        escalationRequestedAt: null,
        user: { id: "user-1", phone: "+91 99999 11111", email: "member@example.com" }
      }
    ];
  });

  it("assigning updates queue ownership, selected detail state, and next-step availability without refresh", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<VerificationHarness />);

    await screen.findByText("assign");
    await waitFor(() => {
      expect(screen.getByTestId("owner")).toHaveTextContent("Unassigned");
      expect(screen.getByTestId("status")).toHaveTextContent("PENDING");
      expect(screen.getByTestId("can-send-link")).toHaveTextContent("false");
    });

    await user.click(screen.getByText("assign"));

    await waitFor(() => {
      expect(screen.getByTestId("owner")).toHaveTextContent("Assigned to you");
      expect(screen.getByTestId("status")).toHaveTextContent("ASSIGNED");
      expect(screen.getByTestId("assigned-id")).toHaveTextContent("emp-1");
      expect(screen.getByTestId("can-send-link")).toHaveTextContent("true");
    });
  });

  it("refetches the active queue after assign so the server remains the source of truth", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<VerificationHarness />);

    await waitFor(() => {
      expect(screen.getByTestId("owner")).toHaveTextContent("Unassigned");
      expect(screen.getByTestId("status")).toHaveTextContent("PENDING");
    });

    queuedListResponses.push({
      statusView: "ACTIVE",
      requests: [
        {
          id: "vr-1",
          status: "ASSIGNED",
          assignedEmployeeId: "emp-1",
          meetUrl: null,
          reason: null,
          createdAt: "2026-03-21T10:00:00.000Z",
          updatedAt: "2026-03-21T10:05:00.000Z",
          assignedAt: "2026-03-21T10:05:00.000Z",
          escalationRequestedAt: null,
          user: { id: "user-1", phone: "+91 99999 11111", email: "member@example.com" }
        }
      ]
    });

    await user.click(screen.getByText("assign"));

    await waitFor(() => {
      expect(screen.getByTestId("owner")).toHaveTextContent("Assigned to you");
      expect(screen.getByTestId("status")).toHaveTextContent("ASSIGNED");
      expect(screen.getByTestId("can-send-link")).toHaveTextContent("true");
    });

    await waitFor(() => {
      expect(vi.mocked(listVerificationRequestsForWorker)).toHaveBeenCalledTimes(2);
      expect(screen.getByTestId("owner")).toHaveTextContent("Assigned to you");
      expect(screen.getByTestId("status")).toHaveTextContent("ASSIGNED");
      expect(screen.getByTestId("assigned-id")).toHaveTextContent("emp-1");
      expect(screen.getByTestId("can-send-link")).toHaveTextContent("true");
    });
  });
});

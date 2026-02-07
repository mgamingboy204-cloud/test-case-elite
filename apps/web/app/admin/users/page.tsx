"use client";

import type { CSSProperties } from "react";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../../lib/api";
import { queryKeys } from "../../../lib/queryKeys";

type AdminUser = {
  id: string;
  phone?: string;
  displayName?: string;
  status?: string;
  onboardingStep?: string;
  paymentStatus?: string;
  gender?: string | null;
  deactivatedAt?: string | null;
  profile?: { name?: string | null };
  videoVerificationStatus?: string | null;
};

type UsersResponse = { users: AdminUser[] };

const modalOverlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(15, 23, 42, 0.6)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "1.5rem",
  zIndex: 50
};

const modalCardStyle: CSSProperties = {
  maxWidth: "420px",
  width: "100%"
};

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [meetModalUser, setMeetModalUser] = useState<AdminUser | null>(null);
  const [meetUrl, setMeetUrl] = useState("");
  const [rejectModalUser, setRejectModalUser] = useState<AdminUser | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const usersQuery = useQuery({
    queryKey: queryKeys.adminUsers,
    queryFn: () => apiFetch<UsersResponse>("/admin/users"),
    staleTime: 10000
  });

  const updateVerificationMutation = useMutation({
    mutationFn: ({ id, action, reason }: { id: string; action: "approve" | "reject"; reason?: string }) =>
      apiFetch(`/admin/verifications/${id}/${action}`, {
        method: "POST",
        body: JSON.stringify({ reason })
      }),
    onSuccess: (_data, variables) => {
      setMessage(`User ${variables.action}d.`);
      queryClient.invalidateQueries({ queryKey: queryKeys.adminUsers });
      queryClient.invalidateQueries({ queryKey: ["adminVideoQueue"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.userVerificationStatus });
      queryClient.invalidateQueries({ queryKey: queryKeys.me });
    },
    onError: (error) => {
      setMessage(error instanceof Error ? error.message : "Unable to update user.");
    },
    onSettled: () => setLoading(false)
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: "ban" }) =>
      apiFetch(`/admin/users/${id}/${action}`, { method: "POST" }),
    onSuccess: (_data, variables) => {
      setMessage(`User ${variables.action}d.`);
      queryClient.invalidateQueries({ queryKey: queryKeys.adminUsers });
      queryClient.invalidateQueries({ queryKey: queryKeys.me });
    },
    onError: (error) => {
      setMessage(error instanceof Error ? error.message : "Unable to update user.");
    },
    onSettled: () => setLoading(false)
  });

  const manageUserMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: "deactivate" | "delete" }) =>
      apiFetch(`/admin/users/${id}/${action}`, { method: "POST" }),
    onSuccess: (_data, variables) => {
      setMessage(`User ${variables.action}d.`);
      queryClient.invalidateQueries({ queryKey: queryKeys.adminUsers });
      queryClient.invalidateQueries({ queryKey: queryKeys.me });
    },
    onError: (error) => {
      setMessage(error instanceof Error ? error.message : "Unable to update user.");
    },
    onSettled: () => setLoading(false)
  });

  const meetLinkMutation = useMutation({
    mutationFn: ({ id, meetUrl }: { id: string; meetUrl: string }) =>
      apiFetch(`/admin/verifications/${id}/meet-link`, {
        method: "POST",
        body: JSON.stringify({ meetUrl })
      }),
    onSuccess: () => {
      setMessage("Meet link sent.");
      setMeetModalUser(null);
      setMeetUrl("");
      queryClient.invalidateQueries({ queryKey: queryKeys.adminUsers });
      queryClient.invalidateQueries({ queryKey: ["adminVideoQueue"] });
    },
    onError: (error) => {
      setMessage(error instanceof Error ? error.message : "Unable to send meet link.");
    },
    onSettled: () => setLoading(false)
  });

  function loadUsers() {
    setLoading(true);
    setMessage("Loading users...");
    void usersQuery.refetch().finally(() => setLoading(false));
  }

  function updateUserVerification(id: string, action: "approve" | "reject", reason?: string) {
    setLoading(true);
    setMessage(`${action} user...`);
    updateVerificationMutation.mutate({ id, action, reason });
  }

  function updateUser(id: string, action: "ban") {
    setLoading(true);
    setMessage(`${action} user...`);
    updateUserMutation.mutate({ id, action });
  }

  function manageUser(id: string, action: "deactivate" | "delete") {
    setLoading(true);
    setMessage(`${action} user...`);
    manageUserMutation.mutate({ id, action });
  }

  function sendMeetLink() {
    if (!meetModalUser) return;
    if (!meetUrl.trim().startsWith("https://meet.google.com/")) {
      setMessage("Meet link must start with https://meet.google.com/");
      return;
    }
    setLoading(true);
    setMessage("Sending meet link...");
    meetLinkMutation.mutate({ id: meetModalUser.id, meetUrl: meetUrl.trim() });
  }

  async function confirmReject() {
    if (!rejectModalUser) return;
    if (!rejectReason.trim()) {
      setMessage("Rejection reason is required.");
      return;
    }
    updateUserVerification(rejectModalUser.id, "reject", rejectReason.trim());
    setRejectModalUser(null);
    setRejectReason("");
  }

  const users = usersQuery.data?.users ?? [];

  return (
    <div className="card">
      <h2>Admin Users</h2>
      <button onClick={loadUsers} disabled={loading}>
        {loading ? "Loading..." : "Refresh Users"}
      </button>
      {message ? <p className="message">{message}</p> : null}
      <ul className="list">
        {users.map((user) => {
          const isPending = user.videoVerificationStatus === "PENDING";
          return (
            <li key={user.id} className="list-item">
              <div>
                <strong>{user.displayName ?? user.profile?.name ?? user.phone}</strong>
                <p className="card-subtitle">
                  {user.phone} • {user.status} • {user.onboardingStep} • {user.paymentStatus}
                </p>
                {user.gender ? <p className="card-subtitle">Gender: {user.gender}</p> : null}
                {user.deactivatedAt ? <p className="card-subtitle">Deactivated</p> : null}
              </div>
              <div className="grid two-column">
                <button onClick={() => updateUserVerification(user.id, "approve")} disabled={loading}>
                  Approve
                </button>
                <button className="secondary" onClick={() => setRejectModalUser(user)} disabled={loading}>
                  Reject
                </button>
                {isPending ? (
                  <button className="secondary" onClick={() => setMeetModalUser(user)} disabled={loading}>
                    Send Meet Link
                  </button>
                ) : null}
                <button className="secondary" onClick={() => updateUser(user.id, "ban")} disabled={loading}>
                  Ban
                </button>
                <button className="secondary" onClick={() => manageUser(user.id, "deactivate")} disabled={loading}>
                  Deactivate
                </button>
                <button className="secondary" onClick={() => manageUser(user.id, "delete")} disabled={loading}>
                  Delete
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      {meetModalUser ? (
        <div style={modalOverlayStyle}>
          <div className="card" style={modalCardStyle}>
            <h3>Send Google Meet link</h3>
            <p className="card-subtitle">
              Share the verification call link with {meetModalUser.displayName ?? meetModalUser.phone}.
            </p>
            <label className="field">
              Meet URL
              <input
                placeholder="https://meet.google.com/abc-defg-hij"
                value={meetUrl}
                onChange={(event) => setMeetUrl(event.target.value)}
              />
            </label>
            <div className="grid two-column">
              <button onClick={sendMeetLink} disabled={loading}>
                Send link
              </button>
              <button className="secondary" onClick={() => setMeetModalUser(null)} disabled={loading}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {rejectModalUser ? (
        <div style={modalOverlayStyle}>
          <div className="card" style={modalCardStyle}>
            <h3>Reject verification</h3>
            <p className="card-subtitle">Provide a reason for rejecting this verification request.</p>
            <label className="field">
              Reason
              <input value={rejectReason} onChange={(event) => setRejectReason(event.target.value)} />
            </label>
            <div className="grid two-column">
              <button onClick={confirmReject} disabled={loading}>
                Confirm reject
              </button>
              <button className="secondary" onClick={() => setRejectModalUser(null)} disabled={loading}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

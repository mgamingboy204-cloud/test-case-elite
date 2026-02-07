"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/api";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import ErrorState from "../components/ui/ErrorState";
import LoadingState from "../components/ui/LoadingState";
import PageHeader from "../components/ui/PageHeader";

export default function AdminPage() {
  const [stats, setStats] = useState<{
    totalUsers: number;
    activeUsers: number;
    pendingVerificationRequests: number;
    rejectedVerificationRequests: number;
  } | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "success">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    void loadDashboard();
  }, []);

  async function updateUser(id: string, action: "approve" | "reject") {
    try {
      await apiFetch(`/admin/users/${id}/${action}`, { method: "POST" });
      await loadDashboard();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to update user.");
      setStatus("error");
    }
  }

  async function loadDashboard() {
    setStatus("loading");
    try {
      const [statsResponse, usersResponse] = await Promise.all([
        apiFetch<{
          totalUsers: number;
          activeUsers: number;
          pendingVerificationRequests: number;
          rejectedVerificationRequests: number;
        }>("/admin/dashboard"),
        apiFetch<{ users: any[] }>("/admin/users")
      ]);
      setStats(statsResponse);
      setUsers(usersResponse.users ?? []);
      setStatus("success");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load stats.");
      setStatus("error");
    }
  }

  return (
    <div className="list-grid">
      <PageHeader title="Admin Control" subtitle="Monitor verification and community health." />
      {status === "loading" ? (
        <LoadingState message="Loading admin dashboard..." />
      ) : status === "error" ? (
        <ErrorState message={message} onRetry={loadDashboard} />
      ) : (
        <>
          <div className="list-grid">
            <Card variant="muted">
              <strong>{stats?.totalUsers ?? 0}</strong>
              <p className="text-muted">Users</p>
            </Card>
            <Card variant="muted">
              <strong>{stats?.pendingVerificationRequests ?? 0}</strong>
              <p className="text-muted">Pending Verification</p>
            </Card>
            <Card variant="muted">
              <strong>{stats?.activeUsers ?? 0}</strong>
              <p className="text-muted">Approved</p>
            </Card>
            <Card variant="muted">
              <strong>{stats?.rejectedVerificationRequests ?? 0}</strong>
              <p className="text-muted">Rejected</p>
            </Card>
          </div>
          <Card>
            <div className="page-header">
              <div>
                <h3>Users</h3>
                <p className="text-muted">Approve or reject verification requests.</p>
              </div>
              <Button variant="secondary" onClick={loadDashboard}>
                Refresh
              </Button>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td data-label="User">{user.displayName ?? user.profile?.name ?? user.phone}</td>
                    <td data-label="Status">{user.status ?? "PENDING"}</td>
                    <td data-label="Created">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}</td>
                    <td data-label="Actions">
                      <div className="page-header__actions">
                        <Button variant="secondary" onClick={() => updateUser(user.id, "approve")}>
                          Approve
                        </Button>
                        <Button variant="ghost" onClick={() => updateUser(user.id, "reject")}>
                          Reject
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )}
    </div>
  );
}

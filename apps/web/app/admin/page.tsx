"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../lib/api";
import { queryKeys } from "../../lib/queryKeys";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import ErrorState from "../components/ui/ErrorState";
import LoadingState from "../components/ui/LoadingState";
import PageHeader from "../components/ui/PageHeader";

type DashboardStats = {
  totalUsers: number;
  activeUsers: number;
  pendingVerificationRequests: number;
  rejectedVerificationRequests: number;
};

export default function AdminPage() {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");

  const statsQuery = useQuery({
    queryKey: queryKeys.adminQueues,
    queryFn: () =>
      apiFetch<DashboardStats>("/admin/dashboard"),
    staleTime: 5000,
    refetchInterval: 5000
  });

  const usersQuery = useQuery({
    queryKey: queryKeys.adminUsers,
    queryFn: () => apiFetch<{ users: any[] }>("/admin/users"),
    staleTime: 5000,
    refetchInterval: 5000
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: "approve" | "reject" }) =>
      apiFetch(`/admin/users/${id}/${action}`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminQueues });
      queryClient.invalidateQueries({ queryKey: queryKeys.adminUsers });
      queryClient.invalidateQueries({ queryKey: ["adminVideoQueue"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.userVerificationStatus });
      queryClient.invalidateQueries({ queryKey: queryKeys.me });
    },
    onError: (error) => {
      setMessage(error instanceof Error ? error.message : "Unable to update user.");
    }
  });

  function updateUser(id: string, action: "approve" | "reject") {
    updateUserMutation.mutate({ id, action });
  }

  function loadDashboard() {
    void statsQuery.refetch();
    void usersQuery.refetch();
  }

  if (statsQuery.isLoading || usersQuery.isLoading) {
    return (
      <div className="list-grid">
        <PageHeader title="Admin Control" subtitle="Monitor verification and community health." />
        <LoadingState message="Loading admin dashboard..." />
      </div>
    );
  }

  if (statsQuery.isError || usersQuery.isError) {
    return (
      <div className="list-grid">
        <PageHeader title="Admin Control" subtitle="Monitor verification and community health." />
        <ErrorState message={message || "Unable to load stats."} onRetry={loadDashboard} />
      </div>
    );
  }

  const stats = statsQuery.data;
  const users = usersQuery.data?.users ?? [];

  return (
    <div className="list-grid">
      <PageHeader title="Admin Control" subtitle="Monitor verification and community health." />
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
            {users.map((user: any) => (
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
    </div>
  );
}

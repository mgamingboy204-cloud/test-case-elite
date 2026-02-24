"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card } from "@/app/components/ui/Card";
import { Badge } from "@/app/components/ui/Badge";
import { Button } from "@/app/components/ui/Button";
import { Skeleton } from "@/app/components/ui/Skeleton";
import { ErrorState } from "@/app/components/ui/States";
import { PageHeader } from "@/app/components/ui/PageHeader";
import { Avatar } from "@/app/components/ui/Avatar";
import { useToast } from "@/app/providers";
import { apiFetch } from "@/lib/api";

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  pendingVerifications: number;
  rejectedVerifications: number;
}

interface AdminUser {
  id: string;
  name: string;
  phone: string;
  photo?: string;
  status: "PENDING" | "ACTIVE" | "REJECTED" | "BANNED";
  createdAt: string;
}

const MOCK_STATS: DashboardStats = {
  totalUsers: 1248,
  activeUsers: 936,
  pendingVerifications: 23,
  rejectedVerifications: 7,
};

const MOCK_USERS: AdminUser[] = [
  { id: "1", name: "Sarah Johnson", phone: "+1 555-0101", status: "PENDING", createdAt: "2025-12-10" },
  { id: "2", name: "Marcus Lee", phone: "+1 555-0102", status: "PENDING", createdAt: "2025-12-09" },
  { id: "3", name: "Emma Wilson", phone: "+1 555-0103", status: "ACTIVE", createdAt: "2025-12-08" },
  { id: "4", name: "James Chen", phone: "+1 555-0104", status: "REJECTED", createdAt: "2025-12-07" },
  { id: "5", name: "Olivia Davis", phone: "+1 555-0105", status: "PENDING", createdAt: "2025-12-06" },
];

export default function AdminDashboardPage() {
  const { addToast } = useToast();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(false);
    try {
      await apiFetch("/admin/dashboard");
      setStats(MOCK_STATS);
      setUsers(MOCK_USERS);
    } catch {
      setStats(MOCK_STATS);
      setUsers(MOCK_USERS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleApprove = async (userId: string) => {
    try {
      await apiFetch(`/admin/users/${userId}/approve`, { method: "POST" });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status: "ACTIVE" as const } : u))
      );
      addToast("User approved", "success");
    } catch {
      addToast("Failed to approve user", "error");
    }
  };

  const handleReject = async (userId: string) => {
    try {
      await apiFetch(`/admin/users/${userId}/reject`, { method: "POST" });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status: "REJECTED" as const } : u))
      );
      addToast("User rejected", "success");
    } catch {
      addToast("Failed to reject user", "error");
    }
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="Dashboard" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16, marginBottom: 32 }}>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} height={100} radius="var(--radius-lg)" />
          ))}
        </div>
        <Skeleton height={300} radius="var(--radius-lg)" />
      </div>
    );
  }

  if (error) return <ErrorState onRetry={fetchDashboard} />;

  const statCards = [
    { label: "Total Users", value: stats?.totalUsers ?? 0, color: "var(--primary)", bg: "var(--primary-light)" },
    { label: "Active Users", value: stats?.activeUsers ?? 0, color: "var(--success)", bg: "var(--success-light)" },
    { label: "Pending Verifications", value: stats?.pendingVerifications ?? 0, color: "var(--warning)", bg: "var(--warning-light)" },
    { label: "Rejected Verifications", value: stats?.rejectedVerifications ?? 0, color: "var(--danger)", bg: "var(--danger-light)" },
  ];

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Admin overview and quick actions" />

      {/* Stats Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 16,
          marginBottom: 32,
        }}
      >
        {statCards.map((stat) => (
          <Card key={stat.label} style={{ padding: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "var(--radius-md)",
                  background: stat.bg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 20,
                  color: stat.color,
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {stat.value > 99 ? "99+" : stat.value}
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "var(--text)", lineHeight: 1.2 }}>
                  {stat.value.toLocaleString()}
                </p>
                <p style={{ margin: "2px 0 0", fontSize: 13, color: "var(--muted)" }}>
                  {stat.label}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Recent Users Table */}
      <Card>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px 20px",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <h3 style={{ margin: 0, fontSize: 16 }}>Recent Users</h3>
          <Link
            href="/admin/users"
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "var(--primary)",
            }}
          >
            View All
          </Link>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["User", "Phone", "Status", "Joined", "Actions"].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: "left",
                      padding: "12px 20px",
                      fontSize: 12,
                      fontWeight: 600,
                      color: "var(--muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      borderBottom: "1px solid var(--border)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "12px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Avatar name={user.name} size={32} src={user.photo} />
                      <span style={{ fontWeight: 500, fontSize: 14 }}>{user.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: "12px 20px", fontSize: 14, color: "var(--muted)" }}>
                    {user.phone}
                  </td>
                  <td style={{ padding: "12px 20px" }}>
                    <Badge
                      variant={
                        user.status === "ACTIVE"
                          ? "success"
                          : user.status === "REJECTED" || user.status === "BANNED"
                          ? "danger"
                          : "warning"
                      }
                    >
                      {user.status}
                    </Badge>
                  </td>
                  <td style={{ padding: "12px 20px", fontSize: 14, color: "var(--muted)", whiteSpace: "nowrap" }}>
                    {user.createdAt}
                  </td>
                  <td style={{ padding: "12px 20px" }}>
                    {user.status === "PENDING" && (
                      <div style={{ display: "flex", gap: 8 }}>
                        <Button size="sm" onClick={() => handleApprove(user.id)}>
                          Approve
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => handleReject(user.id)}>
                          Reject
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

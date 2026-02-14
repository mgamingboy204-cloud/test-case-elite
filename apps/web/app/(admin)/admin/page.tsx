"use client";

import { useEffect, useState } from "react";
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
import { apiEndpoints } from "@/lib/apiEndpoints";

type DashboardStats = { totalUsers: number; activeUsers: number; pendingVerificationRequests: number; rejectedVerificationRequests: number };
type AdminUser = { id: string; phone: string; status: "APPROVED" | "PENDING" | "REJECTED" | "BANNED"; createdAt: string; profile?: { name?: string | null } | null; displayName?: string | null };

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
      const [dashboard, usersResult] = await Promise.all([
        apiFetch(apiEndpoints.adminDashboard) as Promise<DashboardStats>,
        apiFetch(apiEndpoints.adminUsers) as Promise<{ users: AdminUser[] }>
      ]);
      setStats(dashboard);
      setUsers((usersResult.users || []).slice(0, 8));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void fetchDashboard(); }, []);

  const updateStatus = async (userId: string, next: "approve" | "reject") => {
    try {
      await apiFetch(apiEndpoints.adminUserAction, { params: { id: userId, action: next } });
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, status: next === "approve" ? "APPROVED" : "REJECTED" } : u)));
      addToast(`User ${next}d`, "success");
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Action failed", "error");
    }
  };

  if (loading) return <div><PageHeader title="Dashboard" /> <Skeleton height={200} radius="var(--radius-lg)" /></div>;
  if (error || !stats) return <ErrorState onRetry={fetchDashboard} />;

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Admin overview and quick actions" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 16, marginBottom: 24 }}>
        <Stat label="Total Users" value={stats.totalUsers} />
        <Stat label="Active Users" value={stats.activeUsers} />
        <Stat label="Pending Verifications" value={stats.pendingVerificationRequests} />
        <Stat label="Rejected Verifications" value={stats.rejectedVerificationRequests} />
      </div>

      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
          <h3 style={{ margin: 0, fontSize: 16 }}>Recent Users</h3>
          <Link href="/admin/users" style={{ fontSize: 13, color: "var(--primary)", fontWeight: 600 }}>View all</Link>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr><Th>User</Th><Th>Phone</Th><Th>Status</Th><Th>Actions</Th></tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <Td><div style={{ display: "flex", alignItems: "center", gap: 10 }}><Avatar name={user.displayName || user.profile?.name || "User"} size={32} /><span>{user.displayName || user.profile?.name || "User"}</span></div></Td>
                  <Td>{user.phone}</Td>
                  <Td><Badge variant={user.status === "APPROVED" ? "success" : user.status === "REJECTED" || user.status === "BANNED" ? "danger" : "warning"}>{user.status}</Badge></Td>
                  <Td>
                    {user.status === "PENDING" ? (
                      <div style={{ display: "flex", gap: 8 }}>
                        <Button size="sm" onClick={() => void updateStatus(user.id, "approve")}>Approve</Button>
                        <Button size="sm" variant="danger" onClick={() => void updateStatus(user.id, "reject")}>Reject</Button>
                      </div>
                    ) : <span style={{ color: "var(--muted)", fontSize: 13 }}>No action</span>}
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return <Card style={{ padding: 18 }}><p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>{label}</p><p style={{ margin: "6px 0 0", fontSize: 26, fontWeight: 700 }}>{value.toLocaleString()}</p></Card>;
}
function Th({ children }: { children: React.ReactNode }) { return <th style={{ textAlign: "left", fontSize: 12, color: "var(--muted)", padding: "12px 16px", borderBottom: "1px solid var(--border)" }}>{children}</th>; }
function Td({ children }: { children: React.ReactNode }) { return <td style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)" }}>{children}</td>; }

"use client";

import { useEffect, useState } from "react";
import { Card } from "@/app/components/ui/Card";
import { Badge } from "@/app/components/ui/Badge";
import { Button } from "@/app/components/ui/Button";
import { Skeleton } from "@/app/components/ui/Skeleton";
import { ErrorState } from "@/app/components/ui/States";
import { PageHeader } from "@/app/components/ui/PageHeader";
import { useToast } from "@/app/providers";
import { apiFetch } from "@/lib/api";
import { apiEndpoints } from "@/lib/apiEndpoints";

type AdminUser = {
  id: string;
  phone: string;
  email?: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | "BANNED";
  onboardingStep?: string | null;
  paymentStatus?: string | null;
  videoVerificationStatus?: string | null;
  displayName?: string | null;
  profile?: { name?: string | null } | null;
};

export default function AdminUsersPage() {
  const { addToast } = useToast();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = async () => {
    setLoading(true); setError(false);
    try { const data = (await apiFetch(apiEndpoints.adminUsers)) as { users: AdminUser[] }; setUsers(data.users || []); }
    catch { setError(true); }
    finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, []);

  const mutate = async (path: string, toast: string) => {
    try { await apiFetch(apiEndpoints.adminUserAction, { params: (() => { const [, id, action] = path.match(/\/admin\/users\/(.+)\/(.+)/) ?? []; return { id, action }; })() }); addToast(toast, "success"); await load(); }
    catch (error) { addToast(error instanceof Error ? error.message : "Action failed", "error"); }
  };

  if (loading) return <div><PageHeader title="Users" /><Skeleton height={300} radius="var(--radius-lg)" /></div>;
  if (error) return <ErrorState onRetry={load} />;

  return (
    <div>
      <PageHeader title="Users" subtitle={`Total ${users.length}`} />
      <Card style={{ overflow: "auto", borderRadius: 18, padding: 0 }}>
        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
          <thead style={{ position: "sticky", top: 0, zIndex: 1, background: "var(--panel)" }}>
            <tr><Th>Name</Th><Th>Phone / Email</Th><Th>Status</Th><Th>Onboarding</Th><Th>Actions</Th></tr>
          </thead>
          <tbody>
            {users.map((user, idx) => (
              <tr key={user.id} style={{ background: idx % 2 === 0 ? "transparent" : "color-mix(in oklab, var(--panel) 84%, black)" }}>
                <Td>{user.displayName || user.profile?.name || "Member"}</Td>
                <Td>{user.phone}<div style={{ fontSize: 12, color: "var(--muted)" }}>{user.email || "No email"}</div></Td>
                <Td><Badge variant={user.status === "APPROVED" ? "success" : user.status === "PENDING" ? "warning" : "danger"}>{user.status}</Badge></Td>
                <Td><div style={{ fontSize: 12 }}>{user.onboardingStep || "-"}<br />{user.videoVerificationStatus || "-"}<br />{user.paymentStatus || "-"}</div></Td>
                <Td><div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}><Button size="sm" onClick={() => void mutate(`/admin/users/${user.id}/approve`, "User approved")}>Approve</Button><Button size="sm" variant="secondary" onClick={() => void mutate(`/admin/users/${user.id}/reject`, "User rejected")}>Reject</Button><Button size="sm" variant="danger" onClick={() => void mutate(`/admin/users/${user.id}/ban`, "User banned")}>Ban</Button></div></Td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) { return <th style={{ textAlign: "left", fontSize: 12, color: "var(--muted)", padding: "16px", borderBottom: "1px solid var(--border)" }}>{children}</th>; }
function Td({ children }: { children: React.ReactNode }) { return <td style={{ minHeight: 52, padding: "16px", borderBottom: "1px solid var(--border)", verticalAlign: "top" }}>{children}</td>; }

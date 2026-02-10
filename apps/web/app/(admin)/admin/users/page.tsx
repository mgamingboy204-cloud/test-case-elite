"use client";

import { useState, useEffect } from "react";
import { Card } from "@/app/components/ui/Card";
import { Badge } from "@/app/components/ui/Badge";
import { Button } from "@/app/components/ui/Button";
import { Input } from "@/app/components/ui/Input";
import { Textarea } from "@/app/components/ui/Textarea";
import { Skeleton } from "@/app/components/ui/Skeleton";
import { ErrorState } from "@/app/components/ui/States";
import { PageHeader } from "@/app/components/ui/PageHeader";
import { Avatar } from "@/app/components/ui/Avatar";
import { Modal } from "@/app/components/ui/Modal";
import { Tabs } from "@/app/components/ui/Tabs";
import { useToast } from "@/app/providers";
import { apiFetch } from "@/lib/api";

type UserStatus = "PENDING" | "ACTIVE" | "REJECTED" | "BANNED" | "DEACTIVATED";

interface AdminUser {
  id: string;
  name: string;
  phone: string;
  email?: string;
  photo?: string;
  status: UserStatus;
  verified: boolean;
  createdAt: string;
}

const MOCK_USERS: AdminUser[] = [
  { id: "1", name: "Sarah Johnson", phone: "+1 555-0101", email: "sarah@email.com", status: "PENDING", verified: false, createdAt: "2025-12-10" },
  { id: "2", name: "Marcus Lee", phone: "+1 555-0102", email: "marcus@email.com", status: "ACTIVE", verified: true, createdAt: "2025-12-09" },
  { id: "3", name: "Emma Wilson", phone: "+1 555-0103", status: "PENDING", verified: false, createdAt: "2025-12-08" },
  { id: "4", name: "James Chen", phone: "+1 555-0104", status: "REJECTED", verified: false, createdAt: "2025-12-07" },
  { id: "5", name: "Olivia Davis", phone: "+1 555-0105", email: "olivia@email.com", status: "ACTIVE", verified: true, createdAt: "2025-12-06" },
  { id: "6", name: "Noah Brown", phone: "+1 555-0106", status: "BANNED", verified: false, createdAt: "2025-12-05" },
  { id: "7", name: "Ava Martinez", phone: "+1 555-0107", status: "DEACTIVATED", verified: true, createdAt: "2025-12-04" },
  { id: "8", name: "Liam Garcia", phone: "+1 555-0108", email: "liam@email.com", status: "PENDING", verified: false, createdAt: "2025-12-03" },
];

const STATUS_TABS = [
  { label: "All", value: "ALL" },
  { label: "Pending", value: "PENDING" },
  { label: "Active", value: "ACTIVE" },
  { label: "Rejected", value: "REJECTED" },
  { label: "Banned", value: "BANNED" },
];

export default function AdminUsersPage() {
  const { addToast } = useToast();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  // Modal states
  const [rejectModal, setRejectModal] = useState<{ open: boolean; userId: string }>({ open: false, userId: "" });
  const [rejectReason, setRejectReason] = useState("");
  const [meetModal, setMeetModal] = useState<{ open: boolean; userId: string }>({ open: false, userId: "" });
  const [meetLink, setMeetLink] = useState("");
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; userId: string }>({ open: false, userId: "" });

  const fetchUsers = async () => {
    setLoading(true);
    setError(false);
    try {
      await apiFetch("/admin/users");
      setUsers(MOCK_USERS);
    } catch {
      setUsers(MOCK_USERS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const updateUserStatus = (userId: string, status: UserStatus) => {
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, status } : u)));
  };

  const handleApprove = async (userId: string) => {
    try {
      await apiFetch(`/admin/users/${userId}/approve`, { method: "POST" });
      updateUserStatus(userId, "ACTIVE");
      addToast("User approved", "success");
    } catch {
      addToast("Failed to approve user", "error");
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectReason.trim()) {
      addToast("Reason is required", "error");
      return;
    }
    try {
      await apiFetch(`/admin/verifications/${rejectModal.userId}/reject`, {
        method: "POST",
        body: { reason: rejectReason } as never,
      });
      updateUserStatus(rejectModal.userId, "REJECTED");
      addToast("User rejected", "success");
      setRejectModal({ open: false, userId: "" });
      setRejectReason("");
    } catch {
      addToast("Failed to reject", "error");
    }
  };

  const handleSendMeetLink = async () => {
    if (!meetLink.trim() || !meetLink.includes("meet.google.com")) {
      addToast("Please enter a valid Google Meet link", "error");
      return;
    }
    try {
      await apiFetch(`/admin/verifications/${meetModal.userId}/meet-link`, {
        method: "POST",
        body: { meetLink } as never,
      });
      addToast("Meet link sent", "success");
      setMeetModal({ open: false, userId: "" });
      setMeetLink("");
    } catch {
      addToast("Failed to send meet link", "error");
    }
  };

  const handleBan = async (userId: string) => {
    try {
      await apiFetch(`/admin/users/${userId}/ban`, { method: "POST" });
      updateUserStatus(userId, "BANNED");
      addToast("User banned", "success");
    } catch {
      addToast("Failed to ban user", "error");
    }
  };

  const handleDeactivate = async (userId: string) => {
    try {
      await apiFetch(`/admin/users/${userId}/deactivate`, { method: "POST" });
      updateUserStatus(userId, "DEACTIVATED");
      addToast("User deactivated", "success");
    } catch {
      addToast("Failed to deactivate user", "error");
    }
  };

  const handleDelete = async () => {
    try {
      await apiFetch(`/admin/users/${deleteModal.userId}/delete`, { method: "POST" });
      setUsers((prev) => prev.filter((u) => u.id !== deleteModal.userId));
      addToast("User deleted", "success");
      setDeleteModal({ open: false, userId: "" });
    } catch {
      addToast("Failed to delete user", "error");
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesFilter = filter === "ALL" || u.status === filter;
    const matchesSearch =
      !search.trim() ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.phone.includes(search);
    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div>
        <PageHeader title="Users" />
        <Skeleton height={44} radius="var(--radius-full)" style={{ marginBottom: 16 }} />
        <Skeleton height={400} radius="var(--radius-lg)" />
      </div>
    );
  }

  if (error) return <ErrorState onRetry={fetchUsers} />;

  return (
    <div>
      <PageHeader title="Users" subtitle={`${users.length} total users`} />

      {/* Filters */}
      <Tabs
        tabs={STATUS_TABS}
        active={filter}
        onChange={setFilter}
        style={{ marginBottom: 16 }}
      />

      <Input
        placeholder="Search by name or phone..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        wrapperStyle={{ marginBottom: 16 }}
      />

      {/* Users Table */}
      <Card>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["User", "Phone", "Status", "Verified", "Joined", "Actions"].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: "left",
                      padding: "12px 16px",
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
              {filteredUsers.map((user) => (
                <tr key={user.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Avatar name={user.name} size={32} src={user.photo} />
                      <div>
                        <p style={{ margin: 0, fontWeight: 500, fontSize: 14 }}>{user.name}</p>
                        {user.email && (
                          <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>{user.email}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 14, color: "var(--muted)" }}>{user.phone}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <Badge
                      variant={
                        user.status === "ACTIVE"
                          ? "success"
                          : user.status === "BANNED" || user.status === "REJECTED"
                          ? "danger"
                          : user.status === "DEACTIVATED"
                          ? "default"
                          : "warning"
                      }
                    >
                      {user.status}
                    </Badge>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    {user.verified ? (
                      <Badge variant="success">Verified</Badge>
                    ) : (
                      <Badge variant="default">No</Badge>
                    )}
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 14, color: "var(--muted)", whiteSpace: "nowrap" }}>
                    {user.createdAt}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {user.status === "PENDING" && (
                        <>
                          <Button size="sm" onClick={() => handleApprove(user.id)}>
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => setRejectModal({ open: true, userId: user.id })}
                          >
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setMeetModal({ open: true, userId: user.id })}
                          >
                            Meet
                          </Button>
                        </>
                      )}
                      {user.status === "ACTIVE" && (
                        <>
                          <Button size="sm" variant="secondary" onClick={() => handleBan(user.id)}>
                            Ban
                          </Button>
                          <Button size="sm" variant="secondary" onClick={() => handleDeactivate(user.id)}>
                            Deactivate
                          </Button>
                        </>
                      )}
                      {(user.status === "BANNED" || user.status === "DEACTIVATED") && (
                        <Button size="sm" variant="secondary" onClick={() => handleApprove(user.id)}>
                          Reactivate
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeleteModal({ open: true, userId: user.id })}
                        style={{ color: "var(--danger)" }}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    style={{ padding: 40, textAlign: "center", color: "var(--muted)", fontSize: 14 }}
                  >
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Reject Modal */}
      <Modal
        open={rejectModal.open}
        onClose={() => { setRejectModal({ open: false, userId: "" }); setRejectReason(""); }}
        title="Reject User"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <p style={{ color: "var(--muted)", fontSize: 14, margin: 0 }}>
            Please provide a reason for rejecting this user.
          </p>
          <Textarea
            label="Reason"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Enter rejection reason..."
            rows={3}
          />
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => { setRejectModal({ open: false, userId: "" }); setRejectReason(""); }}
            >
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handleRejectSubmit}>
              Reject User
            </Button>
          </div>
        </div>
      </Modal>

      {/* Meet Link Modal */}
      <Modal
        open={meetModal.open}
        onClose={() => { setMeetModal({ open: false, userId: "" }); setMeetLink(""); }}
        title="Send Meet Link"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <p style={{ color: "var(--muted)", fontSize: 14, margin: 0 }}>
            Enter a Google Meet link to send to this user for verification.
          </p>
          <Input
            label="Google Meet Link"
            value={meetLink}
            onChange={(e) => setMeetLink(e.target.value)}
            placeholder="https://meet.google.com/..."
          />
          {meetLink && !meetLink.includes("meet.google.com") && (
            <p style={{ color: "var(--danger)", fontSize: 13, margin: 0 }}>
              Must be a valid meet.google.com link
            </p>
          )}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => { setMeetModal({ open: false, userId: "" }); setMeetLink(""); }}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={handleSendMeetLink}>
              Send Link
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, userId: "" })}
        title="Delete User"
        maxWidth={400}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              background: "var(--danger-light)",
              padding: 16,
              borderRadius: "var(--radius-md)",
              textAlign: "center",
            }}
          >
            <p style={{ color: "var(--danger)", fontWeight: 600, margin: "0 0 4px" }}>
              This action cannot be undone
            </p>
            <p style={{ color: "var(--muted)", fontSize: 13, margin: 0 }}>
              The user and all their data will be permanently removed.
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <Button variant="secondary" size="sm" onClick={() => setDeleteModal({ open: false, userId: "" })}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handleDelete}>
              Delete Permanently
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

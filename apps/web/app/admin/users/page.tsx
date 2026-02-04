"use client";

import { useState } from "react";
import { apiFetch } from "../../../lib/api";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadUsers() {
    setLoading(true);
    setMessage("Loading users...");
    try {
      const data = await apiFetch("/admin/users");
      setUsers(data.users ?? []);
      setMessage("Users loaded.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load users.");
    } finally {
      setLoading(false);
    }
  }

  async function updateUser(id: string, action: "approve" | "reject" | "ban") {
    setLoading(true);
    setMessage(`${action} user...`);
    try {
      await apiFetch(`/admin/users/${id}/${action}`, { method: "POST" });
      setMessage(`User ${action}d.`);
      await loadUsers();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to update user.");
    } finally {
      setLoading(false);
    }
  }

  async function manageUser(id: string, action: "deactivate" | "delete") {
    setLoading(true);
    setMessage(`${action} user...`);
    try {
      await apiFetch(`/admin/users/${id}/${action}`, { method: "POST" });
      setMessage(`User ${action}d.`);
      await loadUsers();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to update user.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <h2>Admin Users</h2>
      <button onClick={loadUsers} disabled={loading}>
        {loading ? "Loading..." : "Load Users"}
      </button>
      {message ? <p className="message">{message}</p> : null}
      <ul className="list">
        {users.map((user) => (
          <li key={user.id} className="list-item">
            <div>
              <strong>{user.phone}</strong>
              <p className="card-subtitle">
                {user.status} • {user.onboardingStep} • {user.paymentStatus}
              </p>
              {user.deactivatedAt ? <p className="card-subtitle">Deactivated</p> : null}
            </div>
            <div className="grid two-column">
              <button onClick={() => updateUser(user.id, "approve")} disabled={loading}>
                Approve
              </button>
              <button className="secondary" onClick={() => updateUser(user.id, "reject")} disabled={loading}>
                Reject
              </button>
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
        ))}
      </ul>
    </div>
  );
}

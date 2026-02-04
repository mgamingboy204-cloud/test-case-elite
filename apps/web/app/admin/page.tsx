"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/api";
import { adminBasePath } from "../../lib/admin";

export default function AdminPage() {
  const [stats, setStats] = useState<{ totalUsers: number; activeUsers: number; pendingVerificationRequests: number } | null>(
    null
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    void loadStats();
  }, []);

  async function loadStats() {
    try {
      const data = await apiFetch<{ totalUsers: number; activeUsers: number; pendingVerificationRequests: number }>(
        "/admin/dashboard"
      );
      setStats(data);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load stats.");
    }
  }

  return (
    <div className="card">
      <h2>Admin Dashboard</h2>
      <p className="card-subtitle">Quick stats for onboarding and verification.</p>
      {stats ? (
        <div className="grid three-column">
          <div className="card muted">
            <strong>{stats.totalUsers}</strong>
            <p className="card-subtitle">Total users</p>
          </div>
          <div className="card muted">
            <strong>{stats.activeUsers}</strong>
            <p className="card-subtitle">Active members</p>
          </div>
          <div className="card muted">
            <strong>{stats.pendingVerificationRequests}</strong>
            <p className="card-subtitle">Pending verification requests</p>
          </div>
        </div>
      ) : null}
      {message ? <p className="message">{message}</p> : null}
      <ul className="list">
        <li className="list-item">
          <Link className="text-link" href={`${adminBasePath}/users`}>
            Users
          </Link>
          <span>Approve, deactivate, or delete members.</span>
        </li>
        <li className="list-item">
          <Link className="text-link" href={`${adminBasePath}/video-verifications`}>
            Verification Concierge Queue
          </Link>
          <span>Send Meet links, approve, or reject verification calls.</span>
        </li>
        <li className="list-item">
          <Link className="text-link" href={`${adminBasePath}/refunds`}>
            Refunds
          </Link>
          <span>Review refund eligibility.</span>
        </li>
        <li className="list-item">
          <Link className="text-link" href={`${adminBasePath}/reports`}>
            Reports
          </Link>
          <span>Resolve trust and safety reports.</span>
        </li>
        <li className="list-item">
          <Link className="text-link" href={`${adminBasePath}/matches`}>
            Matches
          </Link>
          <span>Review matches (placeholder).</span>
        </li>
      </ul>
    </div>
  );
}

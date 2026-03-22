"use client";

import { useState } from "react";
import { apiRequestAuth, ApiError } from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { useAuth } from "@/contexts/AuthContext";
import { useStaffRouteGate } from "@/lib/useStaffRouteGate";

export default function StaffPasswordResetPage() {
  const { logout } = useAuth();
  const { isLoading, isReady } = useStaffRouteGate("password-reset");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New password and confirmation must match.");
      return;
    }

    setSubmitting(true);
    try {
      await apiRequestAuth<{ updated: true }>(API_ENDPOINTS.auth.changePassword, {
        method: "POST",
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      });
      await logout();
    } catch (err) {
      const apiError = err instanceof ApiError ? err : null;
      setError(apiError?.message ?? (err instanceof Error ? err.message : "Unable to update password."));
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0c10] text-white/70 flex items-center justify-center">
        Checking staff access...
      </div>
    );
  }

  if (!isReady) {
    return <div className="min-h-screen bg-[#0a0c10]" />;
  }

  return (
    <div className="min-h-screen bg-[#0a0c10] text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0d1118] p-6">
        <h1 className="text-2xl font-serif tracking-wide text-white">Reset Staff Password</h1>
        <p className="mt-2 text-xs uppercase tracking-[0.18em] text-white/45">
          New staff accounts must replace the temporary password before entering the panel
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          {error ? <p className="text-sm text-red-300">{error}</p> : null}

          <div>
            <label className="block text-[10px] uppercase tracking-[0.14em] text-white/50 mb-2">Current password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              className="w-full rounded-xl border border-white/15 bg-black/20 px-3 py-3 text-sm text-white focus:outline-none focus:border-[#C89B90]/60"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-[0.14em] text-white/50 mb-2">New password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className="w-full rounded-xl border border-white/15 bg-black/20 px-3 py-3 text-sm text-white focus:outline-none focus:border-[#C89B90]/60"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-[0.14em] text-white/50 mb-2">Confirm new password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="w-full rounded-xl border border-white/15 bg-black/20 px-3 py-3 text-sm text-white focus:outline-none focus:border-[#C89B90]/60"
            />
          </div>

          <button type="submit" disabled={submitting} className="btn-vael-primary disabled:opacity-60">
            {submitting ? "Updating..." : "Save password"}
          </button>
        </form>
      </div>
    </div>
  );
}

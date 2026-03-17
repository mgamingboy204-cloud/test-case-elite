"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useAuth } from "@/contexts/AuthContext";
import { ApiError, apiRequestAuth, clearAccessToken } from "@/lib/api";
import { fetchProfile } from "@/lib/queries";
import { useStaleWhileRevalidate } from "@/lib/cache";

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const profileQuery = useStaleWhileRevalidate({ key: "profile", fetcher: fetchProfile, enabled: true });
  const profile = profileQuery.data;

  const [notifSaving, setNotifSaving] = useState(false);
  const [notifError, setNotifError] = useState("");
  const [notifMessage, setNotifMessage] = useState("");
  const [pwOpen, setPwOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState("");

  const [confirmDelete, setConfirmDelete] = useState("");
  const [deleteSaving, setDeleteSaving] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const endsAt = profile?.subscription.endsAt ? new Date(profile.subscription.endsAt) : null;
  const renewVisible = useMemo(() => {
    if (!endsAt) return false;
    const diff = Math.ceil((endsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return diff <= 7;
  }, [endsAt]);

  const saveNotifications = async (enabled: boolean) => {
    setNotifSaving(true);
    setNotifError("");
    setNotifMessage("");
    try {
      await apiRequestAuth("/api/settings/notifications", { method: "POST", body: JSON.stringify({ enabled }) });
      await profileQuery.refresh(true);
      setNotifMessage("Notifications updated.");
    } catch (err) {
      setNotifError(err instanceof Error ? err.message : "Unable to update notifications.");
    } finally {
      setNotifSaving(false);
    }
  };

  const submitPassword = async (event: FormEvent) => {
    event.preventDefault();
    if (newPassword.length < 8) return setPwError("New password must be at least 8 characters.");
    if (newPassword !== confirmPassword) return setPwError("Password confirmation does not match.");
    setPwSaving(true);
    setPwError("");
    try {
      await apiRequestAuth("/api/auth/change-password", { method: "POST", body: JSON.stringify({ currentPassword, newPassword }) });
      setPwOpen(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPwError(err instanceof ApiError ? err.message : "Unable to change password.");
    } finally {
      setPwSaving(false);
    }
  };

  const doLogout = async () => {
    await logout();
    clearAccessToken();
    window.location.href = "/login";
  };

  const deleteAccount = async () => {
    if (confirmDelete !== "DELETE") return setDeleteError("Type DELETE to continue.");
    setDeleteSaving(true);
    setDeleteError("");
    try {
      const result = await apiRequestAuth<{ deleted: boolean }>("/api/users/account", { method: "DELETE", body: JSON.stringify({ confirmation: "DELETE" }) });
      if (!result.deleted) throw new Error("Delete failed");
      await doLogout();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Unable to delete account.");
    } finally {
      setDeleteSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl uppercase tracking-[0.25em] text-primary">Settings</h1>

      <section className="border rounded-2xl p-4 space-y-2">
        <h2 className="text-sm uppercase">Account</h2>
        <p className="text-sm">Phone: {user?.phone ?? "—"}</p>
        <button onClick={() => setPwOpen(true)} className="text-sm underline">Change password</button>
      </section>

      <section className="border rounded-2xl p-4 space-y-2">
        <h2 className="text-sm uppercase">Membership</h2>
        <p className="text-sm">Plan: {profile?.subscription.paymentPlan ?? profile?.subscription.tier ?? "—"}</p>
        <p className="text-sm">Expiry: {endsAt ? endsAt.toLocaleDateString() : "—"}</p>
        {renewVisible ? <button className="btn-vael-primary">Renew membership</button> : null}
      </section>

      <section className="border rounded-2xl p-4 space-y-2">
        <h2 className="text-sm uppercase">Preferences</h2>
        <button disabled={notifSaving} onClick={() => void saveNotifications(!(profile?.settings.pushNotificationsEnabled ?? true))} className="text-sm border rounded px-3 py-2 disabled:opacity-40">
          Notifications: {(profile?.settings.pushNotificationsEnabled ?? true) ? "On" : "Off"}
        </button>
        <div className="space-x-2">
          <button onClick={() => setTheme("light")} className={`px-3 py-1 border rounded ${theme === "light" ? "border-primary" : ""}`}>Light</button>
          <button onClick={() => setTheme("dark")} className={`px-3 py-1 border rounded ${theme === "dark" ? "border-primary" : ""}`}>Dark</button>
        </div>
        {notifMessage ? <p className="text-xs text-emerald-300">{notifMessage}</p> : null}
        {notifError ? <p className="text-xs text-red-300">{notifError}</p> : null}
      </section>

      <section className="border rounded-2xl p-4 space-y-2">
        <h2 className="text-sm uppercase">Support</h2>
        <a href="mailto:support@vael.club" className="underline text-sm">Contact support</a>
        <br />
        <Link href="https://wa.me/" target="_blank" className="underline text-sm">WhatsApp support</Link>
      </section>

      <section className="border border-red-300/40 rounded-2xl p-4 space-y-2">
        <h2 className="text-sm uppercase text-red-300">Danger zone</h2>
        <button onClick={() => void doLogout()} className="border rounded px-3 py-2 text-sm">Log out</button>
        <button onClick={() => setDeleteOpen(true)} className="border border-red-300 rounded px-3 py-2 text-sm text-red-300">Delete my account</button>
      </section>

      {pwOpen ? (
        <div className="fixed inset-0 bg-black/50 grid place-items-center p-4">
          <form onSubmit={submitPassword} className="w-full max-w-sm bg-background border rounded-2xl p-4 space-y-2">
            <p className="text-sm uppercase">Change password</p>
            <input value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} type="password" placeholder="Current password" className="w-full border rounded p-2 bg-transparent" />
            <input value={newPassword} onChange={(e) => setNewPassword(e.target.value)} type="password" placeholder="New password" className="w-full border rounded p-2 bg-transparent" />
            <input value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} type="password" placeholder="Confirm new password" className="w-full border rounded p-2 bg-transparent" />
            {pwError ? <p className="text-xs text-red-300">{pwError}</p> : null}
            <button disabled={pwSaving} className="btn-vael-primary disabled:opacity-40">{pwSaving ? "Saving..." : "Save"}</button>
            <button type="button" onClick={() => setPwOpen(false)} className="text-xs underline">Cancel</button>
          </form>
        </div>
      ) : null}

      {deleteOpen ? (
        <div className="fixed inset-0 bg-black/50 grid place-items-center p-4">
          <div className="w-full max-w-sm bg-background border border-red-300/50 rounded-2xl p-4 space-y-2">
            <p className="text-sm uppercase text-red-300">Delete account</p>
            <p className="text-xs">Type DELETE to confirm.</p>
            <input value={confirmDelete} onChange={(e) => setConfirmDelete(e.target.value)} className="w-full border rounded p-2 bg-transparent" />
            {deleteError ? <p className="text-xs text-red-300">{deleteError}</p> : null}
            <button disabled={deleteSaving} onClick={() => void deleteAccount()} className="border border-red-300 text-red-300 rounded px-3 py-2 text-sm disabled:opacity-40">{deleteSaving ? "Deleting..." : "Delete my account"}</button>
            <button onClick={() => setDeleteOpen(false)} className="text-xs underline">Cancel</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

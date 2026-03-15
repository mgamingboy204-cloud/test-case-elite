"use client";

import { useAuth } from "@/contexts/AuthContext";
import { ApiError, apiRequest, setAuthToken, setOnboardingToken } from "@/lib/api";
import { fetchProfile } from "@/lib/queries";
import { useStaleWhileRevalidate } from "@/lib/cache";
import { useTheme } from "next-themes";
import { useMemo, useState } from "react";

function formatDate(value?: string | null) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function formatPlan(plan?: string | null) {
  if (plan === "ONE_MONTH") return "1 month";
  if (plan === "FIVE_MONTHS") return "5 months";
  if (plan === "TWELVE_MONTHS") return "12 months";
  return "Membership plan";
}

function formatAmount(amount?: number | null) {
  if (!amount || amount <= 0) return "Tax included";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(amount);
}

type SettingsField = "pushNotificationsEnabled" | "profileVisible" | "showOnlineStatus" | "discoverableByPremiumOnly";

export default function SettingsPage() {
  const { isAuthenticated, onboardingStep, logout, user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [savingField, setSavingField] = useState<SettingsField | null>(null);
  const [settingsMessage, setSettingsMessage] = useState<string>("");
  const [settingsError, setSettingsError] = useState<string>("");
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteReason, setDeleteReason] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [logoutPending, setLogoutPending] = useState(false);

  const profileQuery = useStaleWhileRevalidate({
    key: "profile",
    fetcher: fetchProfile,
    enabled: isAuthenticated && onboardingStep === "COMPLETED",
    staleTimeMs: 60_000
  });

  const settings = useMemo(
    () =>
      profileQuery.data?.settings ?? {
        pushNotificationsEnabled: true,
        profileVisible: true,
        showOnlineStatus: true,
        discoverableByPremiumOnly: false
      },
    [profileQuery.data]
  );

  if (!isAuthenticated || onboardingStep !== "COMPLETED") return null;

  if (profileQuery.isLoading && !profileQuery.data) {
    return (
      <div className="px-6 py-8 space-y-4">
        <h1 className="text-xl tracking-[0.35em] uppercase text-primary">Settings</h1>
        <div className="rounded-3xl border border-primary/15 p-5 animate-pulse bg-primary/[0.03] h-32" />
        <div className="rounded-3xl border border-primary/15 p-5 animate-pulse bg-primary/[0.03] h-24" />
        <div className="rounded-3xl border border-primary/15 p-5 animate-pulse bg-primary/[0.03] h-24" />
      </div>
    );
  }

  if (profileQuery.error && !profileQuery.data) {
    return (
      <div className="px-6 py-8 space-y-4">
        <h1 className="text-xl tracking-[0.35em] uppercase text-primary">Settings</h1>
        <div className="rounded-3xl border border-red-300/20 bg-red-400/5 p-5 space-y-3">
          <p className="text-sm text-red-100">We could not load your settings right now.</p>
          <button
            type="button"
            onClick={() => void profileQuery.refresh(true)}
            className="rounded-xl border border-primary/30 px-4 py-2 text-xs uppercase tracking-[0.2em] text-primary"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const profile = profileQuery.data;
  if (!profile) {
    return (
      <div className="px-6 py-8">
        <h1 className="text-xl tracking-[0.35em] uppercase text-primary">Settings</h1>
        <p className="mt-4 text-sm text-foreground/60">Settings are temporarily unavailable. Please refresh.</p>
      </div>
    );
  }

  const toggleSetting = async (key: SettingsField, value: boolean) => {
    setSavingField(key);
    setSettingsError("");
    setSettingsMessage("");

    try {
      await apiRequest("/profile/settings", {
        method: "PATCH",
        auth: true,
        body: JSON.stringify({ [key]: value })
      });
      setSettingsMessage("Settings saved.");
      await profileQuery.refresh(true);
    } catch (error) {
      setSettingsError(error instanceof ApiError ? error.message : "Unable to save this setting right now.");
    } finally {
      setSavingField(null);
    }
  };

  const onLogout = async () => {
    setLogoutPending(true);
    try {
      await logout();
    } finally {
      setLogoutPending(false);
    }
  };

  const canDelete = deleteConfirm.trim().toUpperCase() === "DELETE";

  const onDeleteAccount = async () => {
    if (!canDelete) {
      setSettingsError("Type DELETE to confirm account deletion.");
      return;
    }

    setDeleting(true);
    setSettingsError("");
    setSettingsMessage("");

    try {
      await apiRequest<{ ok: true }>("/account", {
        method: "DELETE",
        auth: true,
        body: JSON.stringify({
          confirmation: "DELETE_MY_ACCOUNT",
          reason: deleteReason.trim() || undefined
        })
      });

      setAuthToken(null);
      setOnboardingToken(null);
      localStorage.removeItem("elite_pending_phone");
      localStorage.removeItem("elite_signup_token");
      localStorage.removeItem("elite_onboarding_token");
      await logout();
    } catch (error) {
      setSettingsError(error instanceof ApiError ? error.message : "We could not process account deletion right now.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="px-6 py-8 space-y-5 pb-24">
      <header className="space-y-2">
        <h1 className="text-xl tracking-[0.35em] uppercase text-primary">Settings</h1>
        <p className="text-xs uppercase tracking-[0.2em] text-foreground/45">Private membership controls</p>
      </header>

      <section className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-background p-5 space-y-3">
        <h2 className="text-sm uppercase tracking-[0.2em] text-primary">Subscription</h2>
        <Field label="Plan" value={`${formatPlan(profile.subscription.paymentPlan)} • ${formatAmount(profile.subscription.paymentAmount)}`} />
        <Field label="Status" value={profile.subscription.status || "INACTIVE"} />
        <Field label="Start date" value={formatDate(profile.subscription.startedAt ?? profile.subscription.paidAt)} />
        <Field label="Valid until" value={formatDate(profile.subscription.endsAt)} />
        <p className="text-xs text-foreground/55">Manual renewal only. Membership never auto-renews.</p>
      </section>

      <section className="rounded-3xl border border-border/40 bg-foreground/[0.03] p-5 space-y-3">
        <h2 className="text-sm uppercase tracking-[0.2em] text-foreground/60">Notifications</h2>
        <ToggleRow
          label="App alerts"
          description="Receive updates for likes, matches, concierge coordination, and account events."
          checked={settings.pushNotificationsEnabled}
          disabled={savingField === "pushNotificationsEnabled"}
          onChange={() => void toggleSetting("pushNotificationsEnabled", !settings.pushNotificationsEnabled)}
        />
      </section>

      <section className="rounded-3xl border border-border/40 bg-foreground/[0.03] p-5 space-y-3">
        <h2 className="text-sm uppercase tracking-[0.2em] text-foreground/60">Appearance</h2>
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-primary/15 p-3">
          <div>
            <p className="text-sm text-foreground/85">Theme</p>
            <p className="text-xs text-foreground/50">Choose the app appearance for your account.</p>
          </div>
          <div className="inline-flex rounded-xl border border-primary/20 p-1 bg-background/70">
            <button
              type="button"
              onClick={() => setTheme("light")}
              className={`rounded-lg px-3 py-1.5 text-xs uppercase tracking-widest transition ${theme === "light" ? "bg-primary/20 text-primary" : "text-foreground/55"}`}
            >
              Light
            </button>
            <button
              type="button"
              onClick={() => setTheme("dark")}
              className={`rounded-lg px-3 py-1.5 text-xs uppercase tracking-widest transition ${theme === "dark" ? "bg-primary/20 text-primary" : "text-foreground/55"}`}
            >
              Dark
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-border/40 bg-foreground/[0.03] p-5 space-y-3">
        <h2 className="text-sm uppercase tracking-[0.2em] text-foreground/60">Account</h2>
        <Field label="Member ID" value={user?.id ?? "—"} />
        <Field label="Phone" value={user?.phone ?? "—"} />
        <ToggleRow
          label="Profile visibility"
          description="Allow your approved profile to appear in private discovery."
          checked={settings.profileVisible}
          disabled={savingField === "profileVisible"}
          onChange={() => void toggleSetting("profileVisible", !settings.profileVisible)}
        />
        <ToggleRow
          label="Show online status"
          description="Let matches view whether you're active in the app."
          checked={settings.showOnlineStatus}
          disabled={savingField === "showOnlineStatus"}
          onChange={() => void toggleSetting("showOnlineStatus", !settings.showOnlineStatus)}
        />
      </section>

      {settingsMessage ? <p className="text-xs text-emerald-300">{settingsMessage}</p> : null}
      {settingsError ? <p className="text-xs text-red-200">{settingsError}</p> : null}

      <section className="rounded-3xl border border-red-400/20 bg-red-500/5 p-5 space-y-4">
        <h2 className="text-sm uppercase tracking-[0.2em] text-red-200">Security</h2>

        <button
          type="button"
          disabled={logoutPending}
          onClick={() => void onLogout()}
          className="w-full rounded-xl border border-primary/30 px-4 py-3 text-sm text-primary disabled:opacity-60"
        >
          {logoutPending ? "Signing out…" : "Logout"}
        </button>

        <div className="space-y-2 rounded-2xl border border-red-300/25 p-4">
          <p className="text-sm text-red-100">Delete my account</p>
          <p className="text-xs text-red-100/70">
            This deactivates your membership, removes app access, and takes your profile out of discoverability.
          </p>
          <textarea
            rows={2}
            placeholder="Optional reason"
            value={deleteReason}
            onChange={(event) => setDeleteReason(event.target.value)}
            className="w-full rounded-xl border border-red-300/20 bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-foreground/35 focus:outline-none focus:border-red-300/40"
          />
          <input
            value={deleteConfirm}
            onChange={(event) => setDeleteConfirm(event.target.value)}
            placeholder='Type "DELETE" to confirm'
            className="w-full rounded-xl border border-red-300/20 bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-foreground/35 focus:outline-none focus:border-red-300/40"
          />
          <button
            type="button"
            onClick={() => void onDeleteAccount()}
            disabled={deleting || !canDelete}
            className="w-full rounded-xl border border-red-300/40 px-4 py-3 text-sm text-red-100 disabled:opacity-40"
          >
            {deleting ? "Processing…" : "Delete account"}
          </button>
        </div>
      </section>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-primary/15 p-3">
      <p className="text-xs uppercase tracking-[0.18em] text-foreground/50">{label}</p>
      <p className="text-sm text-foreground/85 text-right">{value || "—"}</p>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
  disabled
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onChange}
      className="w-full rounded-2xl border border-primary/15 p-3 flex items-center justify-between text-left disabled:opacity-60"
    >
      <div>
        <p className="text-sm text-foreground/85">{label}</p>
        <p className="text-xs text-foreground/50 mt-1">{description}</p>
      </div>
      <span className={`rounded-full px-3 py-1 text-[10px] tracking-[0.18em] uppercase ${checked ? "bg-primary/20 text-primary" : "bg-foreground/10 text-foreground/50"}`}>
        {checked ? "On" : "Off"}
      </span>
    </button>
  );
}

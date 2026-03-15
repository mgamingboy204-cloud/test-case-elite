"use client";

import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/api";
import { fetchProfile } from "@/lib/queries";
import { useStaleWhileRevalidate } from "@/lib/cache";
import { useMemo, useState } from "react";

export default function SettingsPage() {
  const { isAuthenticated, onboardingStep, logout } = useAuth();
  const [saving, setSaving] = useState(false);

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

  const patchSetting = async (key: keyof typeof settings, value: boolean) => {
    setSaving(true);
    try {
      await apiRequest("/profile/settings", {
        method: "PATCH",
        auth: true,
        body: JSON.stringify({ [key]: value })
      });
      await profileQuery.refresh(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="px-6 py-8 space-y-4">
      <h1 className="text-xl tracking-[0.4em] font-medium text-primary uppercase">Settings</h1>
      <p className="text-xs uppercase tracking-[0.2em] text-foreground/40">Privacy-first controls and premium account preferences.</p>

      {Object.entries(settings).map(([key, value]) => (
        <button
          key={key}
          disabled={saving}
          onClick={() => void patchSetting(key as keyof typeof settings, !Boolean(value))}
          className="w-full rounded-2xl border border-primary/20 p-4 flex items-center justify-between text-left"
        >
          <span className="text-sm text-foreground/80">{key}</span>
          <span className={`text-xs uppercase tracking-widest ${value ? "text-primary" : "text-foreground/40"}`}>{value ? "On" : "Off"}</span>
        </button>
      ))}

      <button onClick={logout} className="w-full rounded-2xl border border-red-400/30 p-4 text-red-300 text-sm">
        Sign out securely
      </button>
    </div>
  );
}

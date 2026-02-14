"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/app/components/ui/Card";
import { Button } from "@/app/components/ui/Button";
import { PageHeader } from "@/app/components/ui/PageHeader";
import { useTheme, useToast } from "@/app/providers";
import { apiFetch } from "@/lib/api";
import { clearAccessToken } from "@/lib/authToken";
import { useSession } from "@/lib/session";

export default function SettingsPage() {
  const router = useRouter();
  const { theme, toggle } = useTheme();
  const { addToast } = useToast();
  const { user } = useSession();

  const handleLogout = async () => {
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } catch {
      /* stub */
    }
    clearAccessToken();
    addToast("Logged out", "info");
    router.push("/login");
  };

  return (
    <div>
      <PageHeader title="Settings" />

      {/* Appearance */}
      <Card style={{ padding: 20, marginBottom: 16 }}>
        <h4 style={{ marginBottom: 16 }}>Appearance</h4>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 500 }}>Dark Mode</p>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--muted)" }}>
              {theme === "dark" ? "Currently on" : "Currently off"}
            </p>
          </div>
          <button
            onClick={toggle}
            style={{
              width: 52,
              height: 28,
              borderRadius: 14,
              background: theme === "dark" ? "var(--primary)" : "var(--border)",
              position: "relative",
              transition: "background 200ms ease",
              border: "none",
              cursor: "pointer",
            }}
            aria-label="Toggle dark mode"
          >
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: "50%",
                background: "#fff",
                position: "absolute",
                top: 3,
                left: theme === "dark" ? 27 : 3,
                transition: "left 200ms ease",
                boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
              }}
            />
          </button>
        </div>
      </Card>

      {/* Notifications */}
      <Card style={{ padding: 20, marginBottom: 16 }}>
        <h4 style={{ marginBottom: 16 }}>Notifications</h4>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <ToggleSetting label="New matches" desc="Get notified about new matches" defaultOn />
          <ToggleSetting label="Likes received" desc="When someone likes your profile" defaultOn />
          <ToggleSetting label="App updates" desc="Product news and feature updates" defaultOn={false} />
        </div>
      </Card>

      {/* Links */}
      <Card style={{ padding: 20, marginBottom: 16 }}>
        <h4 style={{ marginBottom: 16 }}>Account</h4>
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          <SettingLink href="/onboarding/payment" label="Membership & Billing" />
          <SettingLink href="/onboarding/video-verification" label="Verification Status" />
          <SettingLink href="/refunds" label="Refunds" />
          <SettingLink href="/report" label="Report a User" />
          {(user?.isAdmin || user?.role === "ADMIN") && <SettingLink href="/admin" label="Admin Control" />}
        </div>
      </Card>

      <Button variant="danger" fullWidth onClick={handleLogout} style={{ marginBottom: 32 }}>
        Log Out
      </Button>
    </div>
  );
}

function ToggleSetting({
  label,
  desc,
  defaultOn = true,
}: {
  label: string;
  desc: string;
  defaultOn?: boolean;
}) {
  const [on, setOn] = useState(defaultOn);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <div>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>{label}</p>
        <p style={{ margin: "2px 0 0", fontSize: 13, color: "var(--muted)" }}>{desc}</p>
      </div>
      <button
        onClick={() => setOn(!on)}
        style={{
          width: 44,
          height: 24,
          borderRadius: 12,
          background: on ? "var(--primary)" : "var(--border)",
          position: "relative",
          transition: "background 200ms ease",
          border: "none",
          cursor: "pointer",
          flexShrink: 0,
        }}
        aria-label={`Toggle ${label}`}
      >
        <div
          style={{
            width: 18,
            height: 18,
            borderRadius: "50%",
            background: "#fff",
            position: "absolute",
            top: 3,
            left: on ? 23 : 3,
            transition: "left 200ms ease",
            boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
          }}
        />
      </button>
    </div>
  );
}

function SettingLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "14px 0",
        borderBottom: "1px solid var(--border)",
        fontSize: 15,
        color: "var(--text)",
      }}
    >
      {label}
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2">
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </Link>
  );
}

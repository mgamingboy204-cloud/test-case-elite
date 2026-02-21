"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useTheme } from "@/app/providers";
import { useSession } from "@/lib/session";
import { apiFetch } from "@/lib/api";
import { BottomSheet } from "@/app/components/ui/BottomSheet";
import { Avatar } from "@/app/components/ui/Avatar";
import { BottomNav } from "@/app/components/BottomNav";
import type { ReactNode, CSSProperties } from "react";

const sidebarLinks = [
  { href: "/discover", label: "Discover", icon: "\u2738" },
  { href: "/likes", label: "Likes", icon: "\u2665" },
  { href: "/matches", label: "Matches", icon: "\u263A" },
  { href: "/profile", label: "Profile", icon: "\u263B" },
  { href: "/settings", label: "Settings", icon: "\u2699" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();
  const { user } = useSession();
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const [profileName, setProfileName] = useState<string>("");
  const [mobileSettingsOpen, setMobileSettingsOpen] = useState(false);

  useEffect(() => {
    const loadProfileMeta = async () => {
      try {
        const data = await apiFetch<any>("/profile");
        const photos = Array.isArray(data?.photos) ? data.photos : [];
        const firstPhoto = photos[0]?.url;
        setProfilePhotoUrl(typeof firstPhoto === "string" ? firstPhoto : null);
        setProfileName(String(data?.profile?.name ?? "").trim());
      } catch {
        setProfilePhotoUrl(null);
      }
    };

    void loadProfileMeta();
  }, []);

  const mobileTitle = useMemo(() => {
    if (pathname?.startsWith("/discover")) {
      return profileName || "Elite Match";
    }
    if (pathname?.startsWith("/likes")) return "Likes";
    if (pathname?.startsWith("/matches")) return "Matches";
    if (pathname?.startsWith("/profile")) return "Profile";
    return "Elite Match";
  }, [pathname, profileName]);

  const headerStyle: CSSProperties = {
    height: "var(--app-header-offset)",
    background: "var(--panel)",
    borderBottom: "1px solid var(--border)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 24px",
    position: "sticky",
    top: 0,
    zIndex: 50,
    paddingTop: "var(--app-mobile-safe-top)",
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header style={headerStyle} className="app-header">
        <Link href="/discover" style={{ fontSize: 18, fontWeight: 800, color: "var(--primary)" }}>
          Elite Match
        </Link>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button
            onClick={toggle}
            style={{
              width: 32,
              height: 32,
              borderRadius: "var(--radius-sm)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
              border: "1px solid var(--border)",
              background: "var(--panel)",
              color: "var(--text)",
            }}
            aria-label="Toggle theme"
          >
            {theme === "light" ? "\u263E" : "\u2600"}
          </button>
        </div>
      </header>

      <header className="app-mobile-header" aria-label="Mobile header">
        <Link href="/profile" aria-label="Open profile" className="app-mobile-header__avatar-link">
          <Avatar
            src={profilePhotoUrl}
            name={profileName || user?.displayName || user?.firstName || "You"}
            size={34}
            style={{ border: "1px solid var(--border)" }}
          />
        </Link>
        <div className="app-mobile-header__title" title={mobileTitle}>
          {mobileTitle}
        </div>
        <button
          className="app-mobile-header__filter-btn"
          onClick={() => {
            if (pathname?.startsWith("/discover")) {
              window.dispatchEvent(new CustomEvent("elite-open-discover-filters"));
              return;
            }
            setMobileSettingsOpen(true);
          }}
          aria-label="Open filters"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 6h16M7 12h10M10 18h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </header>

      <div style={{ flex: 1, display: "flex" }}>
        <aside
          className="app-sidebar"
          style={{
            width: 220,
            background: "var(--panel)",
            borderRight: "1px solid var(--border)",
            padding: "16px 0",
            display: "flex",
            flexDirection: "column",
            gap: 4,
            position: "sticky",
            top: "var(--app-header-offset)",
            height: "calc(100vh - var(--app-header-offset))",
            overflowY: "auto",
          }}
        >
          {sidebarLinks.map((link) => {
            const active = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 24px",
                  fontSize: 14,
                  fontWeight: active ? 600 : 400,
                  color: active ? "var(--primary)" : "var(--text)",
                  background: active ? "var(--primary-light)" : "transparent",
                  borderRight: active ? "3px solid var(--primary)" : "3px solid transparent",
                  transition: "all 150ms ease",
                }}
              >
                <span style={{ fontSize: 18 }}>{link.icon}</span>
                {link.label}
              </Link>
            );
          })}
        </aside>

        <main
          className="app-main-content"
          style={{
            flex: 1,
            minWidth: 0,
            maxWidth: 800,
            margin: "0 auto",
            padding: "0 16px",
            width: "100%",
          }}
        >
          {children}
        </main>
      </div>

      <div className="app-bottom-nav">
        <BottomNav />
      </div>

      <BottomSheet open={mobileSettingsOpen} onClose={() => setMobileSettingsOpen(false)} title="Filters & Settings">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <p style={{ color: "var(--muted)", fontSize: 14 }}>Discover-specific filters are available on the Discover screen.</p>
          <button
            onClick={toggle}
            style={{
              border: "1px solid var(--border)",
              background: "var(--surface2)",
              borderRadius: "var(--radius-md)",
              padding: "12px 14px",
              textAlign: "left",
              fontWeight: 600,
            }}
          >
            Theme: {theme === "light" ? "Light" : "Dark"}
          </button>
        </div>
      </BottomSheet>

      <style>{`
        .app-mobile-header { display: none; }
        .app-bottom-nav { display: none; }
        @media (max-width: 768px) {
          .app-header { display: none !important; }
          .app-sidebar { display: none !important; }
          .app-bottom-nav { display: block; }
          .app-main-content { padding-bottom: var(--app-bottom-nav-height); }
          .app-mobile-header {
            position: sticky;
            top: 0;
            z-index: 60;
            display: grid;
            grid-template-columns: 44px 1fr 44px;
            align-items: center;
            gap: 10px;
            padding: calc(var(--sat) + 8px) max(12px, var(--sal)) 10px max(12px, var(--sal));
            padding-right: max(12px, var(--sar));
            background: color-mix(in srgb, var(--panel) 82%, transparent);
            backdrop-filter: saturate(140%) blur(14px);
            border-bottom: 1px solid color-mix(in srgb, var(--border) 78%, transparent);
          }
          .app-mobile-header__avatar-link {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 40px;
            height: 40px;
            border-radius: 9999px;
          }
          .app-mobile-header__title {
            text-align: center;
            font-size: 17px;
            font-weight: 600;
            letter-spacing: 0.01em;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .app-mobile-header__filter-btn {
            width: 40px;
            height: 40px;
            border-radius: 9999px;
            border: 1px solid var(--border);
            background: color-mix(in srgb, var(--surface2) 78%, transparent);
            color: var(--text);
            display: inline-flex;
            align-items: center;
            justify-content: center;
          }
          .app-mobile-header__filter-btn svg {
            width: 20px;
            height: 20px;
          }
        }
      `}</style>
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../lib/api";
import { clearAccessToken } from "../../lib/authToken";
import { queryKeys } from "../../lib/queryKeys";
import { useSession } from "../../lib/session";

const baseLinks = [
  { href: "/", label: "Home" },
  { href: "/login", label: "Login" },
  { href: "/signup", label: "Sign Up" }
];

const protectedLinks = [
  { href: "/discover", label: "Discover" },
  { href: "/likes", label: "Likes" },
  { href: "/matches", label: "Matches" }
];

export default function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { status: sessionStatus, user, refresh } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  const logoutMutation = useMutation({
    mutationFn: () => apiFetch("/auth/logout", { method: "POST" }),
    onSuccess: () => {
      clearAccessToken();
    },
    onSettled: async () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.me });
      await refresh();
      setMenuOpen(false);
      router.push("/");
    }
  });

  const navLinks = useMemo(() => {
    if (sessionStatus === "logged-in" && user?.onboardingStep === "ACTIVE") {
      return protectedLinks;
    }
    return baseLinks;
  }, [sessionStatus, user?.onboardingStep]);

  const activeHref = useMemo(() => {
    if (!pathname) return "/";
    const match = navLinks.find((link) => link.href !== "/" && pathname.startsWith(link.href));
    return match?.href ?? pathname;
  }, [pathname, navLinks]);

  function handleLogout() {
    logoutMutation.mutate();
  }

  return (
    <header className="header">
      <div className="container header-inner">
        <div className="brand">
          <span className="brand-title">Elite Match MVP</span>
          <span className="brand-subtitle">Premium matchmaking in minutes</span>
        </div>
        <div className="session">
          <span className={`status-dot ${sessionStatus}`} />
          <span className="session-text">
            {sessionStatus === "loading" ? "Checking session..." : ""}
            {sessionStatus === "logged-in" ? `Hi ${user?.phone ?? "member"}` : ""}
            {sessionStatus === "logged-out" ? "Not logged in" : ""}
          </span>
          {sessionStatus === "logged-in" ? (
            <div className="profile-menu">
              <button
                className="link-button"
                onClick={() => setMenuOpen((prev) => !prev)}
                aria-expanded={menuOpen}
              >
                Profile ▾
              </button>
              {menuOpen ? (
                <div className="menu-panel">
                  <button className="menu-link" onClick={() => router.push("/profile")}>
                    Edit profile
                  </button>
                  {user?.role === "ADMIN" || user?.isAdmin ? (
                    <button className="menu-link" onClick={() => router.push("/admin")}>
                      Admin
                    </button>
                  ) : null}
                  <button className="menu-link" onClick={handleLogout} disabled={logoutMutation.isPending}>
                    {logoutMutation.isPending ? "Signing out..." : "Logout"}
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
        <nav className="nav">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={activeHref === link.href ? "nav-link active" : "nav-link"}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

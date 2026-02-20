"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../lib/api";
import { clearAccessToken } from "../../lib/authToken";
import { queryKeys } from "../../lib/queryKeys";
import { useSession } from "../../lib/session";

const baseLinks = [
  { href: "/", label: "Home" },
  { href: "/login", label: "Login" },
  { href: "/signup", label: "Sign Up" },
];

const protectedLinks = [
  { href: "/discover", label: "Discover" },
  { href: "/likes", label: "Likes" },
  { href: "/matches", label: "Matches" },
];

export default function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { status: sessionStatus, user, refresh } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const logoutMutation = useMutation({
    mutationFn: () => apiFetch("/auth/logout", { method: "POST" }),
    onSuccess: () => { clearAccessToken(); },
    onSettled: async () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.me });
      await refresh();
      setMenuOpen(false);
      router.push("/");
    },
  });

  const navLinks = useMemo(() => {
    if (sessionStatus === "logged-in" && user?.onboardingStep === "ACTIVE") {
      return protectedLinks;
    }
    return baseLinks;
  }, [sessionStatus, user?.onboardingStep]);

  const activeHref = useMemo(() => {
    if (!pathname) return "/";
    const match = navLinks.find(
      (link) => link.href !== "/" && pathname.startsWith(link.href)
    );
    return match?.href ?? pathname;
  }, [pathname, navLinks]);

  function handleLogout() {
    logoutMutation.mutate();
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-700 ${scrolled
          ? "py-2 bg-white/50 backdrop-blur-3xl border-b border-white/60 shadow-[0_8px_32px_-12px_rgba(0,0,0,0.06)]"
          : "py-4 bg-white/30 backdrop-blur-xl border-b border-white/40"
        }`}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-10 flex items-center justify-between gap-8">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3 group flex-shrink-0">
          <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary group-hover:border-primary transition-all duration-700">
            <span className="text-primary group-hover:text-white text-[10px] font-black transition-colors duration-700">✦</span>
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-serif italic text-base tracking-widest text-foreground/80 group-hover:text-primary transition-colors duration-700">
              ELITE MATCH
            </span>
            <span className="text-[8px] uppercase tracking-[0.3em] font-black text-muted-foreground/30 hidden sm:block">
              Premium Matchmaking
            </span>
          </div>
        </Link>

        {/* Divider */}
        <div className="hidden md:block w-px h-8 bg-primary/10 flex-shrink-0" />

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-6 flex-grow" aria-label="App navigation">
          {navLinks.map((link) => {
            const active = activeHref === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative text-[10px] uppercase tracking-[0.4em] font-black transition-all duration-500 group ${active ? "text-primary" : "text-muted-foreground/50 hover:text-primary"
                  }`}
              >
                {link.label}
                {active && (
                  <motion.span
                    layoutId="topnav-active-underline"
                    className="absolute -bottom-1 left-0 right-0 h-px bg-primary"
                    transition={{ type: "spring", stiffness: 500, damping: 40 }}
                  />
                )}
                <span className="absolute -bottom-1 left-0 w-0 h-px bg-primary group-hover:w-full transition-all duration-700" />
              </Link>
            );
          })}
        </nav>

        {/* Session indicator + profile menu */}
        <div className="flex items-center gap-4 flex-shrink-0">
          {sessionStatus === "loading" && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary/40 animate-pulse" />
              <span className="text-[10px] uppercase tracking-[0.3em] font-black text-muted-foreground/30 hidden sm:block">
                Authenticating
              </span>
            </div>
          )}

          {sessionStatus === "logged-out" && (
            <div className="hidden md:flex items-center gap-4">
              <Link
                href="/login"
                className="text-[10px] uppercase tracking-[0.3em] font-black text-muted-foreground/50 hover:text-primary transition-colors duration-500"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-[10px] uppercase tracking-[0.3em] font-black hover:opacity-90 hover:scale-[1.02] active:scale-95 transition-all duration-500 shadow-[0_4px_14px_-4px_rgba(232,165,178,0.5)]"
              >
                Join
              </Link>
            </div>
          )}

          {sessionStatus === "logged-in" && (
            <div className="relative" ref={dropdownRef}>
              {/* Session pill */}
              <button
                onClick={() => setMenuOpen((p) => !p)}
                aria-expanded={menuOpen}
                className="flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-white/50 border border-white/80 hover:border-primary/20 hover:bg-white/70 hover:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.06)] transition-all duration-500 group"
              >
                {/* Online dot */}
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                </span>
                <span className="text-[10px] uppercase tracking-[0.3em] font-black text-foreground/60 group-hover:text-primary transition-colors duration-500 hidden sm:block">
                  {user?.phone ?? "Member"}
                </span>
                <motion.svg
                  animate={{ rotate: menuOpen ? 180 : 0 }}
                  width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                  className="text-muted-foreground/30"
                  transition={{ duration: 0.3 }}
                >
                  <path d="m6 9 6 6 6-6" />
                </motion.svg>
              </button>

              {/* Dropdown */}
              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute right-0 top-[calc(100%+12px)] w-64 bg-white/80 backdrop-blur-3xl border border-white/60 rounded-3xl shadow-[0_40px_80px_-20px_rgba(0,0,0,0.12)] overflow-hidden"
                  >
                    {/* Header */}
                    <div className="px-6 py-5 border-b border-primary/5 bg-primary/[0.02]">
                      <p className="font-serif italic text-lg text-foreground/70 tracking-tight">
                        Your Vault
                      </p>
                      <p className="text-[9px] uppercase tracking-[0.4em] font-black text-primary/40 mt-0.5">
                        Active Session
                      </p>
                    </div>

                    {/* Menu items */}
                    <div className="flex flex-col p-3 gap-1">
                      <DropdownItem
                        label="Edit Profile"
                        icon="◎"
                        onClick={() => { router.push("/profile"); setMenuOpen(false); }}
                      />
                      <DropdownItem
                        label="Settings"
                        icon="◈"
                        onClick={() => { router.push("/settings"); setMenuOpen(false); }}
                      />
                      {(user?.role === "ADMIN" || user?.isAdmin) && (
                        <DropdownItem
                          label="Admin Portal"
                          icon="✦"
                          onClick={() => { router.push("/admin"); setMenuOpen(false); }}
                        />
                      )}
                      <div className="my-1 h-px bg-primary/5" />
                      <DropdownItem
                        label={logoutMutation.isPending ? "Signing Out…" : "Sign Out"}
                        icon="→"
                        danger
                        onClick={handleLogout}
                        disabled={logoutMutation.isPending}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function DropdownItem({
  label,
  icon,
  onClick,
  danger,
  disabled,
}: {
  label: string;
  icon: string;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-left transition-all duration-500 group disabled:opacity-50 ${danger
          ? "hover:bg-red-50 text-red-400/60 hover:text-red-400"
          : "hover:bg-primary/[0.04] text-foreground/60 hover:text-primary"
        }`}
    >
      <span className={`text-lg transition-transform duration-500 group-hover:scale-125 ${danger ? "" : "opacity-40 group-hover:opacity-100"}`}>
        {icon}
      </span>
      <span className="text-[10px] uppercase tracking-[0.3em] font-black">{label}</span>
    </button>
  );
}

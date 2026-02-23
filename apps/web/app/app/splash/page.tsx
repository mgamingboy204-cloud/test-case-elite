"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session";
import { isStandaloneDisplayMode } from "@/lib/displayMode";

export default function AppSplashPage() {
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    if (!isStandaloneDisplayMode()) {
      router.replace("/discover");
      return;
    }
    if (status === "loading") return;
    const nextPath = status === "logged-in" ? "/app/home" : "/app/get-started";
    const timer = window.setTimeout(() => {
      router.replace(nextPath);
    }, 900);
    return () => window.clearTimeout(timer);
  }, [router, status]);

  return (
    <div
      style={{
        minHeight: "100vh",
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        padding: "calc(20px + env(safe-area-inset-top, 0px)) calc(20px + env(safe-area-inset-right, 0px)) calc(20px + env(safe-area-inset-bottom, 0px)) calc(20px + env(safe-area-inset-left, 0px))",
        background: "linear-gradient(160deg, var(--bg), var(--surface2))"
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: "0.04em" }}>Elite Match</div>
        <div style={{ marginTop: 8, opacity: 0.7 }}>Loading your app…</div>
      </div>
    </div>
  );
}

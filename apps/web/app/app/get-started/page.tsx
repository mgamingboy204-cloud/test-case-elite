"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/app/components/ui/Button";
import { isStandaloneDisplayMode } from "@/lib/displayMode";
import { useSession } from "@/lib/session";

export default function AppGetStartedPage() {
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    if (!isStandaloneDisplayMode()) {
      router.replace("/login");
      return;
    }
    if (status === "logged-in") {
      router.replace("/app/home");
    }
  }, [router, status]);

  return (
    <>
      <div className="auth-shell">
        <div className="card" style={{ width: "min(92vw, 420px)", textAlign: "center", padding: 24 }}>
          <h1 style={{ marginBottom: 8 }}>Welcome to Elite Match</h1>
          <p className="card-subtitle" style={{ marginBottom: 20 }}>Sign in or create your account to continue.</p>
          <div style={{ display: "grid", gap: 10 }}>
            <Link href="/app/login"><Button fullWidth size="lg">Sign in</Button></Link>
            <Link href="/signup"><Button fullWidth size="lg" variant="secondary">Create account</Button></Link>
          </div>
        </div>
      </div>
      <style jsx>{`
        .auth-shell {
          min-height: 100vh;
          min-height: 100dvh;
          display: grid;
          place-items: center;
          padding: 20px;
        }
      `}</style>
    </>
  );
}

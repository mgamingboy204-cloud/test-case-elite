"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isStandaloneDisplayMode } from "@/lib/displayMode";

export default function AppGatewayPage() {
  const router = useRouter();

  useEffect(() => {
    if (!isStandaloneDisplayMode()) return;
    router.replace("/app/splash");
  }, [router]);

  return (
    <div className="app-gateway-shell">
      <div className="app-gateway-card">
        <h1>Open Elite Match</h1>
        <p>Install the app for the native launch flow, or continue in the browser.</p>
        <div className="app-gateway-actions">
          <Link href="/login">Sign in</Link>
          <Link href="/signup">Create account</Link>
        </div>
      </div>
      <style jsx>{`
        .app-gateway-shell {
          min-height: 100vh;
          min-height: 100dvh;
          display: grid;
          place-items: center;
          padding: 24px;
        }

        .app-gateway-card {
          width: min(92vw, 420px);
          border-radius: var(--radius-lg);
          border: 1px solid var(--border);
          padding: 24px;
          background: var(--panel);
          box-shadow: var(--shadow-sm);
        }

        h1 {
          margin: 0;
        }

        p {
          margin: 10px 0 0;
          color: var(--muted);
        }

        .app-gateway-actions {
          margin-top: 18px;
          display: flex;
          gap: 12px;
        }

        .app-gateway-actions a {
          color: var(--accent);
          font-weight: 600;
          text-decoration: none;
        }
      `}</style>
    </div>
  );
}

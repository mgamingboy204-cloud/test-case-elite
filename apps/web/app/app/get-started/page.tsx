"use client";

import Link from "next/link";
import { Button } from "@/app/components/ui/Button";

export default function AppGetStartedPage() {
  return (
    <>
      <div className="app-get-started-shell" aria-label="Get started">
        <div className="app-get-started-card">
          <h1>Welcome to Elite Match</h1>
          <p>Get started to create your profile, verify, and begin discovering high-intent matches.</p>
          <div className="app-get-started-actions">
            <Link href="/signup">
              <Button fullWidth size="lg">Create account</Button>
            </Link>
            <Link href="/app/login">
              <Button fullWidth size="lg" variant="secondary">Sign in</Button>
            </Link>
          </div>
        </div>
      </div>
      <style jsx>{`
        .app-get-started-shell {
          min-height: 100vh;
          min-height: 100dvh;
          display: grid;
          place-items: center;
          padding: calc(20px + env(safe-area-inset-top, 0px)) calc(20px + env(safe-area-inset-right, 0px)) calc(20px + env(safe-area-inset-bottom, 0px)) calc(20px + env(safe-area-inset-left, 0px));
          background: linear-gradient(160deg, var(--bg), var(--surface2));
        }

        .app-get-started-card {
          width: min(92vw, 420px);
          border: 1px solid color-mix(in srgb, var(--border) 80%, var(--accent) 20%);
          border-radius: var(--radius-lg);
          padding: 24px;
          background: color-mix(in srgb, var(--panel) 90%, transparent);
          box-shadow: var(--shadow-md);
          text-align: center;
        }

        .app-get-started-card h1 {
          margin: 0 0 8px;
        }

        .app-get-started-card p {
          margin: 0 0 20px;
          color: var(--muted);
        }

        .app-get-started-actions {
          display: grid;
          gap: 10px;
        }
      `}</style>
    </>
  );
}

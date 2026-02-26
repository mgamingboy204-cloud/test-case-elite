"use client";

import { useEffect } from "react";
import { Button } from "@/app/components/ui/Button";

export default function DiscoverError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[discover] render error", error);
  }, [error]);

  return (
    <div style={{ minHeight: "100%", height: "100%", display: "grid", placeItems: "center", padding: "24px" }}>
      <div className="card" style={{ maxWidth: 420, width: "100%", textAlign: "center" }}>
        <h2 style={{ marginBottom: 8 }}>Discover hit a temporary issue</h2>
        <p className="card-subtitle" style={{ marginBottom: 16 }}>
          We couldn't render this card feed right now. Try again without leaving the app.
        </p>
        <Button onClick={reset} fullWidth>
          Retry Discover
        </Button>
      </div>
    </div>
  );
}

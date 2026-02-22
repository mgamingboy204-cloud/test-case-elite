"use client";

import { useEffect } from "react";

type RouteErrorBoundaryProps = {
  error: Error & { digest?: string };
  reset: () => void;
  title: string;
  description: string;
};

export default function RouteErrorBoundary({ error, reset, title, description }: RouteErrorBoundaryProps) {
  useEffect(() => {
    console.error("[route-error-boundary]", { message: error.message, digest: error.digest });
  }, [error]);

  return (
    <div className="card" style={{ marginTop: 24 }}>
      <h2>{title}</h2>
      <p className="card-subtitle">{description}</p>
      <button type="button" className="btn primary" onClick={reset} style={{ marginTop: 12 }}>
        Try again
      </button>
    </div>
  );
}

"use client";

import RouteErrorBoundary from "@/app/components/RouteErrorBoundary";

export default function AppRoutesError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <RouteErrorBoundary
      error={error}
      reset={reset}
      title="App section temporarily unavailable"
      description="We hit a problem while loading this page. Your session is still active."
    />
  );
}

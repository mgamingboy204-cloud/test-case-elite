"use client";

import RouteErrorBoundary from "@/app/components/RouteErrorBoundary";

export default function AdminRoutesError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <RouteErrorBoundary
      error={error}
      reset={reset}
      title="Admin tools are temporarily unavailable"
      description="The rest of the app is still available while we recover this admin view."
    />
  );
}

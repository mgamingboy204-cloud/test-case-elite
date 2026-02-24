"use client";

import RouteErrorBoundary from "@/app/components/RouteErrorBoundary";

export default function AuthRoutesError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <RouteErrorBoundary
      error={error}
      reset={reset}
      title="Sign-in flow hit an issue"
      description="Please retry. If this keeps happening, refresh the page and try again."
    />
  );
}

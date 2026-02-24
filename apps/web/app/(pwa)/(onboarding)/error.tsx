"use client";

import RouteErrorBoundary from "@/app/components/RouteErrorBoundary";

export default function OnboardingRoutesError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <RouteErrorBoundary
      error={error}
      reset={reset}
      title="Onboarding encountered an issue"
      description="Retry to continue your onboarding steps without leaving the flow."
    />
  );
}

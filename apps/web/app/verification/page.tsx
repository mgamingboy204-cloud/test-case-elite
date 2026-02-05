"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function VerificationPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/onboarding/video-verification");
  }, [router]);

  return (
    <div className="public-shell">
      <div className="card">
        <h2>Redirecting...</h2>
        <p className="card-subtitle">Verification has moved to onboarding.</p>
      </div>
    </div>
  );
}

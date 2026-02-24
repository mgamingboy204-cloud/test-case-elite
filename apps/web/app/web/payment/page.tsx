"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PaymentRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/web/onboarding/payment");
  }, [router]);

  return (
    <div className="public-shell">
      <div className="card">
        <h2>Redirecting...</h2>
        <p className="card-subtitle">Payment is managed in onboarding.</p>
      </div>
    </div>
  );
}

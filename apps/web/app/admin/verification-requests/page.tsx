"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminVerificationRequestsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/video-verifications");
  }, [router]);

  return (
    <div className="card">
      <h2>Redirecting...</h2>
      <p className="card-subtitle">Verification requests are managed in the concierge queue.</p>
    </div>
  );
}

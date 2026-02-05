"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MatchesRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/matches");
  }, [router]);

  return (
    <div className="card">
      <h2>Redirecting...</h2>
      <p className="card-subtitle">Matches are now available at /matches.</p>
    </div>
  );
}

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MatchesPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/app/matches");
  }, [router]);

  return (
    <div className="card">
      <h2>Redirecting...</h2>
      <p className="card-subtitle">Matches are now in the /app shell.</p>
    </div>
  );
}

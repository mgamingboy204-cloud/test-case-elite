"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function MatchDetailRedirectPage() {
  const params = useParams();
  const matchId = params?.id as string;
  const router = useRouter();

  useEffect(() => {
    if (matchId) {
      router.replace(`/matches/${matchId}`);
    }
  }, [matchId, router]);

  return (
    <div className="card">
      <h2>Redirecting...</h2>
      <p className="card-subtitle">Match details now live at /matches.</p>
    </div>
  );
}

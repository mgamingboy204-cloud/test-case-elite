"use client";

import { useParams } from "next/navigation";
import { LegacyRedirectPage } from "@/app/components/LegacyRedirectPage";

export default function MatchDetailRedirectPage() {
  const params = useParams<{ id: string }>();
  const matchId = params?.id;
  const destination = matchId ? `/matches/${matchId}` : "/matches";

  return (
    <LegacyRedirectPage
      to={destination}
      title="Redirecting to match details"
      description="Match detail routes are now served from /matches/[id]."
    />
  );
}

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card } from "@/app/components/ui/Card";
import { Avatar } from "@/app/components/ui/Avatar";
import { Badge } from "@/app/components/ui/Badge";
import { Skeleton } from "@/app/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/app/components/ui/States";
import { PageHeader } from "@/app/components/ui/PageHeader";
import { apiFetch } from "@/lib/api";
import { apiEndpoints } from "@/lib/apiEndpoints";

interface Match {
  id: string;
  name: string;
  photo: string;
  status: "PENDING" | "CONSENTED" | "PHONE_EXCHANGE_READY" | "DECLINED";
}

type MatchesResponse = {
  matches: Array<{
    id: string;
    consentStatus: Match["status"];
    user: {
      name: string;
      primaryPhotoUrl?: string | null;
    };
  }>;
};

export default function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchMatches = async () => {
    setLoading(true);
    setError(false);
    try {
      const data = (await apiFetch(apiEndpoints.matches)) as MatchesResponse;
      setMatches(
        (data.matches ?? []).map((match) => ({
          id: match.id,
          name: match.user?.name || "Member",
          photo: match.user?.primaryPhotoUrl || "/placeholder.svg",
          status: match.consentStatus || "PENDING",
        }))
      );
    } catch {
      setError(true);
      setMatches([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  if (loading) {
    return (
      <div>
        <PageHeader title="Matches" />
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[1, 2, 3].map((i) => <Skeleton key={i} height={80} radius="var(--radius-lg)" />)}
        </div>
      </div>
    );
  }

  if (error) return <ErrorState onRetry={fetchMatches} />;

  return (
    <div>
      <PageHeader title="Matches" subtitle={`${matches.length} matches`} />
      {matches.length === 0 ? (
        <EmptyState title="No matches yet" description="Start swiping to find your first match!" action={{ label: "Discover", onClick: () => (window.location.href = "/discover") }} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {matches.map((match) => (
            <Link key={match.id} href={`/matches/${match.id}`}>
              <Card className="fade-in" style={{ display: "flex", alignItems: "center", padding: 16, gap: 16, cursor: "pointer" }}>
                <Avatar src={match.photo} name={match.name} size={56} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <h4 style={{ margin: 0, fontSize: 16 }}>{match.name}</h4>
                    <Badge variant={match.status === "PHONE_EXCHANGE_READY" ? "success" : match.status === "DECLINED" ? "danger" : "warning"} style={{ fontSize: 10 }}>
                      {match.status}
                    </Badge>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

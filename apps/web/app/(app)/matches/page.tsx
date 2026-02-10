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

type MatchesResponse = { matches: Array<{ id: string; createdAt: string; consentStatus: string; user: { id: string; name: string; primaryPhotoUrl?: string | null; }; }>; };

interface Match {
  id: string;
  name: string;
  photo: string;
  lastActive: string;
  status: "PENDING" | "ACTIVE" | "EXPIRED";
}

export default function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchMatches = async () => {
    setLoading(true);
    setError(false);
    try {
      const response = await apiFetch<MatchesResponse>("/matches");
      setMatches(
        response.matches.map((m) => ({
          id: m.id,
          name: m.user.name,
          photo: m.user.primaryPhotoUrl || `/placeholder.svg`,
          lastActive: new Date(m.createdAt).toLocaleDateString(),
          status: m.consentStatus === "DECLINED" ? "EXPIRED" : m.consentStatus === "PHONE_EXCHANGE_READY" ? "ACTIVE" : "PENDING",
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
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} height={80} radius="var(--radius-lg)" />
          ))}
        </div>
      </div>
    );
  }

  if (error) return <ErrorState onRetry={fetchMatches} />;

  return (
    <div>
      <PageHeader
        title="Matches"
        subtitle={`${matches.length} matches`}
      />

      {matches.length === 0 ? (
        <EmptyState
          title="No matches yet"
          description="Start swiping to find your first match!"
          action={{ label: "Discover", onClick: () => window.location.href = "/discover" }}
          icon={
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.5">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          }
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {matches.map((match) => (
            <Link key={match.id} href={`/matches/${match.id}`}>
              <Card
                className="fade-in"
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: 16,
                  gap: 16,
                  cursor: "pointer",
                }}
              >
                <Avatar src={match.photo} name={match.name} size={56} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <h4 style={{ margin: 0, fontSize: 16 }}>{match.name}</h4>
                    <Badge
                      variant={match.status === "ACTIVE" ? "success" : "warning"}
                      style={{ fontSize: 10 }}
                    >
                      {match.status}
                    </Badge>
                  </div>
                  <p style={{ color: "var(--muted)", fontSize: 13, margin: 0 }}>
                    Active {match.lastActive}
                  </p>
                </div>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--muted)"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

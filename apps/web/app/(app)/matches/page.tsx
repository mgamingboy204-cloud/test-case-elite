"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Card } from "@/app/components/ui/Card";
import { Avatar } from "@/app/components/ui/Avatar";
import { Badge } from "@/app/components/ui/Badge";
import { Skeleton } from "@/app/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/app/components/ui/States";
import { PageHeader } from "@/app/components/ui/PageHeader";
import { ApiError, apiFetch } from "@/lib/api";
import { useSession } from "@/lib/session";

type MatchStatus = "PENDING" | "CONSENTED" | "PHONE_EXCHANGE_READY" | "DECLINED";

interface Match {
  id: string;
  name: string;
  photo: string;
  createdAtLabel: string;
  city: string | null;
  profession: string | null;
  status: MatchStatus;
  phoneExchangeReady: boolean;
}

function toStatusVariant(status: MatchStatus) {
  if (status === "DECLINED") return "danger" as const;
  if (status === "PHONE_EXCHANGE_READY") return "success" as const;
  if (status === "CONSENTED") return "success" as const;
  return "warning" as const;
}

function toStatusLabel(status: MatchStatus) {
  if (status === "PHONE_EXCHANGE_READY") return "Numbers Ready";
  if (status === "CONSENTED") return "Mutual Consent";
  if (status === "DECLINED") return "Declined";
  return "Pending Consent";
}

export default function MatchesPage() {
  const { status } = useSession();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewState, setViewState] = useState<"idle" | "error" | "unauthenticated">("idle");

  const pendingCount = useMemo(
    () => matches.filter((match) => match.status === "PENDING" || match.status === "CONSENTED").length,
    [matches]
  );

  const fetchMatches = async () => {
    if (status !== "logged-in") {
      setLoading(false);
      setViewState("unauthenticated");
      setMatches([]);
      return;
    }

    setLoading(true);
    setViewState("idle");
    try {
      const data = await apiFetch<any>("/matches", { retryOnUnauthorized: true });
      const rows = Array.isArray(data?.matches) ? data.matches : [];
      const mapped: Match[] = rows.map((row: any) => ({
        id: row.id,
        name: row.user?.name ?? "Member",
        photo: row.user?.primaryPhotoUrl ?? "",
        createdAtLabel: row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "recently",
        city: row.user?.city ?? null,
        profession: row.user?.profession ?? null,
        status: row.consentStatus,
        phoneExchangeReady: Boolean(row.phoneExchangeReady),
      }));
      setMatches(mapped);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setViewState("unauthenticated");
      } else {
        setViewState("error");
      }
      setMatches([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, [status]);

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

  if (viewState === "unauthenticated") {
    return (
      <EmptyState
        title="Session expired"
        description="Please sign in again to view your matches."
        action={{ label: "Go to login", onClick: () => window.location.assign("/login") }}
      />
    );
  }

  if (viewState === "error") return <ErrorState onRetry={fetchMatches} />;

  return (
    <div>
      <PageHeader
        title="Matches"
        subtitle={`${matches.length} total · ${pendingCount} awaiting final exchange`}
      />

      {matches.length === 0 ? (
        <EmptyState
          title="No matches yet"
          description="Keep discovering profiles and mutual likes will appear here."
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
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <h4 style={{ margin: 0, fontSize: 16 }}>{match.name}</h4>
                    <Badge
                      variant={toStatusVariant(match.status)}
                      style={{ fontSize: 10 }}
                    >
                      {toStatusLabel(match.status)}
                    </Badge>
                  </div>
                  <p style={{ color: "var(--muted)", fontSize: 13, margin: 0 }}>
                    {[match.city, match.profession].filter(Boolean).join(" · ") || "Profile details available in match"}
                  </p>
                  <p style={{ color: "var(--muted)", fontSize: 12, margin: "4px 0 0" }}>
                    Matched {match.createdAtLabel}
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

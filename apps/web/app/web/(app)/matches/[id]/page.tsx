"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/app/components/ui/Card";
import { Avatar } from "@/app/components/ui/Avatar";
import { Badge } from "@/app/components/ui/Badge";
import { Button } from "@/app/components/ui/Button";
import LoadingState from "@/app/components/ui/LoadingState";
import { ErrorState, EmptyState } from "@/app/components/ui/States";
import { PageHeader } from "@/app/components/ui/PageHeader";
import { useToast } from "@/app/providers";
import { apiFetch } from "@/lib/api";

type ConsentResponse = "YES" | "NO";
type ConsentStatus = "PENDING" | "CONSENTED" | "PHONE_EXCHANGE_READY" | "DECLINED";

type MatchData = {
  id: string;
  createdAt: string;
  consentStatus: ConsentStatus;
  phoneExchangeReady: boolean;
  consents: { userId: string; response: ConsentResponse; respondedAt?: string }[];
  user: {
    id: string;
    name: string;
    city: string | null;
    profession: string | null;
    primaryPhotoUrl: string | null;
  };
};

function statusBadge(status: ConsentStatus) {
  if (status === "PHONE_EXCHANGE_READY") return { label: "Numbers Ready", variant: "success" as const };
  if (status === "CONSENTED") return { label: "Mutual Consent", variant: "success" as const };
  if (status === "DECLINED") return { label: "Declined", variant: "danger" as const };
  return { label: "Pending Consent", variant: "warning" as const };
}

export default function MatchDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { addToast } = useToast();

  const matchId = String(params.id);

  const [match, setMatch] = useState<MatchData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [actionLoading, setActionLoading] = useState<ConsentResponse | null>(null);
  const [phonesLoading, setPhonesLoading] = useState(false);
  const [phoneMap, setPhoneMap] = useState<Record<string, string> | null>(null);

  const fetchMatch = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await apiFetch<{ matches: MatchData[] }>("/matches");
      const found = Array.isArray(data?.matches) ? data.matches.find((item) => item.id === matchId) ?? null : null;
      setMatch(found);
      if (!found) {
        setPhoneMap(null);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [matchId]);

  useEffect(() => {
    void fetchMatch();
  }, [fetchMatch]);

  const unlockPhones = useCallback(async () => {
    if (!match) return;
    setPhonesLoading(true);
    try {
      const data = await apiFetch<{ users: { id: string; phone: string }[] }>(`/phone-unlock/${match.id}`);
      const mapped: Record<string, string> = {};
      for (const item of data.users ?? []) {
        mapped[item.id] = item.phone;
      }
      setPhoneMap(mapped);
      addToast("Phone numbers unlocked.", "success");
    } catch {
      addToast("Numbers are not available yet.", "info");
    } finally {
      setPhonesLoading(false);
    }
  }, [match, addToast]);

  useEffect(() => {
    if (match?.phoneExchangeReady) {
      void unlockPhones();
    }
  }, [match?.phoneExchangeReady, unlockPhones]);

  const handleConsent = async (response: ConsentResponse) => {
    setActionLoading(response);
    try {
      const consentResult = await apiFetch<{ phoneExchangeReady?: boolean }>("/consent/respond", {
        method: "POST",
        body: { matchId, response } as never,
      });
      if (response === "NO") {
        addToast("You declined this match.", "info");
        router.push("/web/matches");
        return;
      }
      addToast("Consent recorded.", "success");
      await fetchMatch();
      if (consentResult.phoneExchangeReady) {
        await unlockPhones();
      }
    } catch {
      addToast("Action failed", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const badge = statusBadge(match?.consentStatus ?? "PENDING");
  const profileLine = useMemo(
    () => [match?.user.city, match?.user.profession].filter(Boolean).join(" · "),
    [match?.user.city, match?.user.profession]
  );

  if (loading) {
    return <LoadingState message="Loading match details..." />;
  }

  if (error) {
    return <ErrorState onRetry={fetchMatch} />;
  }

  if (!match) {
    return (
      <EmptyState
        title="Match not found"
        description="This match may no longer exist or you may not have access."
        action={{ label: "Back to Matches", onClick: () => router.push("/web/matches") }}
      />
    );
  }

  const otherPhone = phoneMap?.[match.user.id] ?? null;

  return (
    <div className="fade-in" style={{ padding: "12px 0 24px" }}>
      <PageHeader title={match.user.name} subtitle={`Matched ${new Date(match.createdAt).toLocaleString()}`} />

      <Card style={{ padding: 24, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Avatar src={match.user.primaryPhotoUrl ?? ""} name={match.user.name} size={72} />
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <h2 style={{ margin: 0 }}>{match.user.name}</h2>
              <Badge variant={badge.variant}>{badge.label}</Badge>
            </div>
            <p style={{ color: "var(--muted)", fontSize: 14, margin: 0 }}>{profileLine || "Details available on profile"}</p>
          </div>
        </div>
      </Card>

      <Card style={{ padding: 24, marginBottom: 16 }}>
        <h4 style={{ marginTop: 0, marginBottom: 12 }}>Number Exchange Consent</h4>
        {match.consentStatus === "DECLINED" ? (
          <p style={{ margin: 0, color: "var(--muted)" }}>One user declined number sharing for this match.</p>
        ) : otherPhone ? (
          <div style={{ background: "var(--success-light)", borderRadius: "var(--radius-md)", padding: 16 }}>
            <p style={{ fontWeight: 600, color: "var(--success)", margin: "0 0 4px" }}>Number unlocked</p>
            <p style={{ margin: 0, color: "var(--muted)" }}>{otherPhone}</p>
          </div>
        ) : (
          <>
            <p style={{ color: "var(--muted)", fontSize: 14, marginTop: 0 }}>
              Both people must press “Share My Number” before numbers can be revealed.
            </p>
            <div style={{ display: "flex", gap: 12 }}>
              <Button variant="secondary" fullWidth loading={actionLoading === "NO"} onClick={() => handleConsent("NO")}>
                Decline
              </Button>
              <Button fullWidth loading={actionLoading === "YES" || phonesLoading} onClick={() => handleConsent("YES")}>
                Share My Number
              </Button>
            </div>
          </>
        )}
      </Card>

      <Button variant="ghost" fullWidth onClick={() => router.push("/web/matches")}>Back to Matches</Button>
    </div>
  );
}

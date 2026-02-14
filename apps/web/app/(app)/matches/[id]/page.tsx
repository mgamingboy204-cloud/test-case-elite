"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/app/components/ui/Card";
import { Avatar } from "@/app/components/ui/Avatar";
import { Badge } from "@/app/components/ui/Badge";
import { Button } from "@/app/components/ui/Button";
import { useToast } from "@/app/providers";
import { apiFetch } from "@/lib/api";
import { apiEndpoints } from "@/lib/apiEndpoints";

type MatchRecord = {
  id: string;
  consentStatus: "PENDING" | "CONSENTED" | "PHONE_EXCHANGE_READY" | "DECLINED";
  user: { id: string; name: string; city?: string | null; profession?: string | null; primaryPhotoUrl?: string | null };
};

export default function MatchDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [match, setMatch] = useState<MatchRecord | null>(null);
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);

  const matchId = params.id as string;

  const consentGiven = useMemo(
    () => Boolean(phoneNumber) || match?.consentStatus === "PHONE_EXCHANGE_READY",
    [phoneNumber, match?.consentStatus]
  );

  const loadMatch = async () => {
    try {
      const data = (await apiFetch(apiEndpoints.matches)) as { matches: MatchRecord[] };
      setMatch(data.matches.find((entry) => entry.id === matchId) ?? null);
    } catch {
      addToast("Failed to load match.", "error");
    }
  };

  useEffect(() => {
    void loadMatch();
  }, [matchId]);

  useEffect(() => {
    if (!consentGiven) return;
    void (async () => {
      try {
        const unlock = (await apiFetch(apiEndpoints.phoneUnlock, { params: { matchId } })) as { users: Array<{ id: string; phone: string }> };
        setPhoneNumber(unlock.users[0]?.phone ?? null);
      } catch {
        // ignore until both users approve
      }
    })();
  }, [consentGiven, matchId]);

  const handleConsent = async (response: "YES" | "NO") => {
    setLoading(true);
    try {
      await apiFetch(apiEndpoints.consentRespond, { body: { matchId, response } as never });
      if (response === "YES") {
        await loadMatch();
        addToast("Consent recorded.", "success");
      } else {
        addToast("Declined", "info");
        router.push("/matches");
      }
    } catch {
      addToast("Action failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in" style={{ padding: "24px 0" }}>
      <Card style={{ padding: 28, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
          <Avatar src={match?.user?.primaryPhotoUrl || "/placeholder.svg"} name={match?.user?.name || "Match"} size={72} />
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h2 style={{ margin: 0 }}>{match?.user?.name || "Match"}</h2>
              <Badge variant="success">Matched</Badge>
            </div>
            <p style={{ color: "var(--muted)", fontSize: 14, marginTop: 4 }}>
              {match?.user?.city || ""} {match?.user?.profession ? `· ${match.user.profession}` : ""}
            </p>
          </div>
        </div>
      </Card>

      <Card style={{ padding: 24, marginBottom: 16 }}>
        <h4 style={{ marginBottom: 12 }}>{consentGiven ? "Numbers Unlocked" : "Exchange Numbers"}</h4>
        {consentGiven ? (
          <div style={{ background: "var(--success-light)", borderRadius: "var(--radius-md)", padding: 20, textAlign: "center" }}>
            <p style={{ fontWeight: 600, color: "var(--success)", marginBottom: 4 }}>Contact Shared</p>
            <p style={{ color: "var(--muted)", fontSize: 14, margin: 0 }}>{phoneNumber || "Waiting for other member approval."}</p>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 12 }}>
            <Button variant="secondary" fullWidth loading={loading} onClick={() => handleConsent("NO")}>Decline</Button>
            <Button fullWidth loading={loading} onClick={() => handleConsent("YES")}>Share My Number</Button>
          </div>
        )}
      </Card>
    </div>
  );
}

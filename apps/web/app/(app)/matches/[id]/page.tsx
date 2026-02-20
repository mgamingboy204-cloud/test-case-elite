"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/app/components/ui/Card";
import { Avatar } from "@/app/components/ui/Avatar";
import { Badge } from "@/app/components/ui/Badge";
import { Button } from "@/app/components/ui/Button";
import { useToast } from "@/app/providers";
import { apiFetch } from "@/lib/api";

export default function MatchDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);

  const matchId = String(params.id);

  const handleConsent = async (response: "YES" | "NO") => {
    setLoading(true);
    try {
      await apiFetch("/consent/respond", {
        method: "POST",
        body: { matchId, response } as never,
      });
      if (response === "YES") {
        setConsentGiven(true);
        addToast("Consent given! Numbers exchanged.", "success");
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
      {/* Profile summary */}
      <Card style={{ padding: 28, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
          <Avatar
            src={`https://picsum.photos/seed/${matchId}/200/200`}
            name="Match"
            size={72}
          />
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h2 style={{ margin: 0 }}>Sophia Rao</h2>
              <Badge variant="success">Verified</Badge>
            </div>
            <p style={{ color: "var(--muted)", fontSize: 14, marginTop: 4 }}>
              27 &middot; Mumbai &middot; Designer
            </p>
          </div>
        </div>

        <p style={{ fontSize: 15, lineHeight: 1.6, color: "var(--text)", marginBottom: 16 }}>
          {"Coffee addict, art lover, and weekend hiker. Looking for someone who enjoys deep conversations and spontaneous adventures."}
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {["Travel", "Coffee", "Art", "Hiking", "Music"].map((tag) => (
            <span
              key={tag}
              style={{
                padding: "4px 12px",
                fontSize: 13,
                background: "var(--bg)",
                borderRadius: "var(--radius-full)",
                color: "var(--muted)",
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      </Card>

      {/* Conversation teaser */}
      <Card style={{ padding: 24, marginBottom: 16 }}>
        <h4 style={{ marginBottom: 16 }}>Conversation</h4>
        <div
          style={{
            background: "var(--bg)",
            borderRadius: "var(--radius-md)",
            padding: 20,
            textAlign: "center",
          }}
        >
          <p style={{ color: "var(--muted)", fontSize: 14, margin: 0 }}>
            Direct messaging coming soon. For now, exchange numbers via consent below.
          </p>
        </div>
      </Card>

      {/* Consent / Number exchange */}
      <Card style={{ padding: 24, marginBottom: 16 }}>
        <h4 style={{ marginBottom: 12 }}>
          {consentGiven ? "Numbers Unlocked" : "Exchange Numbers"}
        </h4>

        {consentGiven ? (
          <div
            style={{
              background: "var(--success-light)",
              borderRadius: "var(--radius-md)",
              padding: 20,
              textAlign: "center",
            }}
          >
            <p style={{ fontWeight: 600, color: "var(--success)", marginBottom: 4 }}>
              Contact Shared
            </p>
            <p style={{ color: "var(--muted)", fontSize: 14, margin: 0 }}>
              +91 98765 43210
            </p>
          </div>
        ) : (
          <>
            <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 16 }}>
              Both users must consent to share contact information.
            </p>
            <div style={{ display: "flex", gap: 12 }}>
              <Button
                variant="secondary"
                fullWidth
                loading={loading}
                onClick={() => handleConsent("NO")}
              >
                Decline
              </Button>
              <Button
                fullWidth
                loading={loading}
                onClick={() => handleConsent("YES")}
              >
                Share My Number
              </Button>
            </div>
          </>
        )}
      </Card>

      <button
        onClick={() => router.push("/matches")}
        style={{
          display: "block",
          width: "100%",
          textAlign: "center",
          color: "var(--muted)",
          fontSize: 14,
          padding: 12,
        }}
      >
        Back to Matches
      </button>
    </div>
  );
}

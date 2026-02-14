"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/app/components/ui/Card";
import { Button } from "@/app/components/ui/Button";
import { Badge } from "@/app/components/ui/Badge";
import { Skeleton } from "@/app/components/ui/Skeleton";
import { ErrorState } from "@/app/components/ui/States";
import { useToast } from "@/app/providers";
import { apiFetch } from "@/lib/api";
import { useSession } from "@/lib/session";

type VStatus = "NOT_REQUESTED" | "REQUESTED" | "IN_PROGRESS" | "COMPLETED" | "REJECTED";

const statusConfig: Record<VStatus, { label: string; variant: "default" | "primary" | "success" | "danger" | "warning"; desc: string }> = {
  NOT_REQUESTED: { label: "Not Started", variant: "default", desc: "Complete a quick video call to verify your identity." },
  REQUESTED: { label: "Requested", variant: "warning", desc: "Your verification request is in the queue. We'll contact you soon." },
  IN_PROGRESS: { label: "In Progress", variant: "primary", desc: "Your verification is being processed." },
  COMPLETED: { label: "Verified", variant: "success", desc: "Your identity has been verified. You can proceed!" },
  REJECTED: { label: "Rejected", variant: "danger", desc: "Your verification was not approved. Please contact support." },
};

const validStatuses: VStatus[] = ["NOT_REQUESTED", "REQUESTED", "IN_PROGRESS", "COMPLETED", "REJECTED"];

function normalizeStatus(value?: string | null): VStatus {
  return validStatuses.includes(value as VStatus) ? (value as VStatus) : "NOT_REQUESTED";
}

export default function VideoVerificationPage() {
  const router = useRouter();
  const { status: sessionStatus, user } = useSession();
  const { addToast } = useToast();
  const [status, setStatus] = useState<VStatus>("NOT_REQUESTED");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [requesting, setRequesting] = useState(false);

  const fetchStatus = async () => {
    setLoading(true);
    setError(false);
    try {
      const me = await apiFetch<{ videoVerificationStatus?: VStatus }>("/me", { retryOnUnauthorized: true });
      setStatus(normalizeStatus(me.videoVerificationStatus));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (sessionStatus === "logged-out") {
      router.replace("/auth/login");
      return;
    }

    if (sessionStatus !== "logged-in" || !user) {
      return;
    }

    void fetchStatus();
  }, [router, sessionStatus, user]);

  const handleRequest = async () => {
    setRequesting(true);
    try {
      await apiFetch("/verification-requests", { method: "POST" });
      setStatus("REQUESTED");
      addToast("Verification requested!", "success");
    } catch {
      addToast("Failed to request verification", "error");
    } finally {
      setRequesting(false);
    }
  };

  if (sessionStatus !== "logged-in" || !user || loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Skeleton height={32} width={200} />
        <Skeleton height={200} />
        <Skeleton height={44} width={180} />
      </div>
    );
  }

  if (error) {
    return <ErrorState onRetry={fetchStatus} />;
  }

  const config = statusConfig[status];

  return (
    <div className="fade-in">
      <h1 style={{ marginBottom: 8 }}>Video Verification</h1>
      <p style={{ color: "var(--muted)", fontSize: 15, marginBottom: 32 }}>
        Quick identity check to keep our community safe.
      </p>

      <Card style={{ padding: 28, marginBottom: 24 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <h3 style={{ margin: 0 }}>Status</h3>
          <Badge variant={config.variant}>{config.label}</Badge>
        </div>

        {/* Status icon area */}
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            background: "var(--primary-light)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
            fontSize: 36,
            color: "var(--primary)",
          }}
        >
          {status === "COMPLETED" ? "\u2713" : status === "REJECTED" ? "\u2717" : "\u25B6"}
        </div>

        <p
          style={{
            textAlign: "center",
            color: "var(--muted)",
            fontSize: 15,
            lineHeight: 1.6,
            marginBottom: 24,
          }}
        >
          {config.desc}
        </p>

        {status === "NOT_REQUESTED" && (
          <Button fullWidth loading={requesting} onClick={handleRequest} size="lg">
            Request Verification
          </Button>
        )}

        {status === "COMPLETED" && (
          <Link href="/onboarding/payment">
            <Button fullWidth size="lg">
              Continue to Payment
            </Button>
          </Link>
        )}

        {status === "REJECTED" && (
          <div style={{ display: "flex", gap: 12, flexDirection: "column" }}>
            <Button fullWidth loading={requesting} onClick={handleRequest}>
              Request Again
            </Button>
            <Link
              href="/support"
              style={{
                textAlign: "center",
                color: "var(--primary)",
                fontWeight: 500,
                fontSize: 14,
              }}
            >
              Contact Support
            </Link>
          </div>
        )}
      </Card>

      {/* Info */}
      <Card style={{ padding: 24 }}>
        <h4 style={{ marginBottom: 12 }}>What to expect</h4>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            "A quick video call with our verification team",
            "Have a valid photo ID ready",
            "The call takes less than 5 minutes",
            "Your ID is only used for verification and not stored",
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span style={{ color: "var(--success)", flexShrink: 0, fontWeight: 700 }}>{"\u2713"}</span>
              <span style={{ fontSize: 14, color: "var(--muted)" }}>{item}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

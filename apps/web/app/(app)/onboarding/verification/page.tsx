"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Clock3, ExternalLink, MessageCircleWarning, ShieldCheck, UserRoundCheck, XCircle } from "lucide-react";
import { apiRequestAuth } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

type VerificationPayload = {
  status: "NOT_REQUESTED" | "REQUESTED" | "ASSIGNED" | "IN_PROGRESS" | "COMPLETED" | "REJECTED" | "TIMED_OUT";
  displayStatus: "PENDING" | "ASSIGNED" | "APPROVED" | "REJECTED" | "TIMED_OUT";
  meetUrl: string | null;
  canRetry: boolean;
  remainingSeconds: number;
  requestedAt: string | null;
  whatsappHelpRequestedAt: string | null;
};

type MemberVerificationStage = "intro" | "requesting" | "waiting" | "timed_out" | "in_progress" | "approved_redirect" | "rejected";

function formatCountdown(value: number) {
  const safe = Math.max(0, value);
  const minutes = Math.floor(safe / 60)
    .toString()
    .padStart(1, "0");
  const seconds = Math.max(0, safe % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function deriveStage(payload: VerificationPayload | null, requesting: boolean): MemberVerificationStage {
  if (requesting) return "requesting";
  if (!payload || payload.status === "NOT_REQUESTED") return "intro";
  if (payload.status === "REQUESTED" || payload.status === "ASSIGNED") {
    return payload.remainingSeconds > 0 ? "waiting" : "timed_out";
  }
  if (payload.status === "TIMED_OUT") return "timed_out";
  if (payload.status === "IN_PROGRESS") return "in_progress";
  if (payload.status === "COMPLETED") return "approved_redirect";
  if (payload.status === "REJECTED") return "rejected";
  return "waiting";
}

export default function VideoVerificationPage() {
  const router = useRouter();
  const { refreshCurrentUser } = useAuth();
  const [payload, setPayload] = useState<VerificationPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [helping, setHelping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    const response = await apiRequestAuth<VerificationPayload>("/verification/status");
    setPayload(response);
    return response;
  }, []);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        await loadStatus();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load verification status.");
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, [loadStatus]);

  useEffect(() => {
    if (!payload || !["REQUESTED", "ASSIGNED", "IN_PROGRESS"].includes(payload.status)) return;
    const id = window.setInterval(() => {
      void loadStatus().catch(() => undefined);
    }, 15000);
    return () => window.clearInterval(id);
  }, [loadStatus, payload]);

  useEffect(() => {
    if (payload?.displayStatus !== "APPROVED") return;
    void refreshCurrentUser().finally(() => {
      router.replace("/onboarding/payment");
    });
  }, [payload?.displayStatus, refreshCurrentUser, router]);

  const createRequest = async () => {
    setRequesting(true);
    setError(null);
    setMessage(null);
    try {
      await apiRequestAuth("/verification-requests", {
        method: "POST",
        body: JSON.stringify({})
      });
      await loadStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to request video verification right now.");
    } finally {
      setRequesting(false);
    }
  };

  const requestWhatsAppHelp = async () => {
    setHelping(true);
    setError(null);
    setMessage(null);
    try {
      await apiRequestAuth("/verification/help/whatsapp", {
        method: "POST",
        body: JSON.stringify({})
      });
      const latest = await loadStatus();
      if (!latest.whatsappHelpRequestedAt) {
        throw new Error("Request failed. Please try again.");
      }
      setMessage("Your request has been received. Our agent will notify you when they are ready.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed. Please try again.");
    } finally {
      setHelping(false);
    }
  };

  const stage = useMemo(() => deriveStage(payload, requesting), [payload, requesting]);
  const showWhatsAppCta = stage === "waiting" || stage === "timed_out";

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center px-8">
        <p className="text-sm text-foreground/60">Loading verification status…</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col px-8 mobile-onboarding-content-tight">
      <div className="flex-1 flex flex-col justify-center gap-6 text-center">
        <div className="mx-auto h-20 w-20 rounded-full border border-primary/40 bg-primary/10 flex items-center justify-center">
          {stage === "intro" || stage === "requesting" || stage === "waiting" ? <UserRoundCheck className="text-primary/80" /> : null}
          {stage === "in_progress" ? <ShieldCheck className="text-primary" /> : null}
          {stage === "approved_redirect" ? <ShieldCheck className="text-primary" /> : null}
          {stage === "timed_out" ? <Clock3 className="text-amber-300" /> : null}
          {stage === "rejected" ? <XCircle className="text-red-400" /> : null}
        </div>

        <div>
          <h1 className="text-3xl font-serif text-foreground">
            {stage === "rejected" ? "Verification not approved" : "Identity Verification"}
          </h1>
          <p className="mt-2 text-sm text-foreground/70">
            {stage === "rejected"
              ? "We were unable to verify your identity. If you believe this is an error, contact support."
              : "A VAEL executive will verify your identity via Google Meet. This ensures every member is genuine."}
          </p>
        </div>

        {stage === "waiting" && payload ? (
          <p className="text-sm text-foreground/80">Waiting for an executive... {formatCountdown(payload.remainingSeconds)} remaining</p>
        ) : null}

        {stage === "timed_out" ? (
          <p className="text-sm text-foreground/80">No executive is available right now. We will notify you when one is ready.</p>
        ) : null}

        {stage === "in_progress" && payload?.meetUrl ? (
          <a
            href={payload.meetUrl}
            target="_blank"
            rel="noreferrer"
            className="mx-auto inline-flex items-center gap-2 rounded-lg border border-primary/30 px-4 py-2 text-primary hover:bg-primary/10"
          >
            Join Google Meet <ExternalLink size={14} />
          </a>
        ) : null}

        {stage === "approved_redirect" ? <p className="text-sm text-foreground/70">Verification approved. Redirecting to payment…</p> : null}
      </div>

      <div className="space-y-3">
        {error ? <p className="text-center text-sm text-red-400">{error}</p> : null}
        {message ? <p className="text-center text-sm text-primary">{message}</p> : null}

        {(stage === "intro" || stage === "timed_out") ? (
          <motion.button whileTap={{ scale: 0.98 }} disabled={requesting} onClick={createRequest} className="btn-vael-primary">
            {requesting ? "Requesting…" : "Request Verification"}
          </motion.button>
        ) : null}

        {showWhatsAppCta ? (
          <motion.button
            whileTap={{ scale: 0.98 }}
            disabled={helping || Boolean(payload?.whatsappHelpRequestedAt)}
            onClick={requestWhatsAppHelp}
            className="w-full rounded-xl border border-primary/25 px-4 py-3 text-xs uppercase tracking-[0.18em] text-primary disabled:opacity-45"
          >
            <span className="inline-flex items-center gap-2">
              <MessageCircleWarning size={14} />
              {payload?.whatsappHelpRequestedAt
                ? "Help request submitted"
                : helping
                  ? "Requesting…"
                  : "Need help? Get notified via WhatsApp"}
            </span>
          </motion.button>
        ) : null}
      </div>
    </div>
  );
}

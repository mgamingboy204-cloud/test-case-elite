"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Clock3, ExternalLink, MessageCircleWarning, ShieldCheck, UserRoundCheck, XCircle } from "lucide-react";
import { apiRequestAuth } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { type VerificationPayload, useVerificationStatusData } from "@/lib/memberState";

type MemberVerificationStage =
  | "intro"
  | "requesting"
  | "waiting"
  | "assigned"
  | "needs_help"
  | "help_requested"
  | "in_progress"
  | "approved_redirect"
  | "rejected";

const WAIT_WINDOW_SECONDS = 5 * 60;

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

function deriveStage(payload: VerificationPayload | null, requesting: boolean, remainingSeconds: number): MemberVerificationStage {
  if (requesting) return "requesting";
  if (!payload || payload.status === "NOT_REQUESTED") return "intro";
  if (payload.status === "ESCALATED") return "help_requested";
  if (payload.status === "PENDING") return remainingSeconds > 0 ? "waiting" : "needs_help";
  if (payload.status === "ASSIGNED") return "assigned";
  if (payload.status === "IN_PROGRESS") return "in_progress";
  if (payload.status === "COMPLETED") return "approved_redirect";
  if (payload.status === "REJECTED") return "rejected";
  return "waiting";
}

export default function VideoVerificationPage() {
  const { refreshCurrentUser, refreshCurrentUserAndRoute } = useAuth();
  const [requesting, setRequesting] = useState(false);
  const [helping, setHelping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [clockTickMs, setClockTickMs] = useState(() => Date.now());
  const verificationQuery = useVerificationStatusData();
  const payload = verificationQuery.data ?? null;
  const payloadStatus = payload?.status ?? null;
  const payloadRequestedAt = payload?.requestedAt ?? null;
  const payloadDisplayStatus = payload?.displayStatus ?? null;

  useEffect(() => {
    if (payloadStatus !== "PENDING" || Boolean(payload?.escalationRequestedAt)) return;
    setClockTickMs(Date.now());
    const id = window.setInterval(() => {
      setClockTickMs(Date.now());
    }, 1000);
    return () => window.clearInterval(id);
  }, [payload?.escalationRequestedAt, payloadRequestedAt, payloadStatus]);

  const effectiveRemainingSeconds = useMemo(() => {
    if (!payload) return WAIT_WINDOW_SECONDS;
    if (payload.status !== "PENDING" || payload.escalationRequestedAt) return payload.remainingSeconds;
    if (!payload.requestedAt) return payload.remainingSeconds;

    const requestedAtMs = new Date(payload.requestedAt).getTime();
    if (Number.isNaN(requestedAtMs)) return payload.remainingSeconds;

    const deadlineMs = requestedAtMs + WAIT_WINDOW_SECONDS * 1000;
    return Math.max(0, Math.ceil((deadlineMs - clockTickMs) / 1000));
  }, [clockTickMs, payload]);

  useEffect(() => {
    if (payloadStatus !== "PENDING" || Boolean(payload?.escalationRequestedAt)) return;
    if (effectiveRemainingSeconds > 0) return;
    void verificationQuery.refetch().catch(() => undefined);
  }, [effectiveRemainingSeconds, payload?.escalationRequestedAt, payloadStatus, verificationQuery]);

  useEffect(() => {
    if (payloadDisplayStatus !== "APPROVED") return;
    void refreshCurrentUserAndRoute();
  }, [payloadDisplayStatus, refreshCurrentUserAndRoute]);

  const createRequest = async () => {
    setRequesting(true);
    setError(null);
    setMessage(null);
    try {
      await apiRequestAuth(API_ENDPOINTS.verification.request, {
        method: "POST",
        body: JSON.stringify({})
      });
      await refreshCurrentUser().catch(() => undefined);
      await verificationQuery.refetch();
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
      await apiRequestAuth(API_ENDPOINTS.verification.whatsapp, {
        method: "POST",
        body: JSON.stringify({})
      });
      await refreshCurrentUser().catch(() => undefined);
      const latest = await verificationQuery.refetch();
      if (!latest.data?.escalationRequestedAt) {
        throw new Error("Request failed. Please try again.");
      }
      setMessage("Your request has been received. A VAEL executive will coordinate with you personally on WhatsApp.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed. Please try again.");
    } finally {
      setHelping(false);
    }
  };

  const stage = useMemo(() => deriveStage(payload, requesting, effectiveRemainingSeconds), [effectiveRemainingSeconds, payload, requesting]);
  const showWhatsAppCta = stage === "needs_help";

  if (verificationQuery.isPending && !payload) {
    return (
      <div className="flex h-full items-center justify-center px-8">
        <p className="text-sm text-foreground/60">Loading verification status...</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col px-8 pb-[calc(env(safe-area-inset-bottom,0px)+28px)]">
      <div className="flex-1 flex flex-col justify-center gap-6 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-primary/40 bg-primary/10">
          {stage === "intro" || stage === "requesting" || stage === "waiting" || stage === "assigned" ? <UserRoundCheck className="text-primary/80" /> : null}
          {stage === "help_requested" ? <MessageCircleWarning className="text-primary/80" /> : null}
          {stage === "in_progress" ? <ShieldCheck className="text-primary" /> : null}
          {stage === "approved_redirect" ? <ShieldCheck className="text-primary" /> : null}
          {stage === "needs_help" ? <Clock3 className="text-amber-300" /> : null}
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

        {stage === "waiting" ? (
          <p className="text-sm text-foreground/80">Waiting for an executive... {formatCountdown(effectiveRemainingSeconds)} remaining</p>
        ) : null}

        {stage === "assigned" ? (
          <p className="text-sm text-foreground/80">An executive has accepted your request. Your Google Meet link will appear here shortly.</p>
        ) : null}

        {stage === "help_requested" ? (
          <p className="text-sm text-foreground/80">WhatsApp help requested. A VAEL executive will coordinate with you personally and your verification request remains active.</p>
        ) : null}

        {stage === "needs_help" ? (
          <p className="text-sm text-foreground/80">No executive accepted your request within five minutes. You can now request WhatsApp verification help.</p>
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

        {stage === "approved_redirect" ? <p className="text-sm text-foreground/70">Verification approved. Redirecting to payment...</p> : null}
      </div>

      <div className="space-y-3">
        {error ? <p className="text-center text-sm text-red-400">{error}</p> : null}
        {message ? <p className="text-center text-sm text-primary">{message}</p> : null}

        {stage === "intro" ? (
          <motion.button whileTap={{ scale: 0.98 }} disabled={requesting} onClick={createRequest} className="btn-vael-primary">
            {requesting ? "Requesting..." : "Request Verification"}
          </motion.button>
        ) : null}

        {showWhatsAppCta ? (
          <motion.button
            whileTap={{ scale: 0.98 }}
            disabled={helping || Boolean(payload?.escalationRequestedAt)}
            onClick={requestWhatsAppHelp}
            className="w-full rounded-xl border border-primary/25 px-4 py-3 text-xs uppercase tracking-[0.18em] text-primary disabled:opacity-45"
          >
            <span className="inline-flex items-center gap-2">
              <MessageCircleWarning size={14} />
              {payload?.escalationRequestedAt ? "Help request submitted" : helping ? "Requesting..." : "Need help? Verify via WhatsApp"}
            </span>
          </motion.button>
        ) : null}
      </div>
    </div>
  );
}

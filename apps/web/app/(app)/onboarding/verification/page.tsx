"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Clock3, ExternalLink, MessageCircleWarning, ShieldCheck, UserRoundCheck, XCircle } from "lucide-react";
import { apiRequestAuth } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useLiveResourceRefresh } from "@/contexts/LiveUpdatesContext";
import { API_ENDPOINTS } from "@/lib/api/endpoints";

type VerificationPayload = {
  status: "NOT_REQUESTED" | "REQUESTED" | "ASSIGNED" | "IN_PROGRESS" | "COMPLETED" | "REJECTED" | "TIMED_OUT";
  displayStatus: "PENDING" | "ASSIGNED" | "APPROVED" | "REJECTED" | "TIMED_OUT";
  meetUrl: string | null;
  canRetry: boolean;
  remainingSeconds: number;
  requestedAt: string | null;
  whatsappHelpRequestedAt: string | null;
};

type MemberVerificationStage =
  | "intro"
  | "requesting"
  | "waiting"
  | "assigned"
  | "help_requested"
  | "timed_out"
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
  if (payload.status === "REQUESTED" && payload.whatsappHelpRequestedAt) return "help_requested";
  if (payload.status === "REQUESTED") return remainingSeconds > 0 ? "waiting" : "timed_out";
  if (payload.status === "ASSIGNED") return "assigned";
  if (payload.status === "TIMED_OUT") return "timed_out";
  if (payload.status === "IN_PROGRESS") return "in_progress";
  if (payload.status === "COMPLETED") return "approved_redirect";
  if (payload.status === "REJECTED") return "rejected";
  return "waiting";
}

export default function VideoVerificationPage() {
  const { refreshCurrentUser, refreshCurrentUserAndRoute } = useAuth();
  const [payload, setPayload] = useState<VerificationPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [helping, setHelping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [clockTickMs, setClockTickMs] = useState(() => Date.now());
  const payloadStatus = payload?.status ?? null;
  const payloadRequestedAt = payload?.requestedAt ?? null;
  const payloadDisplayStatus = payload?.displayStatus ?? null;

  const loadStatus = useCallback(async () => {
    const response = await apiRequestAuth<VerificationPayload>(API_ENDPOINTS.verification.status);
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

  useLiveResourceRefresh({
    enabled: Boolean(payloadStatus),
    refresh: loadStatus,
    eventTypes: ["verification.status.changed"],
    fallbackIntervalMs: ["REQUESTED", "ASSIGNED", "IN_PROGRESS"].includes(payloadStatus ?? "") ? 5_000 : undefined
  });

  useEffect(() => {
    if (payloadStatus !== "REQUESTED" || Boolean(payload?.whatsappHelpRequestedAt)) return;
    setClockTickMs(Date.now());
    const id = window.setInterval(() => {
      setClockTickMs(Date.now());
    }, 1000);
    return () => window.clearInterval(id);
  }, [payload?.whatsappHelpRequestedAt, payloadRequestedAt, payloadStatus]);

  const effectiveRemainingSeconds = useMemo(() => {
    if (!payload) return WAIT_WINDOW_SECONDS;
    if (payload.status !== "REQUESTED" || payload.whatsappHelpRequestedAt) return payload.remainingSeconds;
    if (!payload.requestedAt) return payload.remainingSeconds;

    const requestedAtMs = new Date(payload.requestedAt).getTime();
    if (Number.isNaN(requestedAtMs)) return payload.remainingSeconds;

    const deadlineMs = requestedAtMs + WAIT_WINDOW_SECONDS * 1000;
    return Math.max(0, Math.ceil((deadlineMs - clockTickMs) / 1000));
  }, [clockTickMs, payload]);

  useEffect(() => {
    if (payloadStatus !== "REQUESTED" || Boolean(payload?.whatsappHelpRequestedAt)) return;
    if (effectiveRemainingSeconds > 0) return;
    void loadStatus().catch(() => undefined);
  }, [effectiveRemainingSeconds, loadStatus, payload?.whatsappHelpRequestedAt, payloadStatus]);

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
      await apiRequestAuth(API_ENDPOINTS.verification.whatsapp, {
        method: "POST",
        body: JSON.stringify({})
      });
      await refreshCurrentUser().catch(() => undefined);
      const latest = await loadStatus();
      if (!latest.whatsappHelpRequestedAt) {
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
  const showWhatsAppCta = stage === "timed_out";

  if (loading) {
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

        {stage === "waiting" ? (
          <p className="text-sm text-foreground/80">Waiting for an executive... {formatCountdown(effectiveRemainingSeconds)} remaining</p>
        ) : null}

        {stage === "assigned" ? (
          <p className="text-sm text-foreground/80">An executive has accepted your request. Your Google Meet link will appear here shortly.</p>
        ) : null}

        {stage === "help_requested" ? (
          <p className="text-sm text-foreground/80">WhatsApp help requested. A VAEL executive will coordinate with you personally and your verification request remains active.</p>
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

        {stage === "approved_redirect" ? <p className="text-sm text-foreground/70">Verification approved. Redirecting to payment...</p> : null}
      </div>

      <div className="space-y-3">
        {error ? <p className="text-center text-sm text-red-400">{error}</p> : null}
        {message ? <p className="text-center text-sm text-primary">{message}</p> : null}

        {stage === "intro" || stage === "timed_out" ? (
          <motion.button whileTap={{ scale: 0.98 }} disabled={requesting} onClick={createRequest} className="btn-vael-primary">
            {requesting ? "Requesting..." : "Request Verification"}
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
              {payload?.whatsappHelpRequestedAt ? "Help request submitted" : helping ? "Requesting..." : "Need help? Notify on WhatsApp"}
            </span>
          </motion.button>
        ) : null}
      </div>
    </div>
  );
}

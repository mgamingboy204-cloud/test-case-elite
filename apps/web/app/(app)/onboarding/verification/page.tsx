"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Clock3, ExternalLink, MessageCircleWarning, ShieldCheck, UserRoundCheck, XCircle } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

type VerificationPayload = {
  status: "NOT_REQUESTED" | "REQUESTED" | "ASSIGNED" | "IN_PROGRESS" | "COMPLETED" | "REJECTED" | "TIMED_OUT";
  displayStatus: "PENDING" | "ASSIGNED" | "APPROVED" | "REJECTED" | "TIMED_OUT";
  meetUrl: string | null;
  canRetry: boolean;
  remainingSeconds: number;
  whatsappHelpRequestedAt: string | null;
};

function formatCountdown(value: number) {
  const minutes = Math.floor(value / 60)
    .toString()
    .padStart(2, "0");
  const seconds = Math.max(0, value % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export default function VideoVerificationPage() {
  const { refreshCurrentUser } = useAuth();
  const [payload, setPayload] = useState<VerificationPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [helping, setHelping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    setError(null);
    const response = await apiRequest<VerificationPayload>("/verification/status", { auth: true });
    setPayload(response);
    await refreshCurrentUser();
  }, [refreshCurrentUser]);

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
    const id = window.setInterval(() => {
      void loadStatus().catch(() => undefined);
    }, 15000);
    return () => window.clearInterval(id);
  }, [loadStatus]);

  const createRequest = async () => {
    setRequesting(true);
    setError(null);
    setMessage(null);
    try {
      await apiRequest("/verification-requests", {
        method: "POST",
        auth: true,
        body: JSON.stringify({})
      });
      await loadStatus();
      setMessage("Your private verification request has been queued for a live employee review.");
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
      await apiRequest("/verification/help/whatsapp", {
        method: "POST",
        auth: true,
        body: JSON.stringify({})
      });
      await loadStatus();
      setMessage("A real team member has been notified and will follow up with you personally on WhatsApp.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to request WhatsApp support.");
    } finally {
      setHelping(false);
    }
  };

  const waiting = payload?.displayStatus === "PENDING" || payload?.displayStatus === "ASSIGNED";

  const heading = useMemo(() => {
    if (!payload) return "Video verification";
    if (payload.displayStatus === "APPROVED") return "Verification approved";
    if (payload.displayStatus === "REJECTED") return "Verification not approved";
    if (payload.displayStatus === "TIMED_OUT") return "Session timed out";
    return "Awaiting live verification";
  }, [payload]);

  return (
    <div className="flex h-full flex-col px-8 pb-[calc(env(safe-area-inset-bottom,0px)+28px)]">
      <div className="flex-1 flex flex-col justify-center gap-6 text-center">
        <div className="mx-auto h-20 w-20 rounded-full border border-primary/40 bg-primary/10 flex items-center justify-center">
          {payload?.displayStatus === "APPROVED" ? <ShieldCheck className="text-primary" /> : null}
          {payload?.displayStatus === "REJECTED" ? <XCircle className="text-red-400" /> : null}
          {payload?.displayStatus === "TIMED_OUT" ? <Clock3 className="text-amber-300" /> : null}
          {waiting ? <UserRoundCheck className="text-primary/80" /> : null}
          {!payload ? <UserRoundCheck className="text-primary/80" /> : null}
        </div>

        <div>
          <h1 className="text-3xl font-serif text-foreground">{heading}</h1>
          <p className="mt-2 text-xs uppercase tracking-[0.24em] text-foreground/55">
            Human-managed video verification is mandatory before payment and member access.
          </p>
        </div>

        {loading ? <p className="text-sm text-foreground/50">Loading verification status…</p> : null}

        {!loading && payload ? (
          <div className="rounded-2xl border border-primary/15 bg-primary/[0.03] p-5 text-left text-sm text-foreground/80">
            <p className="text-[11px] uppercase tracking-[0.18em] text-primary/70">Current status</p>
            <p className="mt-2 font-medium">{payload.displayStatus}</p>
            {waiting ? (
              <p className="mt-3 flex items-center gap-2 text-foreground/70">
                <Clock3 size={14} /> Employee response window: <strong>{formatCountdown(payload.remainingSeconds)}</strong>
              </p>
            ) : null}
            {payload.meetUrl ? (
              <a
                href={payload.meetUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-2 rounded-lg border border-primary/30 px-4 py-2 text-primary hover:bg-primary/10"
              >
                Join Google Meet <ExternalLink size={14} />
              </a>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="space-y-3">
        {error ? <p className="text-center text-sm text-red-400">{error}</p> : null}
        {message ? <p className="text-center text-sm text-primary">{message}</p> : null}

        {!loading && (!payload || payload.status === "NOT_REQUESTED" || payload.canRetry) ? (
          <motion.button whileTap={{ scale: 0.98 }} disabled={requesting} onClick={createRequest} className="btn-vael-primary">
            {requesting ? "Requesting…" : payload?.canRetry ? "Request verification again" : "Request live verification"}
          </motion.button>
        ) : null}

        {!loading && waiting ? (
          <motion.button
            whileTap={{ scale: 0.98 }}
            disabled={helping || Boolean(payload?.whatsappHelpRequestedAt)}
            onClick={requestWhatsAppHelp}
            className="w-full rounded-xl border border-primary/25 px-4 py-3 text-xs uppercase tracking-[0.18em] text-primary disabled:opacity-45"
          >
            <span className="inline-flex items-center gap-2">
              <MessageCircleWarning size={14} />
              {payload?.whatsappHelpRequestedAt ? "WhatsApp follow-up requested" : helping ? "Requesting…" : "Request WhatsApp help"}
            </span>
          </motion.button>
        ) : null}

        {!loading && payload?.displayStatus === "REJECTED" ? (
          <p className="text-center text-xs text-red-300/80">
            This account has been restricted from continuing the membership journey.
          </p>
        ) : null}
      </div>
    </div>
  );
}

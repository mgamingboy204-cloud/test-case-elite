"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Card } from "@/app/components/ui/Card";
import { Button } from "@/app/components/ui/Button";
import { Badge } from "@/app/components/ui/Badge";
import { Skeleton } from "@/app/components/ui/Skeleton";
import { ErrorState } from "@/app/components/ui/States";
import { useToast } from "@/app/providers";
import { apiFetch } from "@/lib/api";
import { getDefaultRoute, getPwaDefaultRoute } from "@/lib/onboarding";
import { useSession } from "@/lib/session";
import styles from "./page.module.css";

type VStatus = "NOT_REQUESTED" | "REQUESTED" | "IN_PROGRESS" | "COMPLETED" | "APPROVED" | "REJECTED";

const statusConfig: Record<VStatus, { label: string; variant: "default" | "primary" | "success" | "danger" | "warning"; desc: string }> = {
  NOT_REQUESTED: { label: "Not Started", variant: "default", desc: "Complete a quick video call to verify your identity." },
  REQUESTED: { label: "Requested", variant: "warning", desc: "Your verification request is in queue. We are tracking status live." },
  IN_PROGRESS: { label: "In Progress", variant: "primary", desc: "A verifier is processing your request. This page auto-refreshes every few seconds." },
  COMPLETED: { label: "Verified", variant: "success", desc: "Verification completed. Redirecting you to the next onboarding step..." },
  APPROVED: { label: "Verified", variant: "success", desc: "Verification approved. Redirecting you to the next onboarding step..." },
  REJECTED: { label: "Rejected", variant: "danger", desc: "Your verification was not approved. Please request again or contact support." }
};

export default function VideoVerificationPage() {
  const router = useRouter();
  const pathname = usePathname();
  const isPwaPath = pathname?.startsWith("/pwa_app") ?? false;
  const { addToast } = useToast();
  const { user, refresh } = useSession();
  const [status, setStatus] = useState<VStatus>("NOT_REQUESTED");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);

  const isVerified = status === "COMPLETED" || status === "APPROVED";

  const fetchStatus = async (initial = false) => {
    if (initial) setLoading(true);
    if (initial) setError(false);
    try {
      const data = await apiFetch<{ status: VStatus }>("/me/verification-status");
      setStatus(data.status ?? "NOT_REQUESTED");
      setLastUpdatedAt(new Date());
      const refreshedUser = await refresh();
      if (refreshedUser) {
        const nextRoute = isPwaPath ? getPwaDefaultRoute(refreshedUser) : getDefaultRoute(refreshedUser);
        const currentStepRoute = isPwaPath ? "/pwa_app/onboarding/video-verification" : "/onboarding/video-verification";
        if (nextRoute !== currentStepRoute) {
          router.replace(nextRoute);
        }
      }
    } catch {
      setError(true);
    } finally {
      if (initial) setLoading(false);
    }
  };

  useEffect(() => {
    void fetchStatus(true);
  }, [isPwaPath]);

  useEffect(() => {
    if (!user || (user.onboardingStep && user.onboardingStep !== "VIDEO_VERIFICATION_PENDING" && user.onboardingStep !== "PHONE_VERIFIED")) {
      return;
    }
    const timer = window.setInterval(() => {
      void fetchStatus(false);
    }, 7000);
    return () => window.clearInterval(timer);
  }, [user?.id, user?.onboardingStep, isPwaPath]);

  const handleRequest = async () => {
    setRequesting(true);
    try {
      await apiFetch("/verification-requests", { method: "POST" });
      setStatus("REQUESTED");
      addToast("Verification requested! Live tracking started.", "success");
      await fetchStatus(false);
    } catch {
      addToast("Failed to request verification", "error");
    } finally {
      setRequesting(false);
    }
  };

  const config = useMemo(() => statusConfig[status], [status]);

  if (loading) {
    return (
      <div className={styles.loading}>
        <Skeleton height={32} width={240} />
        <Skeleton height={220} />
        <Skeleton height={44} width={220} />
      </div>
    );
  }

  if (error) {
    return <ErrorState onRetry={() => fetchStatus(true)} />;
  }

  return (
    <div className={`fade-in ${styles.root}`}>
      <h1 className={styles.title}>Video Verification</h1>
      <p className={styles.subtitle}>
        We continuously check your verification status and move you to the next onboarding step automatically.
      </p>

      <Card className={styles.card}>
        <div className={styles.header}>
          <h3 className={styles.statusTitle}>Current Status</h3>
          <Badge variant={config.variant}>{config.label}</Badge>
        </div>

        <p className={styles.description}>{config.desc}</p>

        <p className={styles.meta}>
          Live tracking: every 7s{lastUpdatedAt ? ` • Last checked ${lastUpdatedAt.toLocaleTimeString()}` : ""}
        </p>

        {status === "NOT_REQUESTED" && (
          <div className="safe-bottom">
            <Button fullWidth loading={requesting} onClick={handleRequest} size="lg" className={styles.requestButton}>
              Request Verification
            </Button>
          </div>
        )}

        {(status === "REQUESTED" || status === "IN_PROGRESS") && (
          <div className="safe-bottom">
            <Button fullWidth variant="secondary" onClick={() => fetchStatus(false)}>
              Check Now
            </Button>
          </div>
        )}

        {isVerified && (
          <div className="safe-bottom">
            <Link href={isPwaPath ? "/pwa_app/onboarding/payment" : "/onboarding/payment"}>
              <Button fullWidth size="lg">Continue to Payment</Button>
            </Link>
          </div>
        )}

        {status === "REJECTED" && (
          <div className={`safe-bottom ${styles.rejectedActions}`}>
            <Button fullWidth loading={requesting} onClick={handleRequest} className={styles.retryButton}>Request Again</Button>
            <Link href="/support" className={styles.supportLink}>
              Contact Support
            </Link>
          </div>
        )}
      </Card>
    </div>
  );
}

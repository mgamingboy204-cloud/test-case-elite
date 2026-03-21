"use client";

import { ReactNode, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { ChevronLeft } from "lucide-react";
import { resolveRouteRedirect } from "@/lib/navigationGuard";

// Maps each onboarding state to the correct sub-route
const ORDERED_ROUTES = [
  '/onboarding/verification',
  '/onboarding/payment',
  '/onboarding/details',
  '/onboarding/photos',
];

const STEP_LABELS = ['Identity', 'Funding', 'Essence', 'Presence'];

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const { onboardingStep, isAuthenticated, isAuthResolved, appStateCode, appStateRedirectTo, user } = useAuth();

  const currentIndex = ORDERED_ROUTES.findIndex(r => pathname.includes(r));
  const progress = Math.max(0, Math.min(100, ((currentIndex + 1) / ORDERED_ROUTES.length) * 100));

  // ── State-Aware Guard ──────────────────────────────────────────────────────
  // If the user's stored step doesn't match where they are, redirect them to
  // the correct route for their completion status.
  useEffect(() => {
    const redirect = resolveRouteRedirect({
      pathname,
      isAuthenticated,
      isAuthResolved,
      onboardingStep,
      scope: "onboarding",
      userRole: user?.role ?? null,
      mustResetPassword: user?.mustResetPassword ?? false,
      appStateCode,
      appStateRedirectTo
    });
    if (redirect && pathname !== redirect) {
      router.replace(redirect);
    }
  }, [isAuthResolved, isAuthenticated, onboardingStep, pathname, router, appStateCode, appStateRedirectTo, user?.mustResetPassword, user?.role]);

  if (!isAuthResolved) {
    return <div className="w-full h-[100dvh] bg-background" />;
  }

  const canGoBack = currentIndex > 0;
  const handleBack = () => { if (canGoBack) router.back(); };

  return (
    <div className="w-full h-[100dvh] bg-background overflow-hidden relative flex flex-col items-center justify-center">

      {/* Ambient Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-20%] w-[70%] h-[70%] bg-foreground/5 rounded-full blur-[140px]" />
      </div>

      {/* Phone-sized Glassmorphic Card */}
      <div className="relative z-10 w-full max-w-[420px] h-[100dvh] flex flex-col bg-background/90 backdrop-blur-xl border-x border-primary/10 overflow-hidden">

        {/* ── Top Shell: Back + Progress ── */}
        <div className="flex-none pt-[env(safe-area-inset-top,20px)] px-6 pb-3">

          {/* Back row */}
          <div className="h-10 flex items-center">
            {canGoBack ? (
              <button
                onClick={handleBack}
                className="flex items-center gap-1.5 text-primary/70 hover:text-primary transition-colors"
              >
                <ChevronLeft size={20} strokeWidth={1.5} />
                <span className="text-[10px] uppercase tracking-[0.3em] font-medium">Back</span>
              </button>
            ) : (
              <div className="h-10" />
            )}
          </div>

          {/* Progress hairline */}
          <div className="w-full h-[1.5px] bg-foreground/8 overflow-hidden rounded-full mt-1">
            <motion.div
              className="h-full bg-primary shadow-[0_0_6px_var(--color-primary)]"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
            />
          </div>

          {/* Sequence label */}
          <div className="flex justify-between items-center mt-2">
            <p className="text-[7px] uppercase tracking-[0.5em] text-primary/50 font-semibold">
              {currentIndex >= 0 ? STEP_LABELS[currentIndex] : ''}
            </p>
            <p className="text-[7px] uppercase tracking-[0.5em] text-foreground/25 font-semibold">
              {Math.max(1, currentIndex + 1)}&nbsp;/&nbsp;{ORDERED_ROUTES.length}
            </p>
          </div>
        </div>

        {/* ── Scrollable Step Content ── */}
        <div className="flex-1 w-full min-h-0 overflow-y-auto no-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, x: 28 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -28 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="w-full h-full flex flex-col"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

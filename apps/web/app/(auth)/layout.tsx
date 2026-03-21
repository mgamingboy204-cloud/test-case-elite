"use client";

import { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { resolveRouteRedirect } from "@/lib/navigationGuard";
import { useEffect } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const {
    isAuthenticated,
    isAuthResolved,
    authenticatedRoute,
    onboardingStep,
    appStateCode,
    appStateRedirectTo,
    user,
    authFlowMode,
    pendingPhone,
    signupToken
  } = useAuth();

  useEffect(() => {
    const redirect = resolveRouteRedirect({
      pathname,
      isAuthenticated,
      isAuthResolved,
      authenticatedRoute,
      onboardingStep,
      appStateCode,
      appStateRedirectTo,
      scope: "auth",
      userRole: user?.role ?? null,
      mustResetPassword: user?.mustResetPassword ?? false,
      authFlowMode,
      pendingPhone,
      signupToken
    });
    if (redirect && pathname !== redirect) {
      router.replace(redirect);
    }
  }, [
    authenticatedRoute,
    authFlowMode,
    appStateCode,
    appStateRedirectTo,
    isAuthResolved,
    isAuthenticated,
    onboardingStep,
    pathname,
    pendingPhone,
    router,
    signupToken,
    user?.mustResetPassword,
    user?.role
  ]);

  if (!isAuthResolved) return <div className="min-h-screen w-full bg-background" />;
  if (isAuthenticated) return null;

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-6 relative bg-background">
      {/* Subtle Abstract Background for Auth */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px] mix-blend-screen" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-slate-800/20 rounded-full blur-[100px] mix-blend-screen" />
      </div>

      <div className="w-full flex justify-center mb-12 z-10">
        <span className="w-12 h-12 rounded-full border border-primary/30 flex items-center justify-center bg-primary/10">
          <div className="w-3 h-3 rounded-full bg-primary shadow-[0_0_12px_var(--color-primary)]" />
        </span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, scale: 0.98, filter: "blur(10px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0, scale: 0.98, filter: "blur(10px)" }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full flex justify-center z-10"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

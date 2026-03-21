"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { PwaInstallButton } from "@/components/pwa/pwa-install-button";
import { useAuth } from "@/contexts/AuthContext";

const DeferredSceneCanvas = dynamic(
  () => import("@/components/scene/scene-canvas").then((module) => module.SceneCanvas),
  {
    ssr: false,
    loading: () => null
  }
);

function useDeferredSceneMount(enabled: boolean) {
  const [shouldRenderScene, setShouldRenderScene] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setShouldRenderScene(false);
      return;
    }

    const idleWindow = window as Window & {
      requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
      cancelIdleCallback?: (handle: number) => void;
    };

    let timeoutId: number | null = null;
    let idleId: number | null = null;

    const activate = () => {
      setShouldRenderScene(true);
    };

    if (typeof idleWindow.requestIdleCallback === "function") {
      idleId = idleWindow.requestIdleCallback(activate, { timeout: 1200 });
    } else {
      timeoutId = window.setTimeout(activate, 500);
    }

    return () => {
      if (idleId !== null && typeof idleWindow.cancelIdleCallback === "function") {
        idleWindow.cancelIdleCallback(idleId);
      }
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [enabled]);

  return shouldRenderScene;
}

export default function Home() {
  const { isAuthenticated, isAuthResolved, authenticatedRoute } = useAuth();
  const router = useRouter();
  const shouldHideMarketing = isAuthResolved && isAuthenticated && Boolean(authenticatedRoute);
  const shouldRenderScene = useDeferredSceneMount(!shouldHideMarketing);

  useEffect(() => {
    if (!isAuthResolved || !isAuthenticated || !authenticatedRoute) return;
    router.replace(authenticatedRoute);
  }, [authenticatedRoute, isAuthResolved, isAuthenticated, router]);

  if (shouldHideMarketing) {
    return (
      <div className="relative min-h-screen w-full overflow-hidden bg-background">
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          <div className="absolute left-[-12%] top-[4%] h-[26rem] w-[26rem] rounded-full bg-primary/14 blur-3xl" />
          <div className="absolute right-[-16%] top-[18%] h-[32rem] w-[32rem] rounded-full bg-white/10 blur-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute left-[-12%] top-[4%] h-[26rem] w-[26rem] rounded-full bg-primary/14 blur-3xl" />
        <div className="absolute right-[-16%] top-[18%] h-[32rem] w-[32rem] rounded-full bg-white/10 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-[60vh] bg-[radial-gradient(circle_at_top,rgba(183,110,121,0.16),transparent_62%)]" />
        <div className="absolute bottom-0 left-1/2 h-[24rem] w-[42rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.08),transparent_70%)] blur-3xl" />
      </div>

      {shouldRenderScene ? <DeferredSceneCanvas /> : null}

      <div className="relative z-10 flex w-full flex-col">
        <section className="relative z-20 flex min-h-screen w-full flex-col justify-center px-6 md:px-12">
          <div className="mx-auto flex w-full max-w-7xl flex-col items-center text-center md:items-start md:text-left">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="mb-8 text-6xl font-bold leading-[0.9] tracking-tight text-foreground md:text-9xl"
            >
              VAEL
              <br />
              <span className="font-light italic text-primary drop-shadow-[0_0_20px_rgba(183,110,121,0.4)]">
                A private club for
                <br className="hidden md:block" />
                extraordinary people.
              </span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="mb-12 max-w-3xl text-xl font-light leading-relaxed text-foreground/70 md:text-3xl"
            >
              VAEL is a human-led, invite-only membership for high-value individuals. Every profile is verified, every
              introduction is curated, and every interaction is designed to protect your time, privacy, and reputation.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center gap-6 sm:flex-row md:items-start"
            >
              <Link
                href="/signup/phone"
                className="rounded-full bg-primary px-10 py-5 font-semibold text-background shadow-xl transition-all hover:bg-primary/90 hover:shadow-primary/20 md:scale-100"
              >
                Apply for VAEL
              </Link>
              <Link
                href="/signin"
                className="rounded-full border border-white/10 bg-white/5 px-10 py-5 font-semibold text-foreground shadow-sm transition-all hover:bg-white/10"
              >
                Sign In
              </Link>
            </motion.div>
          </div>
        </section>

        <section id="why-vael" className="relative z-20 flex min-h-screen w-full flex-col justify-center px-6 md:px-12">
              <div className="mx-auto mt-24 w-full max-w-7xl">
                <motion.h2
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="mb-16 text-4xl font-light tracking-wide text-foreground md:text-6xl"
                >
                  The VAEL <span className="font-semibold">Standard</span>
                </motion.h2>

                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                  <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
                    whileHover={{ y: -5, transition: { duration: 0.2 } }}
                    className="rounded-3xl border border-border/40 bg-background/20 p-10 shadow-2xl backdrop-blur-2xl transition-colors hover:border-primary/50"
                  >
                    <h3 className="mb-4 text-2xl font-medium tracking-wide text-primary">Verified Membership</h3>
                    <p className="text-lg font-light leading-relaxed text-foreground/70">
                      Every profile is rigorously vetted. We maintain an exclusive network to ensure your time is spent
                      with genuine, high-caliber individuals.
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                    whileHover={{ y: -5, transition: { duration: 0.2 } }}
                    className="rounded-3xl border border-border/40 bg-background/20 p-10 shadow-2xl backdrop-blur-2xl transition-colors hover:border-primary/50"
                  >
                    <h3 className="mb-4 text-2xl font-medium tracking-wide text-primary">Uncompromising Privacy</h3>
                    <p className="text-lg font-light leading-relaxed text-foreground/70">
                      Your data is secured with state-of-the-art encryption. Profiles are only visible to curated
                      matches, ensuring your presence remains discreet.
                    </p>
                  </motion.div>
                </div>
              </div>
        </section>

        <section id="how-it-works" className="relative z-20 flex min-h-[150vh] w-full flex-col px-6 pt-32 md:px-12">
              <div className="sticky top-[20vh] mx-auto w-full max-w-7xl">
                <motion.h2
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.8 }}
                  className="mb-12 text-4xl font-light text-foreground md:text-5xl"
                >
                  The <span className="font-semibold">Process</span>
                </motion.h2>

                <div className="flex max-w-xl flex-col gap-12">
                  {[
                    {
                      step: "01",
                      title: "Guided Onboarding",
                      desc: "A concierge team member walks you through our detailed preference matrix."
                    },
                    {
                      step: "02",
                      title: "Intentional Introductions",
                      desc: "No endless swiping. You receive one highly curated match at a time."
                    },
                    {
                      step: "03",
                      title: "Thoughtful Connection",
                      desc: "Post-date feedback refines your algorithm profile for absolute precision."
                    }
                  ].map((item, index) => (
                    <motion.div
                      key={item.step}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-10px" }}
                      transition={{ duration: 0.8, delay: index * 0.2 }}
                      className="relative rounded-r-2xl border-l border-primary/30 bg-background/5 p-4 pl-8 backdrop-blur-sm"
                    >
                      <div className="absolute left-0 top-6 h-2 w-2 -translate-x-[50%] rounded-full bg-primary shadow-[0_0_10px_var(--color-primary)]" />
                      <h4 className="mb-2 font-mono text-xs tracking-widest text-primary">PHASE {item.step}</h4>
                      <h3 className="mb-2 text-2xl font-medium text-foreground">{item.title}</h3>
                      <p className="text-lg font-light leading-relaxed text-foreground/60">{item.desc}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
        </section>

        <section id="about" className="relative z-20 flex min-h-[150vh] w-full flex-col justify-end px-6 pb-32 md:px-12">
              <div className="max-w-3xl">
                <motion.h2
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="mb-8 text-4xl font-light text-foreground md:text-7xl"
                >
                  A Native Experience, <br />
                  <span className="font-semibold italic text-primary">In Your Browser.</span>
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
                  className="mb-12 max-w-xl text-xl font-light leading-relaxed text-foreground/70 md:text-2xl"
                >
                  VAEL does not require an App Store download. We deliver a secure, swipe-free curated profile
                  discovery right from your browser window, running effortlessly with native PWA capabilities.
                </motion.p>
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, delay: 0.4 }}
                >
                  <PwaInstallButton className="rounded-full bg-foreground px-8 py-4 font-medium text-background transition-colors hover:bg-primary hover:text-background hover:shadow-[0_0_20px_rgba(183,110,121,0.5)] disabled:cursor-not-allowed disabled:opacity-70" />
                </motion.div>
              </div>
        </section>
      </div>
    </div>
  );
}

"use client";

import { SceneCanvas } from "@/components/scene/scene-canvas";
import { PwaInstallButton } from "@/components/pwa/pwa-install-button";
import { motion, useScroll } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { routeForAuthenticatedUser } from "@/lib/onboarding";

export default function Home() {
  const { isAuthenticated, isAuthResolved, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthResolved || !isAuthenticated || !user) return;
    router.replace(routeForAuthenticatedUser(user));
  }, [isAuthResolved, isAuthenticated, router, user]);

  // No target/container needed — the marketing layout owns the scroll context.
  // useScroll() defaults to tracking window scroll, which is what we want here.
  useScroll();

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-background">

      {/* Fixed 3D Canvas — pointer-events-none is set in SceneCanvas itself */}
      <SceneCanvas />

      {/* Page Content — layered above canvas, full pointer-events */}
      <div className="relative z-10 w-full flex flex-col">

        {/* ── Section 1: Hero ────────────────────────────────── */}
        <section className="min-h-screen w-full flex flex-col justify-center px-6 md:px-12 relative z-20">
          <div className="max-w-7xl mx-auto w-full flex flex-col items-center md:items-start text-center md:text-left">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="text-6xl md:text-9xl font-bold tracking-tight text-foreground mb-8 leading-[0.9]"
            >
              VAEL
              <br />
              <span className="text-primary italic font-light drop-shadow-[0_0_20px_rgba(183,110,121,0.4)]">
                A private club for
                <br className="hidden md:block" />
                extraordinary people.
              </span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="text-xl md:text-3xl text-foreground/70 max-w-3xl mb-12 leading-relaxed font-light"
            >
              VAEL is a human-led, invite-only membership for high-value individuals. Every profile is verified, every
              introduction is curated, and every interaction is designed to protect your time, privacy, and reputation.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col sm:flex-row gap-6 items-center md:items-start"
            >
              <Link
                href="/signup/phone"
                className="px-10 py-5 bg-primary text-background font-semibold rounded-full hover:bg-primary/90 transition-all shadow-xl hover:shadow-primary/20 scale-110 md:scale-100"
              >
                Apply for VAEL
              </Link>
              <Link
                href="/signin"
                className="px-10 py-5 bg-white/5 backdrop-blur-xl text-foreground font-semibold rounded-full border border-white/10 hover:bg-white/10 transition-all shadow-sm"
              >
                Sign In
              </Link>
            </motion.div>
          </div>
        </section>

        {/* ── Section 2: The Standard ────────────────────────── */}
        <section id="why-vael" className="min-h-screen w-full flex flex-col justify-center px-6 md:px-12 relative z-20">
          <div className="max-w-7xl mx-auto w-full mt-24">
            <motion.h2
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-4xl md:text-6xl font-light mb-16 tracking-wide text-foreground"
            >
              The VAEL <span className="font-semibold">Standard</span>
            </motion.h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className="p-10 rounded-3xl bg-background/20 backdrop-blur-2xl border border-border/40 shadow-2xl hover:border-primary/50 transition-colors"
              >
                <h3 className="text-2xl font-medium mb-4 text-primary tracking-wide">Verified Membership</h3>
                <p className="text-foreground/70 text-lg font-light leading-relaxed">Every profile is rigorously vetted. We maintain an exclusive network to ensure your time is spent with genuine, high-caliber individuals.</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className="p-10 rounded-3xl bg-background/20 backdrop-blur-2xl border border-border/40 shadow-2xl hover:border-primary/50 transition-colors"
              >
                <h3 className="text-2xl font-medium mb-4 text-primary tracking-wide">Uncompromising Privacy</h3>
                <p className="text-foreground/70 text-lg font-light leading-relaxed">Your data is secured with state-of-the-art encryption. Profiles are only visible to curated matches, ensuring your presence remains discreet.</p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── Section 3: The Process ─────────────────────────── */}
        <section id="how-it-works" className="min-h-[150vh] w-full flex flex-col pt-32 px-6 md:px-12 relative z-20">
          <div className="max-w-7xl mx-auto w-full sticky top-[20vh]">
            <motion.h2
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
              className="text-4xl md:text-5xl font-light mb-12 text-foreground"
            >
              The <span className="font-semibold">Process</span>
            </motion.h2>

            <div className="flex flex-col gap-12 max-w-xl">
              {[
                { step: "01", title: "Guided Onboarding", desc: "A concierge team member walks you through our detailed preference matrix." },
                { step: "02", title: "Intentional Introductions", desc: "No endless swiping. You receive one highly curated match at a time." },
                { step: "03", title: "Thoughtful Connection", desc: "Post-date feedback refines your algorithm profile for absolute precision." }
              ].map((item, i) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-10px" }}
                  transition={{ duration: 0.8, delay: i * 0.2 }}
                  className="pl-8 border-l border-primary/30 relative backdrop-blur-sm bg-background/5 p-4 rounded-r-2xl"
                >
                  <div className="absolute left-0 top-6 w-2 h-2 -translate-x-[50%] rounded-full bg-primary shadow-[0_0_10px_var(--color-primary)]" />
                  <h4 className="text-primary font-mono text-xs tracking-widest mb-2">PHASE {item.step}</h4>
                  <h3 className="text-2xl font-medium mb-2 text-foreground">{item.title}</h3>
                  <p className="text-foreground/60 text-lg font-light leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Section 4: In Your Browser ─────────────────────── */}
        <section id="about" className="min-h-[150vh] w-full flex flex-col justify-end pb-32 px-6 md:px-12 relative z-20">
          <div className="max-w-3xl">
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="text-4xl md:text-7xl font-light mb-8 text-foreground"
            >
              A Native Experience, <br/><span className="font-semibold text-primary italic">In Your Browser.</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
              className="text-xl md:text-2xl text-foreground/70 max-w-xl font-light leading-relaxed mb-12"
            >
              VAEL doesn&apos;t require an App Store download. We deliver a secure, swipe-free curated profile discovery right from your browser window, running effortlessly with native PWA capabilities.
            </motion.p>
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.4 }}
            >
              <PwaInstallButton className="px-8 py-4 bg-foreground text-background font-medium rounded-full hover:bg-primary hover:text-background transition-colors hover:shadow-[0_0_20px_rgba(183,110,121,0.5)] disabled:opacity-70 disabled:cursor-not-allowed" />
            </motion.div>
          </div>
        </section>

      </div>
    </div>
  );
}


"use client";

import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export function Navigation() {
  const { scrollY } = useScroll();
  const backgroundColor = useTransform(
    scrollY,
    [0, 50],
    ["rgba(11, 13, 18, 0)", "rgba(11, 13, 18, 0.7)"] // Matches deep slate with opacity
  );

  const borderColor = useTransform(
    scrollY,
    [0, 50],
    ["rgba(31, 34, 43, 0)", "rgba(31, 34, 43, 0.5)"] // Border color var(--border)
  );

  return (
    <motion.nav
      style={{ backgroundColor, borderColor, borderBottomWidth: "1px" }}
      className="ios-safe-x fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 pb-4 pt-[calc(var(--safe-area-top)+1rem)] backdrop-blur-lg md:px-12"
    >
      <Link href="/" className="text-xl font-medium tracking-wide text-foreground flex items-center gap-3 group">
        <span className="w-8 h-8 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
          <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_10px_var(--color-primary)]" />
        </span>
        <span className="hidden sm:inline-block">VAEL</span>
      </Link>
      
      <div className="flex gap-6 md:gap-8 items-center">
        <ThemeToggle />
        <Link href="#why-vael" className="text-sm font-medium text-foreground/70 hover:text-primary transition-colors hidden sm:block">
          The Standard
        </Link>
        <Link href="#how-it-works" className="text-sm font-medium text-foreground/70 hover:text-primary transition-colors hidden sm:block">
          Process
        </Link>
        <Link href="/signin" className="text-sm font-medium text-foreground/70 hover:text-primary transition-colors hidden sm:block">
          Sign In
        </Link>
        <Link
          href="/signup/phone"
          className="text-sm font-medium px-5 py-2.5 rounded-full bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-background transition-all shadow-[0_0_15px_rgba(183,110,121,0.15)] hover:shadow-[0_0_20px_rgba(183,110,121,0.4)]"
        >
          Sign Up
        </Link>
      </div>
    </motion.nav>
  );
}

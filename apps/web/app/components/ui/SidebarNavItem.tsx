"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type SidebarNavItemProps = {
  href: string;
  label: string;
  icon: ReactNode;
  active?: boolean;
  className?: string;
};

export default function SidebarNavItem({ href, label, icon, active, className }: SidebarNavItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        "relative flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-500 group",
        active
          ? "bg-white/80 shadow-[0_10px_30px_-10px_rgba(232,165,178,0.2)]"
          : "hover:bg-primary/[0.03]",
        className
      )}
    >
      {/* Active Indicator Pillar */}
      {active && (
        <motion.div
          layoutId="sidebar-active"
          className="absolute left-0 w-1 h-6 bg-primary rounded-r-full"
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
        />
      )}

      <div className={cn(
        "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500",
        active
          ? "bg-primary text-white shadow-lg shadow-primary/20"
          : "bg-primary/5 text-primary/40 group-hover:bg-primary/10 group-hover:text-primary/60"
      )}>
        <span className="text-lg">{icon}</span>
      </div>

      <span className={cn(
        "text-[10px] uppercase tracking-[0.3em] font-black transition-all duration-500",
        active
          ? "text-foreground"
          : "text-muted-foreground/40 group-hover:text-foreground/60"
      )}>
        {label}
      </span>

      {/* Subtle Hover Glow */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
    </Link>
  );
}


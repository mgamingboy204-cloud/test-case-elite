"use client";

import Link from "next/link";
import type { ReactNode } from "react";

type SidebarNavItemProps = {
  href: string;
  label: string;
  icon: ReactNode;
  active?: boolean;
  className?: string;
};

export default function SidebarNavItem({ href, label, icon, active, className }: SidebarNavItemProps) {
  return (
    <Link href={href} className={`${active ? "rail-link active" : "rail-link"} ${className || ""}`.trim()}>
      <span className="rail-icon">{icon}</span>
      <span className="rail-label">{label}</span>
    </Link>
  );
}

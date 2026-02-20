"use client";

import Link from "next/link";
import type { ReactNode } from "react";

type SidebarNavItemProps = {
  href: string;
  label: string;
  icon: ReactNode;
  active?: boolean;
};

export default function SidebarNavItem({ href, label, icon, active }: SidebarNavItemProps) {
  return (
    <Link href={href} className={active ? "rail-link active" : "rail-link"}>
      <span className="rail-icon">{icon}</span>
      <span className="rail-label">{label}</span>
    </Link>
  );
}

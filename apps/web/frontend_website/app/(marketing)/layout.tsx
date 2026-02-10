"use client";

import React from "react"

import { MarketingShell } from "@/app/components/shells/MarketingShell";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return <MarketingShell>{children}</MarketingShell>;
}

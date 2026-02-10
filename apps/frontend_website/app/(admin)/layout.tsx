"use client";

import React from "react"

import { AdminShell } from "@/app/components/shells/AdminShell";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}

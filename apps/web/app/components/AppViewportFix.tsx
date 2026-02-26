"use client";

import { useEffect } from "react";

import { installAppViewportHeightVar } from "@/lib/viewport";

export function AppViewportFix() {
  useEffect(() => installAppViewportHeightVar(), []);

  return null;
}

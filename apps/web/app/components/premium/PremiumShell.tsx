"use client";

import type { ReactNode } from "react";
import { PremiumBackground3D } from "./PremiumBackground3D";

export function PremiumShell({ children, variant }: { children: ReactNode; variant: "hero" | "auth" }) {
  return (
    <div className="premium-shell">
      <PremiumBackground3D variant={variant} />
      <div className="premium-shell__noise" aria-hidden="true" />
      <div className="premium-shell__content premium-page-enter">{children}</div>
    </div>
  );
}

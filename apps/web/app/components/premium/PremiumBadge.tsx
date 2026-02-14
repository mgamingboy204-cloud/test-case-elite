import type { ReactNode } from "react";

export function PremiumBadge({ children }: { children: ReactNode }) {
  return <span className="premium-badge">{children}</span>;
}

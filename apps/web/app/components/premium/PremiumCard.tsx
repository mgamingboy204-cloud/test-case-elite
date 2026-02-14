import type { HTMLAttributes, ReactNode } from "react";

export function PremiumCard({ children, className, ...props }: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div className={`premium-card ${className ?? ""}`.trim()} {...props}>
      <div className="premium-card__glow" aria-hidden="true" />
      {children}
    </div>
  );
}

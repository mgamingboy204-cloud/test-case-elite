import type { ReactNode } from "react";

export function MarketingContentPage({
  title,
  subtitle,
  children
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section className="marketing-page">
      <div className="marketing-container">
        <h1 style={{ marginBottom: 12 }}>{title}</h1>
        {subtitle ? (
          <p className="marketing-kicker" style={{ marginBottom: 36 }}>
            {subtitle}
          </p>
        ) : null}
        {children}
      </div>
    </section>
  );
}

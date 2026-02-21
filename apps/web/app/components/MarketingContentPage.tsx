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
        <header className="marketing-panel" style={{ padding: "clamp(22px, 5vw, 38px)", marginBottom: 24, boxShadow: "0 22px 58px rgba(10,12,19,0.16)" }}>
          <p className="marketing-kicker" style={{ marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.16em", fontSize: 13 }}>
            Elite Match
          </p>
          <h1
            style={{
              marginBottom: subtitle ? 14 : 0,
              fontFamily: '"Playfair Display", Georgia, serif',
              fontSize: "clamp(2.15rem, 6vw, 3.6rem)",
              letterSpacing: "0.08em",
              lineHeight: 1.02,
              fontWeight: 800,
              textTransform: "uppercase"
            }}
          >
            {title}
          </h1>
          {subtitle ? <p className="marketing-kicker">{subtitle}</p> : null}
        </header>
        {children}
      </div>
    </section>
  );
}

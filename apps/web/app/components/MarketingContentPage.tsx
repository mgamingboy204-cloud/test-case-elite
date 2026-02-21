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
        <header className="marketing-panel" style={{ padding: "clamp(22px, 5vw, 38px)", marginBottom: 24 }}>
          <p className="marketing-kicker" style={{ marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.16em", fontSize: 13 }}>
            Elite Match
          </p>
          <h1
            style={{
              marginBottom: subtitle ? 14 : 0,
              fontFamily: '"Playfair Display", Georgia, serif',
              fontSize: "clamp(2rem, 6vw, 3.4rem)",
              letterSpacing: "0.08em",
              lineHeight: 1.06,
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

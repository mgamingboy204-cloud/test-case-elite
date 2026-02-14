"use client";

const safetyFeatures = [
  {
    icon: "✓",
    title: "Identity Verification",
    desc: "Every member completes a live video verification call before full access.",
  },
  {
    icon: "⚑",
    title: "Report & Block",
    desc: "Report and block tools are available throughout the app with fast moderation response.",
  },
  {
    icon: "⚙",
    title: "Privacy Controls",
    desc: "You choose who can see your profile details and when to reveal personal information.",
  },
];

const tips = [
  "Always meet in a public place for first dates.",
  "Share your plans with a trusted friend.",
  "Never send money or share financial details.",
  "Trust your instincts and report suspicious behavior.",
];

export default function SafetyPage() {
  return (
    <div className="page-bg">
      <div className="premium-wrap">
        <h1>Your Safety Matters</h1>
        <p className="safety-intro">Safety is foundational to every part of the Elite Match experience.</p>

        <div className="safety-grid">
          {safetyFeatures.map((feature) => (
            <article key={feature.title} className="feature-card">
              <div className="feature-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.desc}</p>
            </article>
          ))}
        </div>

        <h2>Safety Tips</h2>
        <div className="tips-wrap">
          {tips.map((tip) => (
            <div key={tip} className="tip-item">
              <span className="tip-check">✓</span>
              <p>{tip}</p>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .page-bg { padding: 2rem 1rem 5rem; }
        .premium-wrap {
          max-width: 920px;
          margin: 0 auto;
          border-radius: 28px;
          padding: 2rem;
          border: 1px solid rgba(255,255,255,0.14);
          background: rgba(15, 15, 15, 0.7);
          backdrop-filter: blur(25px);
          box-shadow: 0 22px 48px rgba(0,0,0,0.32);
        }
        h1 { color: #fff; margin-bottom: 10px; }
        h2 { color: #fff; margin: 1.8rem 0 1rem; }
        .safety-intro { color: rgba(255,255,255,0.82); margin-bottom: 1.4rem; line-height: 1.6; }
        .safety-grid { display: grid; gap: 1rem; grid-template-columns: repeat(3, minmax(0,1fr)); }
        .feature-card {
          border-radius: 20px;
          padding: 1.2rem;
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.04);
          box-shadow: 0 12px 28px rgba(0,0,0,0.28);
        }
        .feature-icon { color: var(--primary); font-weight: 700; margin-bottom: 8px; font-size: 1.2rem; }
        .feature-card h3 { color: #fff; margin-bottom: 8px; }
        .feature-card p { color: rgba(255,255,255,0.82); line-height: 1.6; }
        .tips-wrap { display: grid; gap: 0.75rem; }
        .tip-item {
          display: flex;
          gap: 10px;
          align-items: flex-start;
          padding: 0.9rem 1rem;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 14px;
          background: rgba(255,255,255,0.04);
        }
        .tip-check { color: var(--success); font-weight: 700; }
        .tip-item p { color: rgba(255,255,255,0.84); }
        @media (max-width: 900px) {
          .safety-grid { grid-template-columns: 1fr; }
          .premium-wrap { padding: 1.3rem; border-radius: 22px; }
          .page-bg { padding-top: 1rem; }
        }
      `}</style>
    </div>
  );
}

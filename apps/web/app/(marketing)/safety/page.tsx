"use client";

const safetyFeatures = [
  {
    icon: "\u2714",
    title: "Identity Verification",
    desc: "Every member undergoes a live video verification call to confirm their identity.",
  },
  {
    icon: "\u2691",
    title: "Report & Block",
    desc: "Instantly report or block anyone who makes you uncomfortable. Our team reviews every report.",
  },
  {
    icon: "\u26E8",
    title: "Photo Moderation",
    desc: "All photos are reviewed for appropriateness before being displayed on profiles.",
  },
  {
    icon: "\u2699",
    title: "Privacy Controls",
    desc: "You decide who sees your profile, your photos, and your contact information.",
  },
];

const tips = [
  "Never share financial information with someone you haven't met in person.",
  "Always meet in a public place for your first date.",
  "Tell a friend or family member about your plans.",
  "Trust your instincts - if something feels off, it probably is.",
  "Use the in-app consent system before sharing personal contact info.",
];

export default function SafetyPage() {
  return (
    <div className="safety-shell">
      <h1 style={{ marginBottom: 12 }}>Your Safety Matters</h1>
      <p className="safety-intro">
        At Elite Match, safety is not a feature - it is our foundation.
      </p>

      <div className="safety-grid">
        {safetyFeatures.map((f) => (
          <details key={f.title} className="flip-card">
            <summary className="flip-card-inner" aria-label={f.title}>
              <div className="flip-face front">
                <div className="feature-icon">{f.icon}</div>
                <h4 style={{ marginBottom: 6 }}>{f.title}</h4>
              </div>
              <div className="flip-face back">
                <h4 style={{ marginBottom: 6 }}>{f.title}</h4>
                <p style={{ color: "var(--muted)", fontSize: 14, lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            </summary>
          </details>
        ))}
      </div>

      <h2 style={{ marginBottom: 20 }}>Safety Tips</h2>
      <div className="tips-wrap">
        {tips.map((tip, i) => (
          <div key={i} className="tip-item">
            <span className="tip-check">{"\u2713"}</span>
            <p style={{ color: "var(--text)", fontSize: 14, lineHeight: 1.5, margin: 0 }}>{tip}</p>
          </div>
        ))}
      </div>

      <style jsx>{`
        .safety-shell {
          max-width: 940px;
          margin: 0 auto;
          padding: 56px 24px 90px;
        }
        .safety-intro {
          color: var(--muted);
          font-size: 17px;
          line-height: 1.6;
          margin-bottom: 42px;
          max-width: 620px;
        }
        .safety-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 20px;
          margin-bottom: 52px;
          perspective: 1200px;
        }

        .flip-card {
          list-style: none;
        }
        .flip-card summary {
          list-style: none;
          cursor: pointer;
        }
        .flip-card summary::-webkit-details-marker {
          display: none;
        }

        .flip-card-inner {
          position: relative;
          display: grid;
          transform-style: preserve-3d;
          min-height: 194px;
          transition: transform 380ms ease;
        }
        .flip-face {
          border-radius: 18px;
          border: 1px solid rgba(255,255,255,0.12);
          background: linear-gradient(155deg, rgba(255,255,255,0.11), rgba(255,255,255,0.05));
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          box-shadow: 0 18px 36px rgba(0,0,0,0.24);
          padding: 24px;
          grid-area: 1 / 1;
          backface-visibility: hidden;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .back {
          transform: rotateY(180deg);
        }

        @media (hover: hover) and (pointer: fine) {
          .flip-card:hover .flip-card-inner,
          .flip-card:focus-within .flip-card-inner {
            transform: rotateY(180deg);
          }
        }

        .feature-icon {
          font-size: 24px;
          color: var(--primary);
          margin-bottom: 12px;
        }

        .tips-wrap { display: flex; flex-direction: column; gap: 12px; }
        .tip-item {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          padding: 14px 16px;
          background: rgba(255,255,255,0.05);
          border-radius: var(--radius-md);
          border: 1px solid rgba(255,255,255,0.12);
          backdrop-filter: blur(8px);
        }
        .tip-check {
          color: var(--success);
          font-weight: 700;
          font-size: 16px;
          flex-shrink: 0;
        }

        @media (max-width: 768px) {
          .safety-shell {
            padding: 42px 16px 84px;
          }
          .safety-grid {
            grid-template-columns: 1fr;
            gap: 14px;
          }
          .flip-card-inner {
            min-height: auto;
          }
          .flip-face {
            position: relative;
            min-height: 156px;
          }
          .back {
            transform: none;
            display: none;
            margin-top: 10px;
          }
          .flip-card[open] .back {
            display: flex;
          }
          .flip-card[open] .front {
            border-color: rgba(255,99,99,0.4);
            box-shadow: 0 16px 30px rgba(0,0,0,0.3), 0 0 18px rgba(230,57,70,0.22);
          }
        }
      `}</style>
    </div>
  );
}

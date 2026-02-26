"use client";

import Image from "next/image";

type SplashScreenProps = {
  subtitle?: string;
};

export default function SplashScreen({ subtitle = "from Elite Tech" }: SplashScreenProps) {
  return (
    <>
      <div className="app-splash-shell" aria-label="Elite Match splash screen">
        <div className="app-splash-brand">
          <div className="app-splash-logo" aria-hidden="true">
            <Image src="/icons/icon-192.png" alt="" width={80} height={80} priority />
          </div>
          <div className="app-splash-title">Elite Match</div>
        </div>
        <p className="app-splash-credit">{subtitle}</p>
      </div>
      <style jsx>{`
        .app-splash-shell {
          position: fixed;
          inset: 0;
          overflow: hidden;
          display: grid;
          grid-template-rows: 1fr auto;
          align-items: stretch;
          justify-items: center;
          padding: calc(24px + var(--sat)) calc(20px + var(--sar)) calc(16px + var(--sab)) calc(20px + var(--sal));
          background: radial-gradient(120% 80% at 80% 10%, color-mix(in srgb, var(--accent) 16%, transparent), transparent 62%),
            linear-gradient(180deg, color-mix(in srgb, var(--bg) 96%, transparent), color-mix(in srgb, var(--bg2) 88%, var(--accent) 12%));
        }

        [data-theme="light"] .app-splash-shell {
          background: radial-gradient(120% 86% at 85% 0%, color-mix(in srgb, var(--accent2) 12%, transparent), transparent 60%),
            linear-gradient(180deg, color-mix(in srgb, var(--surface) 88%, white 12%), color-mix(in srgb, var(--bg) 94%, var(--accent2) 6%));
        }

        .app-splash-brand {
          align-self: center;
          display: grid;
          justify-items: center;
          gap: 14px;
          will-change: transform, opacity, filter;
          animation: premiumRise 840ms cubic-bezier(0.22, 0.9, 0.2, 1) both;
        }

        .app-splash-logo {
          width: 84px;
          height: 84px;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 18px 48px color-mix(in srgb, var(--accent) 20%, transparent);
          transform: translateZ(0);
        }

        .app-splash-title {
          font-size: clamp(1.5rem, 2.2vw, 1.75rem);
          font-weight: 500;
          letter-spacing: 0.02em;
          color: var(--text);
        }

        .app-splash-credit {
          margin: 0;
          align-self: end;
          font-size: 14px;
          font-weight: 500;
          color: color-mix(in srgb, var(--text) 55%, transparent);
          text-align: center;
          will-change: opacity;
          animation: creditIn 360ms ease 220ms both;
        }

        @keyframes premiumRise {
          0% { opacity: 0; transform: translate3d(0, 16px, 0) scale(0.98); filter: blur(8px); }
          38% { opacity: 1; transform: translate3d(0, -4px, 0) scale(1); filter: blur(0); }
          72% { opacity: 1; transform: translate3d(0, -2px, 0) scale(0.995); }
          100% { opacity: 0.98; transform: translate3d(0, -8px, 0) scale(0.985); }
        }

        @keyframes creditIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @media (prefers-reduced-motion: reduce) {
          .app-splash-brand,
          .app-splash-credit {
            animation: none;
          }
        }
      `}</style>
    </>
  );
}

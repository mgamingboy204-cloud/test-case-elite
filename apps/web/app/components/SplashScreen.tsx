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
          position: relative;
          min-height: 100vh;
          min-height: 100dvh;
          overflow: hidden;
          display: grid;
          grid-template-rows: 1fr auto;
          align-items: stretch;
          justify-items: center;
          padding: calc(24px + env(safe-area-inset-top, 0px)) calc(20px + env(safe-area-inset-right, 0px)) calc(16px + env(safe-area-inset-bottom, 0px)) calc(20px + env(safe-area-inset-left, 0px));
          background: radial-gradient(120% 80% at 80% 10%, color-mix(in srgb, var(--accent) 16%, transparent), transparent 62%),
            linear-gradient(180deg, color-mix(in srgb, var(--bg) 96%, transparent), color-mix(in srgb, var(--bg2) 88%, var(--accent) 12%));
          animation: splashFade 220ms ease-out;
        }

        [data-theme="light"] .app-splash-shell {
          background: radial-gradient(120% 86% at 85% 0%, color-mix(in srgb, var(--accent2) 12%, transparent), transparent 60%),
            linear-gradient(180deg, color-mix(in srgb, var(--surface) 88%, white 12%), color-mix(in srgb, var(--bg) 94%, var(--accent2) 6%));
        }

        .app-splash-shell::before {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: linear-gradient(180deg, color-mix(in srgb, var(--surface) 6%, transparent), transparent 40%, color-mix(in srgb, var(--bg) 14%, transparent));
        }

        .app-splash-brand {
          align-self: center;
          transform: translateY(-6vh);
          display: grid;
          justify-items: center;
          gap: 14px;
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
        }

        @keyframes splashFade {
          from {
            opacity: 0;
            transform: translateY(2px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .app-splash-shell {
            animation: none;
          }
        }
      `}</style>
    </>
  );
}

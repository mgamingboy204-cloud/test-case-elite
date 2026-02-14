import type { ReactNode } from "react";

interface ActionDockProps {
  onRewind: () => void;
  onPass: () => void;
  onSuperLike: () => void;
  onLike: () => void;
  onBoost: () => void;
  canRewind: boolean;
}

function DockButton({
  onClick,
  ariaLabel,
  children,
  size,
  background,
}: {
  onClick: () => void;
  ariaLabel: string;
  children: ReactNode;
  size: number;
  background: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className="action-dock-btn relative grid place-items-center rounded-full border border-white/35 text-white active:translate-y-[1px]"
      style={{
        width: size,
        height: size,
        background,
      }}
    >
      <span className="pointer-events-none absolute inset-0 rounded-full bg-white/15" />
      <span className="relative">{children}</span>
    </button>
  );
}

export function ActionDock({ onRewind, onPass, onSuperLike, onLike, onBoost, canRewind }: ActionDockProps) {
  return (
    <div className="w-full px-3 pb-[calc(8px+env(safe-area-inset-bottom,0px))] pt-3 sm:px-0">
      <div className="mx-auto flex w-fit items-center gap-3 rounded-[999px] border border-white/20 bg-[rgba(18,22,40,0.35)] px-3 py-2 shadow-[0_14px_28px_rgba(8,10,24,0.28)] backdrop-blur-md">
        <div style={{ opacity: canRewind ? 1 : 0.55 }}>
          <DockButton onClick={onRewind} ariaLabel="Rewind" size={44} background="linear-gradient(145deg,#4a4f66,#2f3346)">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f4c56e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 4v6h6" />
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
          </svg>
          </DockButton>
        </div>
        <DockButton onClick={onPass} ariaLabel="Pass" size={60} background="linear-gradient(145deg,#ff5b81,#db2d63)">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </DockButton>
        <DockButton onClick={onSuperLike} ariaLabel="Super Like" size={50} background="linear-gradient(145deg,#38b7ff,#168be5)">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff" stroke="#fff" strokeWidth="1">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </DockButton>
        <DockButton onClick={onLike} ariaLabel="Like" size={60} background="linear-gradient(145deg,#51d7a5,#18aa77)">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff" stroke="#fff" strokeWidth="1">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </DockButton>
        <DockButton onClick={onBoost} ariaLabel="Boost" size={44} background="linear-gradient(145deg,#6e78a8,#465081)">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7dd7ff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
        </DockButton>
      </div>
      <style jsx>{`
        .action-dock-btn {
          box-shadow: 0 10px 18px rgba(8, 10, 24, 0.34), inset 0 1px 0 rgba(255, 255, 255, 0.3);
          transition: transform 150ms ease, box-shadow 180ms ease, filter 180ms ease;
        }

        .action-dock-btn:active {
          box-shadow: 0 6px 12px rgba(8, 10, 24, 0.26), inset 0 1px 0 rgba(255, 255, 255, 0.22);
          filter: saturate(1.08);
        }

        @media (hover: hover) and (pointer: fine) {
          .action-dock-btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 14px 24px rgba(8, 10, 24, 0.36), inset 0 1px 0 rgba(255, 255, 255, 0.35);
          }
        }

        @media (max-width: 480px) {
          :global(.backdrop-blur-md) {
            backdrop-filter: blur(8px);
          }
        }
      `}</style>
    </div>
  );
}

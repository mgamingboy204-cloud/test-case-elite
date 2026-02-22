"use client";

import { useEffect, type ReactNode, type CSSProperties } from "react";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  const sheetStyle: CSSProperties = {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    background: "linear-gradient(150deg, color-mix(in srgb, var(--surface) 94%, transparent), color-mix(in srgb, var(--surface2) 96%, var(--pearl-panel)) )",
    borderRadius: "32px 32px 0 0",
    maxHeight: "85vh",
    overflow: "auto",
    boxShadow: "var(--shadow-md)",
    zIndex: 1001,
    animation: "slideUp 250ms cubic-bezier(0.32, 0.72, 0, 1)",
    paddingBottom: "env(safe-area-inset-bottom, 16px)",
  };

  return (
    <>
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "var(--overlay)",
          zIndex: 1000,
          animation: "fadeIn 200ms ease",
        }}
        onClick={onClose}
      />
      <div style={sheetStyle} role="dialog" aria-modal="true" aria-label={title}>
        {/* Handle */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "12px 0 4px",
          }}
        >
          <div
            style={{
              width: 36,
              height: 4,
              borderRadius: 2,
              background: "var(--border)",
            }}
          />
        </div>
        {title && (
          <div
            style={{
              padding: "8px 24px 0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h3 style={{ margin: 0 }}>{title}</h3>
            <button
              onClick={onClose}
              style={{ fontSize: 22, color: "var(--muted)", lineHeight: 1 }}
              aria-label="Close"
            >
              &times;
            </button>
          </div>
        )}
        <div style={{ padding: 24 }}>{children}</div>
      </div>
    </>
  );
}

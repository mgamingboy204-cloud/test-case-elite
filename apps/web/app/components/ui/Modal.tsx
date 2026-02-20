"use client";

import { useEffect, type ReactNode, type CSSProperties } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  maxWidth?: number;
  className?: string;
}

export function Modal({ open, onClose, title, children, maxWidth = 480, className }: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  const overlayStyle: CSSProperties = {
    position: "fixed",
    inset: 0,
    background: "var(--overlay)",
    zIndex: 1000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    animation: "fadeIn 200ms ease",
  };

  const contentStyle: CSSProperties = {
    background: "var(--panel)",
    borderRadius: "var(--radius-xl)",
    maxWidth,
    width: "100%",
    maxHeight: "85vh",
    overflow: "auto",
    boxShadow: "var(--shadow-xl)",
    animation: "fadeIn 200ms ease",
  };

  return (
    <div className={className} style={overlayStyle} onClick={onClose} role="dialog" aria-modal="true" aria-label={title}>
      <div style={contentStyle} onClick={(e) => e.stopPropagation()}>
        {title && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "20px 24px 0",
            }}
          >
            <h3 style={{ margin: 0 }}>{title}</h3>
            <button
              onClick={onClose}
              style={{ fontSize: 22, color: "var(--muted)", lineHeight: 1 }}
              aria-label="Close modal"
            >
              &times;
            </button>
          </div>
        )}
        <div style={{ padding: 24 }}>{children}</div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6">
          {/* Cinematic Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-white/40 backdrop-blur-xl"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            style={{ maxWidth }}
            className={cn(
              "relative w-full max-h-[90vh] bg-white border border-white/60 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] rounded-[3rem] flex flex-col overflow-hidden z-10",
              className
            )}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={title}
          >
            {/* Aesthetic Polish - Top Glow */}
            <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-primary/[0.03] to-transparent pointer-events-none" />

            {title && (
              <header className="relative px-10 pt-10 pb-6 flex justify-between items-start">
                <div className="space-y-1">
                  <h3 className="text-3xl font-serif text-foreground/80 italic tracking-tight">{title}</h3>
                  <div className="w-10 h-[1px] bg-primary/20" />
                </div>
                <button
                  onClick={onClose}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-muted-foreground/30 hover:text-primary hover:bg-primary/5 transition-all duration-500 group"
                  aria-label="Close modal"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="group-hover:rotate-90 transition-transform duration-700"
                  >
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </header>
            )}

            <div className="relative flex-grow overflow-y-auto px-10 pb-12">
              {children}
            </div>

            {/* Bottom Fade Gradient for Scroll */}
            <div className="absolute bottom-0 inset-x-0 h-12 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none z-20" />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

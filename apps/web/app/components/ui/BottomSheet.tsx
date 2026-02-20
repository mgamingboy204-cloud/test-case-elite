"use client";

import { useEffect, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
}

export function BottomSheet({ open, onClose, title, children, className }: BottomSheetProps) {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[1000] transition-all"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className={cn(
              "fixed bottom-0 left-0 right-0 max-h-[90vh] bg-white rounded-t-[3rem] shadow-[0_-8px_40px_rgba(0,0,0,0.1)] z-[1001] flex flex-col overflow-hidden pb-safe",
              className
            )}
            role="dialog"
            aria-modal="true"
          >
            {/* Handle Bar */}
            <div className="flex justify-center py-4 cursor-grab active:cursor-grabbing">
              <div className="w-12 h-1.5 rounded-full bg-black/[0.05]" />
            </div>

            {title && (
              <div className="px-8 pb-4 flex justify-between items-center bg-white/50 backdrop-blur-md">
                <h3 className="text-xl font-serif text-foreground m-0 tracking-tight">{title}</h3>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-2xl text-muted-foreground hover:bg-black/5 transition-colors"
                  aria-label="Close"
                >
                  &times;
                </button>
              </div>
            )}

            <div className="flex-grow overflow-y-auto px-8 pb-10">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

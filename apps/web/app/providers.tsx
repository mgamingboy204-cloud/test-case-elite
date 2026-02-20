"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { createQueryClient } from "../lib/queryClient";
import { AuthProvider } from "../lib/session";

type Theme = "light" | "dark";

type ThemeCtx = {
  theme: Theme;
  toggle: () => void;
};

const ThemeContext = createContext<ThemeCtx>({ theme: "light", toggle: () => undefined });

export function useTheme() {
  return useContext(ThemeContext);
}

export interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

type ToastCtx = {
  toasts: Toast[];
  addToast: (message: string, type?: Toast["type"]) => void;
  removeToast: (id: string) => void;
};

const ToastContext = createContext<ToastCtx>({
  toasts: [],
  addToast: () => undefined,
  removeToast: () => undefined
});

export function useToast() {
  return useContext(ToastContext);
}

export default function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => createQueryClient());
  const [theme, setTheme] = useState<Theme>("light");
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("em_theme") as Theme | null;
    if (stored === "light" || stored === "dark") {
      setTheme(stored);
      return;
    }
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setTheme("dark");
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.style.colorScheme = theme;
    localStorage.setItem("em_theme", theme);
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme((value) => (value === "light" ? "dark" : "light"));
  }, []);

  const addToast = useCallback((message: string, type: Toast["type"] = "info") => {
    const id = Math.random().toString(36).slice(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const themeValue = useMemo(() => ({ theme, toggle }), [theme, toggle]);
  const toastValue = useMemo(() => ({ toasts, addToast, removeToast }), [toasts, addToast, removeToast]);

  return (
    <ThemeContext.Provider value={themeValue}>
      <ToastContext.Provider value={toastValue}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <div className="noise-overlay" />
            {children}
          </AuthProvider>
          <ToastContainer toasts={toasts} removeToast={removeToast} />
          {process.env.NODE_ENV === "development" ? <ReactQueryDevtools initialIsOpen={false} /> : null}
        </QueryClientProvider>
      </ToastContext.Provider>
    </ThemeContext.Provider>
  );
}

function ToastContainer({ toasts, removeToast }: { toasts: Toast[]; removeToast: (id: string) => void }) {
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed top-8 right-8 z-[9999] flex flex-col gap-4 max-w-sm w-full"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="bg-white/60 backdrop-blur-2xl border border-white/60 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] rounded-3xl p-6 flex justify-between items-center gap-6 animate-in slide-in-from-right-8 duration-700 ease-out group"
        >
          <div className="flex items-center gap-4">
            <div className={`w-2.5 h-2.5 rounded-full shadow-sm ${toast.type === "success" ? "bg-emerald-500 shadow-emerald-500/20" :
                toast.type === "error" ? "bg-red-500 shadow-red-500/20" :
                  "bg-primary shadow-primary/20"
              }`} />
            <span className="text-sm font-serif italic text-foreground/80 leading-tight">
              {toast.message}
            </span>
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-muted-foreground/30 hover:text-primary transition-colors text-xl font-light"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}

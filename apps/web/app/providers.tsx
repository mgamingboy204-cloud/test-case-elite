"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { AuthProvider } from "@/lib/session";
import { AppRouteGuard } from "@/app/components/auth/AppRouteGuard";

/* ── Theme ── */
type Theme = "light" | "dark";

interface ThemeCtx {
  theme: Theme;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeCtx>({ theme: "dark", toggle: () => {} });

export function useTheme() {
  return useContext(ThemeContext);
}

/* ── Toast ── */
export interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

interface ToastCtx {
  toasts: Toast[];
  addToast: (message: string, type?: Toast["type"]) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastCtx>({
  toasts: [],
  addToast: () => {},
  removeToast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

/* ── Root Provider ── */
export function Providers({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [toasts, setToasts] = useState<Toast[]>([]);

  /* Init theme from localStorage or system preference */
  useEffect(() => {
    const stored = localStorage.getItem("em_theme") as Theme | null;
    if (stored) {
      setTheme(stored);
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setTheme("dark");
    }
  }, []);

  /* Sync to DOM */
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("em_theme", theme);
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme((t) => (t === "light" ? "dark" : "light"));
  }, []);

  /* Toast helpers */
  const addToast = useCallback((message: string, type: Toast["type"] = "info") => {
    const id = Math.random().toString(36).slice(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
        <AuthProvider>
          <AppRouteGuard />
          {children}
        </AuthProvider>
        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </ToastContext.Provider>
    </ThemeContext.Provider>
  );
}

/* ── Toast Container ── */
function ToastContainer({
  toasts,
  removeToast,
}: {
  toasts: Toast[];
  removeToast: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 16,
        right: 16,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        maxWidth: 360,
        width: "100%",
      }}
      aria-live="polite"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className="fade-in"
          style={{
            background:
              t.type === "success"
                ? "var(--success)"
                : t.type === "error"
                ? "var(--danger)"
                : "var(--text)",
            color: "#fff",
            padding: "12px 16px",
            borderRadius: "var(--radius-md)",
            fontSize: 14,
            fontWeight: 500,
            boxShadow: "var(--shadow-md)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
          }}
        >
          <span>{t.message}</span>
          <button
            onClick={() => removeToast(t.id)}
            style={{ opacity: 0.7, fontSize: 18, lineHeight: 1 }}
            aria-label="Dismiss"
          >
            &times;
          </button>
        </div>
      ))}
    </div>
  );
}

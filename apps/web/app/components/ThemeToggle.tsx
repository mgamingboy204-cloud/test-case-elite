"use client";

import { useTheme } from "./ThemeProvider";

type ThemeToggleProps = {
  variant?: "icon" | "switch";
  label?: string;
};

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 4.2 13 2h-2l1 2.2Zm0 17.6L11 24h2l-1-2.2Zm9-8.8 2.2-1-2.2-1v2Zm-17.8 0L1 12l2.2 1v-2Zm13.9-6.2 1.7-1.7-1.4-1.4-1.7 1.7 1.4 1.4Zm-9.6 9.6-1.7 1.7 1.4 1.4 1.7-1.7-1.4-1.4Zm9.6 1.4 1.7 1.7 1.4-1.4-1.7-1.7-1.4 1.4Zm-9.6-9.6-1.7-1.7-1.4 1.4 1.7 1.7 1.4-1.4ZM12 7.2a4.8 4.8 0 1 0 0 9.6 4.8 4.8 0 0 0 0-9.6Z"
        fill="currentColor"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M15.2 3.1c-.8 3.7.3 7.6 3.1 10.4 1.6 1.6 3.6 2.6 5.7 3-1.7 2.9-4.9 4.8-8.5 4.8-5.4 0-9.8-4.4-9.8-9.8 0-3.6 1.9-6.8 4.8-8.5.4 2.2 1.4 4.1 3 5.7 2.8 2.8 6.7 3.9 10.4 3.1a9.8 9.8 0 0 1-8.7 5.2 9.8 9.8 0 0 1 0-19.6Z"
        fill="currentColor"
      />
    </svg>
  );
}

export default function ThemeToggle({ variant = "icon", label = "Toggle theme" }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  if (variant === "switch") {
    return (
      <button className="theme-switch" type="button" onClick={toggleTheme} aria-label={label}>
        <span className="theme-switch__label">{isDark ? "Dark" : "Light"}</span>
        <span className="theme-switch__track">
          <span className="theme-switch__thumb" />
        </span>
      </button>
    );
  }

  return (
    <button className="icon-button" type="button" onClick={toggleTheme} aria-label={label}>
      {isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}

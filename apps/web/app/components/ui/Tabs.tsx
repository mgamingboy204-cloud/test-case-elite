"use client";

import type { CSSProperties } from "react";

interface Tab {
  label: string;
  value: string;
}

interface TabsProps {
  tabs: Tab[];
  active: string;
  onChange: (value: string) => void;
  style?: CSSProperties;
}

export function Tabs({ tabs, active, onChange, style }: TabsProps) {
  return (
    <div
      role="tablist"
      style={{
        display: "flex",
        background: "color-mix(in srgb, var(--surface-2) 92%, var(--bg) 8%)",
        border: "1px solid color-mix(in srgb, var(--border) 82%, var(--accent) 18%)",
        borderRadius: "var(--radius-full)",
        padding: 3,
        gap: 2,
        ...style,
      }}
    >
      {tabs.map((tab) => (
        <button
          key={tab.value}
          role="tab"
          type="button"
          aria-selected={active === tab.value}
          onClick={() => onChange(tab.value)}
          style={{
            flex: 1,
            padding: "12px 16px",
            minHeight: 44,
            fontSize: 14,
            fontWeight: active === tab.value ? 600 : 500,
            borderRadius: "var(--radius-full)",
            background: active === tab.value ? "color-mix(in srgb, var(--surface-1) 84%, var(--surface-2) 16%)" : "transparent",
            color: active === tab.value ? "var(--text)" : "var(--text-secondary)",
            boxShadow: active === tab.value ? "0 8px 20px color-mix(in srgb, var(--accent) 14%, transparent)" : "none",
            transition: "all 200ms ease",
            whiteSpace: "nowrap",
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

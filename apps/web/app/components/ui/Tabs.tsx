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
        background: "color-mix(in srgb, var(--surface2) 84%, transparent)",
        border: "1px solid var(--border)",
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
            padding: "10px 16px",
            fontSize: 14,
            fontWeight: active === tab.value ? 600 : 500,
            borderRadius: "var(--radius-full)",
            background: active === tab.value ? "var(--panel)" : "transparent",
            color: active === tab.value ? "var(--text)" : "var(--text-secondary)",
            boxShadow: active === tab.value ? "var(--shadow)" : "none",
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

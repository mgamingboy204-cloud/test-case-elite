import type { ReactNode, CSSProperties } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  style?: CSSProperties;
}

export function PageHeader({ title, subtitle, action, style }: PageHeaderProps) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 16,
        padding: "24px 0 16px",
        ...style,
      }}
    >
      <div>
        <h1 style={{ margin: 0, fontSize: 24 }}>{title}</h1>
        {subtitle && (
          <p style={{ margin: "4px 0 0", color: "var(--muted)", fontSize: 15 }}>
            {subtitle}
          </p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

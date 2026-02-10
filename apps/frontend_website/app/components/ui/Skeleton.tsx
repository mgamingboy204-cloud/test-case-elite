import type { CSSProperties } from "react";

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  radius?: number | string;
  style?: CSSProperties;
}

export function Skeleton({
  width = "100%",
  height = 20,
  radius = "var(--radius-sm)",
  style,
}: SkeletonProps) {
  return (
    <div
      className="skeleton"
      aria-hidden="true"
      style={{
        width,
        height,
        borderRadius: radius,
        ...style,
      }}
    />
  );
}

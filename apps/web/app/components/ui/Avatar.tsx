"use client";

import { useState, type CSSProperties } from "react";

interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: number;
  style?: CSSProperties;
  className?: string;
}

export function Avatar({ src, name = "?", size = 44, style, className }: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const baseStyle: CSSProperties = {
    width: size,
    height: size,
    borderRadius: "50%",
    overflow: "hidden",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "var(--primary-light)",
    color: "var(--primary)",
    fontWeight: 700,
    fontSize: size * 0.38,
    ...style,
  };

  if (src && !failed) {
    return (
      <div className={className} style={baseStyle}>
        <img
          src={src || "/placeholder.svg"}
          alt={name}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          onError={() => setFailed(true)}
        />
      </div>
    );
  }

  return (
    <div className={className} style={baseStyle} aria-label={name}>
      {initials}
    </div>
  );
}

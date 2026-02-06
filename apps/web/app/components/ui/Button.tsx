"use client";

import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  fullWidth?: boolean;
};

export default function Button({ variant = "primary", fullWidth = false, className = "", ...props }: ButtonProps) {
  const classes = `btn btn-${variant}${fullWidth ? " btn-block" : ""}${className ? ` ${className}` : ""}`;
  return <button className={classes} {...props} />;
}

"use client";

import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CardProps extends HTMLMotionProps<"div"> {
  hoverEffect?: boolean;
  glass?: boolean;
}

export function Card({
  children,
  className,
  hoverEffect = false,
  glass = true,
  onClick,
  ...props
}: CardProps) {
  const isInteractive = !!onClick;

  return (
    <motion.div
      {...(isInteractive || hoverEffect ? {
        whileHover: { y: -4, boxShadow: "0 20px 40px -12px rgba(0,0,0,0.08)" },
        whileTap: { scale: 0.99 }
      } : {})}
      onClick={onClick}
      className={cn(
        "relative overflow-hidden rounded-[2.5rem] border border-black/[0.05] transition-all duration-500",
        glass && "bg-white/70 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.04)]",
        !glass && "bg-white shadow-sm",
        isInteractive && "cursor-pointer hover:border-primary/40",
        className
      )}
      {...props}
    >
      {/* Internal Premium Highlight - Soft Rose Glow */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-primary/[0.02] to-transparent" />

      <div className="relative z-10 w-full h-full">
        {children as React.ReactNode}
      </div>
    </motion.div>
  );
}

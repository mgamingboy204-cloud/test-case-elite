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

export function Card({ children, className, hoverEffect = false, glass = true, onClick, ...props }: CardProps) {
  const isInteractive = !!onClick;

  return (
    <motion.div
      {...(isInteractive || hoverEffect ? { whileHover: { y: -3 }, whileTap: { scale: 0.995 } } : {})}
      onClick={onClick}
      className={cn(
        "relative overflow-hidden rounded-[1.5rem] border border-white/70 transition-all",
        glass ? "bg-white/80 shadow-[0_20px_45px_-30px_rgba(26,10,14,0.55)] backdrop-blur-xl" : "bg-white",
        isInteractive && "cursor-pointer hover:border-primary/35",
        className,
      )}
      {...props}
    >
      {children as React.ReactNode}
    </motion.div>
  );
}

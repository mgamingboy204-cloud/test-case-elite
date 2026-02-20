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
        whileHover: { y: -4, boxShadow: "0 20px 40px -12px rgba(0,0,0,0.5)" },
        whileTap: { scale: 0.99 }
      } : {})}
      onClick={onClick}
      className={cn(
        "relative overflow-hidden rounded-[2rem] border border-white/10 transition-colors duration-500",
        glass && "bg-card/40 backdrop-blur-xl",
        !glass && "bg-card",
        isInteractive && "cursor-pointer hover:border-primary/30",
        className
      )}
      {...props}
    >
      {/* Internal Premium Highlight */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-white/[0.03] to-transparent" />
      
      <div className="relative z-10 w-full h-full">
        {children as React.ReactNode}
      </div>
    </motion.div>
  );
}

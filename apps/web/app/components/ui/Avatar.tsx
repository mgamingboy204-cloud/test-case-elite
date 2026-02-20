"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function Avatar({ src, name = "?", size = 44, className, style }: AvatarProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-secondary shadow-inner",
        className
      )}
      style={{ width: size, height: size, ...style }}
    >
      <AnimatePresence mode="wait">
        {src && !failed ? (
          <motion.img
            key="image"
            src={src}
            alt={name}
            initial={{ opacity: 0 }}
            animate={{ opacity: isLoaded ? 1 : 0 }}
            exit={{ opacity: 0 }}
            onLoad={() => setIsLoaded(true)}
            onError={() => setFailed(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <motion.div
            key="fallback"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex h-full w-full items-center justify-center font-bold tracking-tighter premium-gradient text-primary-foreground"
            style={{ fontSize: size * 0.38 }}
          >
            {initials}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Premium Glass Overlay */}
      <div className="absolute inset-0 rounded-full border border-white/5 pointer-events-none" />
    </motion.div>
  );
}

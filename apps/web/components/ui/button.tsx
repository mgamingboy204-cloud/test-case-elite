"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { motion, HTMLMotionProps } from "framer-motion";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'glass';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'default', ...props }, ref) => {
    
    const baseStyles = "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden";
    
    const variants = {
      primary: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_4px_14px_0_rgba(183,110,121,0.39)] dark:shadow-[0_4px_14px_0_rgba(183,110,121,0.39)]",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      ghost: "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent",
      glass: "bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 backdrop-blur-md text-foreground hover:bg-black/10 dark:hover:bg-white/10 shadow-lg",
    };
    
    const sizes = {
      default: "h-12 px-6 py-2",
      sm: "h-9 rounded-md px-3",
      lg: "h-14 rounded-2xl px-8 text-base",
      icon: "h-10 w-10",
    };

    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.98 }}
        whileHover={{ scale: 1.02 }}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...(props as HTMLMotionProps<"button">)}
      >
        <span className="relative z-10">{props.children}</span>
        {variant === 'primary' && (
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent flex-1 to-white/20 opacity-0 transition-opacity hover:opacity-100 z-0"/>
        )}
      </motion.button>
    );
  }
)
Button.displayName = "Button"

export { Button }

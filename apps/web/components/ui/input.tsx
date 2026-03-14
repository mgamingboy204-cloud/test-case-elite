import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, label, ...props }, ref) => {
    return (
      <div className="flex flex-col w-full relative group">
        {label && (
          <label className="text-sm text-foreground/70 mb-2 ml-1 font-medium tracking-wide">
            {label}
          </label>
        )}
        <input
          type={type}
          className={cn(
            "flex h-12 w-full border-b border-[#C89B90]/30 bg-transparent px-0 py-2 text-lg md:text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-foreground/20 focus-visible:outline-none focus-visible:border-[#C89B90] disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-500",
            error && "border-red-500/50 focus-visible:border-red-500/80",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="text-xs text-red-400 mt-2 ml-1 animate-in slide-in-from-top-1 opacity-90">
            {error}
          </p>
        )}
      </div>
    );
  }
)
Input.displayName = "Input"

export { Input }

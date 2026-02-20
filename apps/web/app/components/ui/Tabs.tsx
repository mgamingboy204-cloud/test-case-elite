import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Tab {
  label: string;
  value: string;
}

interface TabsProps {
  tabs: Tab[];
  active: string;
  onChange: (value: string) => void;
  className?: string;
}

export function Tabs({ tabs, active, onChange, className }: TabsProps) {
  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex items-center p-1.5 rounded-full bg-white/60 backdrop-blur-xl border border-black/[0.05] shadow-sm",
        className
      )}
    >
      {tabs.map((tab) => (
        <button
          key={tab.value}
          role="tab"
          type="button"
          aria-selected={active === tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            "relative px-6 py-2 text-sm font-medium transition-all duration-500 rounded-full whitespace-nowrap",
            active === tab.value
              ? "text-white bg-primary shadow-[0_4px_12px_rgba(232,165,178,0.4)]"
              : "text-muted-foreground hover:text-foreground hover:bg-black/5"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

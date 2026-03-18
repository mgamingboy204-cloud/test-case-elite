"use client";

import { type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type AppShellProps = {
  children: ReactNode;
  header?: ReactNode;
  bottomNav?: ReactNode;
  overlay?: ReactNode;
  sidebar?: ReactNode;
  chromeHidden?: boolean;
  scrollRef?: (element: HTMLElement | null) => void;
  contentClassName?: string;
  contentInnerClassName?: string;
};

export function AppShell({
  children,
  header,
  bottomNav,
  overlay,
  sidebar,
  chromeHidden = false,
  scrollRef,
  contentClassName,
  contentInnerClassName,
}: AppShellProps) {
  const shellStyle = {
    ["--app-shell-header-offset" as string]: `calc(var(--safe-area-top) + ${chromeHidden ? "0px" : "var(--app-header-height)"})`,
    ["--app-shell-bottom-offset" as string]: `calc(var(--safe-area-bottom) + ${chromeHidden ? "0px" : "var(--app-bottom-nav-height)"})`,
  } as CSSProperties;

  return (
    <div
      className="ios-app-shell mobile-container desktop-container flex w-screen flex-row overflow-hidden bg-background transition-colors duration-500"
      style={shellStyle}
    >
      {sidebar}

      <div className="app-shell-frame relative flex min-w-0 flex-1 overflow-hidden">
        {header ? (
          <div className="app-shell-header-layer absolute inset-x-0 top-0 z-40 min-[769px]:z-30">
            {header}
          </div>
        ) : null}

        <main
          ref={scrollRef}
          className={cn(
            "app-shell-content-layer absolute inset-x-0 left-0 right-0 overflow-y-auto overflow-x-hidden bg-background no-scrollbar",
                      contentClassName,
          )}
          style={{
            WebkitOverflowScrolling: "touch",
            overscrollBehaviorY: "contain",
          }}
        >
          <div className={cn("w-full min-h-full", contentInnerClassName)}>{children}</div>
        </main>

        {bottomNav ? (
          <div className="app-shell-bottom-layer pointer-events-none absolute inset-x-0 bottom-0 z-50 min-[769px]:hidden">
            {bottomNav}
          </div>
        ) : null}

        <div className="app-shell-overlay-layer pointer-events-none absolute inset-0 z-[60]">{overlay}</div>
      </div>
    </div>
  );
}

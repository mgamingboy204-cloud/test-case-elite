"use client";

import { useCallback, useMemo, useState } from "react";
import { usePwaInstall } from "@/hooks/usePwaInstall";

type Props = {
  className?: string;
};

export function PwaInstallButton({ className }: Props) {
  const { canPrompt, installed, isIos, lastOutcome, promptInstall } = usePwaInstall();
  const [fallbackOpen, setFallbackOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const label = useMemo(() => {
    if (installed) return "Installed";
    return "Install Application";
  }, [installed]);

  const onClick = useCallback(async () => {
    if (installed) return;

    if (!canPrompt) {
      setFallbackOpen(true);
      return;
    }

    setBusy(true);
    await promptInstall();
    setBusy(false);
  }, [canPrompt, installed, promptInstall]);

  const showNote = fallbackOpen || lastOutcome === "dismissed";

  return (
    <div className="flex flex-col items-start gap-3">
      <button
        type="button"
        onClick={onClick}
        disabled={installed || busy}
        className={className}
        aria-disabled={installed || busy}
      >
        {busy ? "Opening install…" : label}
      </button>

      {showNote ? (
        <div className="max-w-md rounded-2xl border border-border/40 bg-background/40 backdrop-blur-xl px-5 py-4 text-sm text-foreground/70">
          {isIos ? (
            <p>
              Install isn’t available as a popup on iPhone/iPad. Tap <span className="text-foreground">Share</span> →{" "}
              <span className="text-foreground">Add to Home Screen</span>.
            </p>
          ) : (
            <p>
              Install is currently unavailable in this browser/session. If you’re in private mode or on an unsupported
              browser, try again in Chrome/Edge.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}


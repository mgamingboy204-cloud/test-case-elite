"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

function isIosLike() {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent.toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(ua);
  // iPadOS can masquerade as Mac; detect touch support.
  const isIpadOs = /macintosh/.test(ua) && "ontouchend" in document;
  return isIOS || isIpadOs;
}

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [lastOutcome, setLastOutcome] = useState<"accepted" | "dismissed" | null>(null);

  useEffect(() => {
    const onBeforeInstallPrompt = (e: Event) => {
      // Chrome / Edge emit this. Prevent the mini-infobar and store for a user gesture.
      e.preventDefault?.();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    const onAppInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  const canPrompt = !!deferredPrompt && !installed;
  const isIos = useMemo(() => isIosLike(), []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return { ok: false as const, reason: "unavailable" as const };

    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      setLastOutcome(choice.outcome);

      // The event can only be used once.
      setDeferredPrompt(null);

      return { ok: true as const, outcome: choice.outcome };
    } catch {
      setDeferredPrompt(null);
      return { ok: false as const, reason: "failed" as const };
    }
  }, [deferredPrompt]);

  return {
    canPrompt,
    installed,
    isIos,
    lastOutcome,
    promptInstall,
  };
}


"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

type ScrollChromeContextValue = {
  chromeHidden: boolean;
  registerScrollElement: (element: HTMLElement | null) => void;
};

const ScrollChromeContext = createContext<ScrollChromeContextValue | null>(null);

const MOBILE_BREAKPOINT = 768;
const TOP_REVEAL_OFFSET = 24;
const HIDE_THRESHOLD = 32;
const SHOW_THRESHOLD = 20;
const MIN_SCROLL_DELTA = 2;

function isTextInput(element: Element | null) {
  if (!(element instanceof HTMLElement)) return false;
  const tagName = element.tagName;
  return element.isContentEditable || tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT";
}

export function ScrollChromeProvider({ children }: { children: ReactNode }) {
  const [chromeHidden, setChromeHidden] = useState(false);
  const [activeScrollElement, setActiveScrollElement] = useState<HTMLElement | null>(null);
  const lastScrollTopRef = useRef(0);
  const directionTravelRef = useRef(0);
  const frameRef = useRef<number | null>(null);
  const keyboardOpenRef = useRef(false);
  const visibleRef = useRef(true);
  const reducedMotionRef = useRef(false);

  const setVisible = useCallback((nextVisible: boolean) => {
    if (visibleRef.current === nextVisible) return;
    visibleRef.current = nextVisible;
    setChromeHidden(!nextVisible);
  }, []);

  const forceVisible = useCallback(() => {
    directionTravelRef.current = 0;
    setVisible(true);
  }, [setVisible]);

  const shouldSuspend = useCallback(() => {
    if (typeof window === "undefined") return true;
    if (window.innerWidth > MOBILE_BREAKPOINT) return true;
    if (reducedMotionRef.current) return true;
    if (keyboardOpenRef.current) return true;
    if (isTextInput(document.activeElement)) return true;
    if (document.querySelector('[aria-modal="true"], [role="dialog"], [data-scroll-chrome-lock="true"]')) return true;
    return false;
  }, []);

  const evaluateScroll = useCallback((element: HTMLElement) => {
    const nextScrollTop = element.scrollTop;

    if (shouldSuspend()) {
      lastScrollTopRef.current = nextScrollTop;
      forceVisible();
      return;
    }

    if (nextScrollTop <= TOP_REVEAL_OFFSET) {
      lastScrollTopRef.current = nextScrollTop;
      forceVisible();
      return;
    }

    const delta = nextScrollTop - lastScrollTopRef.current;
    lastScrollTopRef.current = nextScrollTop;

    if (Math.abs(delta) < MIN_SCROLL_DELTA) return;

    if (Math.sign(delta) !== Math.sign(directionTravelRef.current)) {
      directionTravelRef.current = delta;
    } else {
      directionTravelRef.current += delta;
    }

    if (directionTravelRef.current >= HIDE_THRESHOLD) {
      setVisible(false);
      directionTravelRef.current = 0;
      return;
    }

    if (directionTravelRef.current <= -SHOW_THRESHOLD) {
      setVisible(true);
      directionTravelRef.current = 0;
    }
  }, [forceVisible, setVisible, shouldSuspend]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotionPreference = () => {
      reducedMotionRef.current = mediaQuery.matches;
      if (mediaQuery.matches) forceVisible();
    };

    const syncKeyboardState = () => {
      const vv = window.visualViewport;
      keyboardOpenRef.current = Boolean(vv && window.innerWidth <= MOBILE_BREAKPOINT && window.innerHeight - vv.height > 120);
      if (keyboardOpenRef.current) forceVisible();
    };

    const onFocusIn = () => {
      if (isTextInput(document.activeElement)) forceVisible();
    };

    const onFocusOut = () => {
      window.setTimeout(syncKeyboardState, 0);
    };

    syncMotionPreference();
    syncKeyboardState();
    mediaQuery.addEventListener("change", syncMotionPreference);
    window.visualViewport?.addEventListener("resize", syncKeyboardState);
    window.addEventListener("resize", syncKeyboardState);
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);

    return () => {
      mediaQuery.removeEventListener("change", syncMotionPreference);
      window.visualViewport?.removeEventListener("resize", syncKeyboardState);
      window.removeEventListener("resize", syncKeyboardState);
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
    };
  }, [forceVisible]);

  useEffect(() => {
    const element = activeScrollElement;
    if (!element) return;

    lastScrollTopRef.current = element.scrollTop;
    directionTravelRef.current = 0;
    if (element.scrollTop <= TOP_REVEAL_OFFSET) {
      frameRef.current = window.requestAnimationFrame(() => {
        frameRef.current = null;
        forceVisible();
      });
    }


    const onScroll = () => {
      if (frameRef.current !== null) return;
      frameRef.current = window.requestAnimationFrame(() => {
        frameRef.current = null;
        evaluateScroll(element);
      });
    };

    element.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      element.removeEventListener("scroll", onScroll);
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [activeScrollElement, evaluateScroll, forceVisible]);

  const registerScrollElement = useCallback((element: HTMLElement | null) => {
    setActiveScrollElement(element);
  }, []);

  const value = useMemo(() => ({ chromeHidden, registerScrollElement }), [chromeHidden, registerScrollElement]);

  return <ScrollChromeContext.Provider value={value}>{children}</ScrollChromeContext.Provider>;
}

export function useScrollChromeController() {
  const context = useContext(ScrollChromeContext);
  if (!context) {
    throw new Error("useScrollChromeController must be used within ScrollChromeProvider");
  }
  return context;
}

"use client";

import { type CSSProperties, useEffect, useState } from "react";

type ProbeState = {
  standalone: boolean;
  htmlBg: string;
  bodyBg: string;
};

const probeStyle: CSSProperties = {
  position: "fixed",
  left: "10px",
  bottom: "10px",
  zIndex: 9999,
  borderRadius: "999px",
  padding: "6px 10px",
  fontSize: "11px",
  lineHeight: 1.2,
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  backgroundColor: "rgba(0, 0, 0, 0.78)",
  color: "#fff",
  border: "1px solid rgba(255,255,255,0.2)",
  maxWidth: "calc(100vw - 20px)",
  pointerEvents: "none"
};

export function SafeAreaDebugProbe() {
  const debugEnabled = process.env.NEXT_PUBLIC_SA_DEBUG === "1";
  const [state, setState] = useState<ProbeState>({ standalone: false, htmlBg: "", bodyBg: "" });

  useEffect(() => {
    if (!debugEnabled) {
      return;
    }

    const standalone = window.matchMedia("(display-mode: standalone)").matches;
    const htmlBg = window.getComputedStyle(document.documentElement).backgroundColor;
    const bodyBg = window.getComputedStyle(document.body).backgroundColor;
    setState({ standalone, htmlBg, bodyBg });

    const onTap = () => {
      const element = document.elementFromPoint(window.innerWidth / 2, window.innerHeight - 2);
      // eslint-disable-next-line no-console
      console.log("[SA_DEBUG] bottom element", {
        tagName: element?.tagName,
        id: element?.id,
        className: element?.className,
        computedBackground: element ? window.getComputedStyle(element).backgroundColor : "n/a"
      });
    };

    window.addEventListener("click", onTap, { once: true });

    return () => {
      window.removeEventListener("click", onTap);
    };
  }, [debugEnabled]);

  if (!debugEnabled) {
    return null;
  }

  return (
    <div style={probeStyle} aria-hidden>
      <div>standalone: {String(state.standalone)}</div>
      <div>html bg: {state.htmlBg || "(pending)"}</div>
      <div>body bg: {state.bodyBg || "(pending)"}</div>
    </div>
  );
}

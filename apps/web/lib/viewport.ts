"use client";

let raf = 0;

export function installAppViewportHeightVar() {
  if (typeof window === "undefined") return () => {};

  const vv = window.visualViewport;

  const update = () => {
    if (raf) cancelAnimationFrame(raf);

    raf = requestAnimationFrame(() => {
      const height = Math.round((vv?.height ?? window.innerHeight) || 0);
      if (height > 0) {
        document.documentElement.style.setProperty("--app-vh", `${height}px`);
      }
    });
  };

  update();

  window.addEventListener("resize", update, { passive: true });
  if (vv) {
    vv.addEventListener("resize", update, { passive: true });
    vv.addEventListener("scroll", update, { passive: true });
  }

  return () => {
    if (raf) cancelAnimationFrame(raf);

    window.removeEventListener("resize", update);
    if (vv) {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    }
  };
}

"use client";

import { useEffect, useRef, useState } from "react";

type Variant = "hero" | "auth";

interface Orb {
  x: number;
  y: number;
  r: number;
  dx: number;
  dy: number;
  hue: number;
}

export function PremiumBackground3D({ variant }: { variant: Variant }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lowPower = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4;
    setEnabled(!reduceMotion && !lowPower);
  }, []);

  useEffect(() => {
    if (!enabled || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const orbs: Orb[] = [
      { x: 0.25, y: 0.22, r: variant === "hero" ? 0.24 : 0.2, dx: 0.00022, dy: 0.00016, hue: 260 },
      { x: 0.78, y: 0.35, r: variant === "hero" ? 0.28 : 0.22, dx: -0.00018, dy: 0.00014, hue: 28 },
      { x: 0.58, y: 0.12, r: variant === "hero" ? 0.18 : 0.14, dx: 0.00012, dy: 0.0002, hue: 218 }
    ];

    let raf = 0;
    let running = true;
    let mouseX = 0.5;
    let mouseY = 0.5;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const onPointer = (event: MouseEvent) => {
      mouseX = event.clientX / window.innerWidth;
      mouseY = event.clientY / window.innerHeight;
    };

    const onVisibility = () => {
      running = !document.hidden;
      if (running) raf = requestAnimationFrame(draw);
      else cancelAnimationFrame(raf);
    };

    const draw = () => {
      if (!running) return;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);

      for (const orb of orbs) {
        orb.x += orb.dx;
        orb.y += orb.dy;
        if (orb.x < -0.2 || orb.x > 1.2) orb.dx *= -1;
        if (orb.y < -0.2 || orb.y > 1.2) orb.dy *= -1;

        const px = (orb.x + (mouseX - 0.5) * 0.06) * w;
        const py = (orb.y + (mouseY - 0.5) * 0.06) * h;
        const radius = orb.r * Math.min(w, h);
        const g = ctx.createRadialGradient(px, py, radius * 0.2, px, py, radius);
        g.addColorStop(0, `hsla(${orb.hue}, 80%, 70%, 0.22)`);
        g.addColorStop(1, `hsla(${orb.hue}, 80%, 60%, 0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(px, py, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", onPointer, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onPointer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [enabled, variant]);

  return (
    <div className={`premium-bg premium-bg--${variant}`} aria-hidden="true">
      <div className="premium-bg__gradient" />
      <div className="premium-bg__light premium-bg__light--left" />
      <div className="premium-bg__light premium-bg__light--right" />
      {enabled ? <canvas ref={canvasRef} className="premium-bg__canvas" /> : null}
    </div>
  );
}

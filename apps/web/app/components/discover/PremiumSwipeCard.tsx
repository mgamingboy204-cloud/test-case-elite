"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CardGlassOverlay } from "@/app/components/discover/CardGlassOverlay";

interface PremiumSwipeCardProps {
  photo: string;
  name: string;
  age: number;
  city: string;
  bio: string;
  verified: boolean;
  onSwipe: (direction: "left" | "right") => void;
  disabled?: boolean;
}

const SWIPE_THRESHOLD = 110;

export function PremiumSwipeCard({ photo, name, age, city, bio, verified, onSwipe, disabled = false }: PremiumSwipeCardProps) {
  const [isCoarse, setIsCoarse] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [swiping, setSwiping] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [dragY, setDragY] = useState(0);
  const [tiltX, setTiltX] = useState(0);
  const [tiltY, setTiltY] = useState(0);

  const startRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const pointerQuery = window.matchMedia("(pointer: coarse)");
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const updateState = () => {
      setIsCoarse(pointerQuery.matches);
      setReduceMotion(motionQuery.matches);
    };

    updateState();
    pointerQuery.addEventListener("change", updateState);
    motionQuery.addEventListener("change", updateState);

    return () => {
      pointerQuery.removeEventListener("change", updateState);
      motionQuery.removeEventListener("change", updateState);
    };
  }, []);

  useEffect(() => {
    if (!isCoarse || reduceMotion) {
      setTiltX(0);
      setTiltY(0);
      return;
    }

    const timer = window.setInterval(() => {
      setTiltX((Math.random() - 0.5) * 1.5);
      setTiltY((Math.random() - 0.5) * 1.8);
    }, 2400);

    return () => window.clearInterval(timer);
  }, [isCoarse, reduceMotion]);

  const highlightStyle = useMemo(
    () => ({
      transform: `translate(${tiltY * 2.2}px, ${tiltX * 1.8}px)`,
      opacity: reduceMotion ? 0.2 : 0.34,
    }),
    [tiltX, tiltY, reduceMotion]
  );

  const rotateZ = dragX * 0.02;

  return (
    <div
      className="premium-swipe-card group relative mx-auto w-[min(92vw,360px)] overflow-hidden rounded-[30px]"
      style={{
        height: "clamp(480px, 68dvh, 610px)",
        touchAction: "none",
        userSelect: "none",
        willChange: "transform",
        transform: `translate3d(${dragX}px, ${dragY}px, 0) rotate(${rotateZ}deg) rotateX(${reduceMotion ? 0 : tiltX}deg) rotateY(${reduceMotion ? 0 : tiltY}deg)`,
        transition: swiping ? "none" : "transform 260ms cubic-bezier(0.2, 0.75, 0.25, 1)",
      }}
      onPointerDown={(event) => {
        if (disabled) return;
        setSwiping(true);
        startRef.current = { x: event.clientX, y: event.clientY };
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event) => {
        if (disabled) return;

        if (swiping) {
          const dx = event.clientX - startRef.current.x;
          const dy = (event.clientY - startRef.current.y) * 0.24;
          setDragX(dx);
          setDragY(dy);
          return;
        }

        if (isCoarse || reduceMotion) return;
        const rect = event.currentTarget.getBoundingClientRect();
        const relX = (event.clientX - rect.left) / rect.width - 0.5;
        const relY = (event.clientY - rect.top) / rect.height - 0.5;
        setTiltX(Math.max(-2.5, Math.min(2.5, relY * -4.2)));
        setTiltY(Math.max(-2.5, Math.min(2.5, relX * 4.2)));
      }}
      onPointerUp={() => {
        if (!swiping) return;
        setSwiping(false);

        if (dragX > SWIPE_THRESHOLD) {
          onSwipe("right");
        } else if (dragX < -SWIPE_THRESHOLD) {
          onSwipe("left");
        }

        setDragX(0);
        setDragY(0);
      }}
      onPointerLeave={() => {
        if (!swiping) {
          setTiltX(0);
          setTiltY(0);
        }
      }}
      onPointerCancel={() => {
        setSwiping(false);
        setDragX(0);
        setDragY(0);
      }}
    >
      <img src={photo || "/placeholder.svg"} alt={name} className="absolute inset-0 h-full w-full object-cover object-center" draggable={false} />

      <div className="absolute inset-x-0 top-0 h-[34%] bg-gradient-to-b from-black/45 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-[58%] bg-gradient-to-t from-black/85 via-black/35 to-transparent" />

      <div
        aria-hidden
        className="pointer-events-none absolute -inset-[12%]"
        style={{
          ...highlightStyle,
          background: "radial-gradient(circle at 22% 12%, rgba(255,255,255,0.38), rgba(255,255,255,0.05) 36%, rgba(255,255,255,0) 62%)",
          mixBlendMode: "screen",
        }}
      />

      <CardGlassOverlay name={name} age={age} city={city} bio={bio} verified={verified} />

      <style jsx>{`
        .premium-swipe-card {
          box-shadow:
            0 22px 40px rgba(4, 6, 18, 0.25),
            0 8px 16px rgba(8, 10, 28, 0.35);
        }

        @media (prefers-reduced-motion: reduce) {
          .premium-swipe-card {
            transition: none;
          }
        }

        @media (max-width: 480px) {
          .premium-swipe-card {
            box-shadow:
              0 14px 28px rgba(4, 6, 18, 0.23),
              0 6px 14px rgba(8, 10, 28, 0.28);
          }
          .premium-swipe-card :global(.backdrop-blur-md) {
            backdrop-filter: blur(8px);
          }
        }
      `}</style>
    </div>
  );
}

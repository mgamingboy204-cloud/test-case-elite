"use client";

import { Canvas } from "@react-three/fiber";
import { Environment, Preload } from "@react-three/drei";
import { Suspense } from "react";
import { HeroPanels } from "./hero-panels";
import { TimelineCarousel } from "./timeline-carousel";
import { PhoneModel } from "./phone-model";

export function SceneCanvas() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none bg-transparent">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        dpr={[1, 2]} // Support high-DPI displays
      >
        <Suspense fallback={null}>
          <Environment preset="city" />
          
          {/* Cinematic Lighting Setup for Rose Gold / Slate aesthetic */}
          <ambientLight intensity={0.4} />
          {/* Key Light (Rose Gold tint) */}
          <directionalLight position={[5, 5, 5]} intensity={1.5} color="#b76e79" />
          {/* Rim Light */}
          <spotLight position={[0, 10, -10]} intensity={2} color="#ffffff" angle={0.5} penumbra={1} />
          
          <HeroPanels />
          <TimelineCarousel />
          <PhoneModel />
          
          <Preload all />
        </Suspense>
      </Canvas>
    </div>
  );
}

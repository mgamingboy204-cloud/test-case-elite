"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import { HeroPanels } from "./hero-panels";
import { TimelineCarousel } from "./timeline-carousel";
import { PhoneModel } from "./phone-model";

export function SceneCanvas() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 bg-transparent">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        dpr={[1, 1.5]}
      >
        <Suspense fallback={null}>
          <Environment preset="city" />
          <ambientLight intensity={0.4} />
          <directionalLight position={[5, 5, 5]} intensity={1.5} color="#b76e79" />
          <spotLight position={[0, 10, -10]} intensity={2} color="#ffffff" angle={0.5} penumbra={1} />
          <HeroPanels />
          <TimelineCarousel />
          <PhoneModel />
        </Suspense>
      </Canvas>
    </div>
  );
}

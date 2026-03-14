import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { useScroll } from "framer-motion";
import * as THREE from "three";
import { RoundedBox, Html } from "@react-three/drei";

export function PhoneModel() {
  const { scrollYProgress } = useScroll();
  const groupRef = useRef<THREE.Group>(null);
  
  const materials = useMemo(() => ({
    frame: new THREE.MeshStandardMaterial({
      color: "#1a1a1a",
      metalness: 0.9,
      roughness: 0.2,
    }),
    screen: new THREE.MeshStandardMaterial({
      color: "#000000",
      metalness: 0.1,
      roughness: 0.1,
    })
  }), []);

  useFrame(() => {
    if (groupRef.current) {
      const scroll = scrollYProgress.get();
      
      // The Phone section roughly runs from scroll 0.7 to 1.0
      if (scroll > 0.6) {
        // Rotates into the center of the screen
        const t = (scroll - 0.6) * 2.5; // normalize to 0..1 roughly
        const clampedT = Math.min(Math.max(t, 0), 1);
        
        // Move from bottom right to center
        const targetX = THREE.MathUtils.lerp(5, 0, clampedT);
        const targetY = THREE.MathUtils.lerp(-5, 0, clampedT);
        const targetZ = THREE.MathUtils.lerp(-10, -2, clampedT);
        
        // Rotate from flat to facing the user
        const targetRotX = THREE.MathUtils.lerp(Math.PI / 3, 0, clampedT);
        const targetRotY = THREE.MathUtils.lerp(Math.PI / 4, 0, clampedT);
        const targetRotZ = THREE.MathUtils.lerp(0.5, 0, clampedT);
        
        groupRef.current.position.set(
          THREE.MathUtils.lerp(groupRef.current.position.x, targetX, 0.05),
          THREE.MathUtils.lerp(groupRef.current.position.y, targetY, 0.05),
          THREE.MathUtils.lerp(groupRef.current.position.z, targetZ, 0.05)
        );
        
        groupRef.current.rotation.set(
          THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRotX, 0.05),
          THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotY, 0.05),
          THREE.MathUtils.lerp(groupRef.current.rotation.z, targetRotZ, 0.05)
        );
      } else {
        groupRef.current.position.y = -10;
      }
    }
  });

  return (
    <group ref={groupRef} position={[5, -10, -10]}>
      {/* Phone Frame */}
      <RoundedBox args={[2.8, 5.8, 0.3]} radius={0.3} smoothness={8} material={materials.frame}>
        {/* Screen */}
        <mesh position={[0, 0, 0.16]}>
          <planeGeometry args={[2.6, 5.6]} />
          <primitive object={materials.screen} attach="material" />
        </mesh>
        
        {/* Dynamic HTML inside the 3D phone screen */}
        <Html 
          transform 
          wrapperClass="html-screen" 
          distanceFactor={1.5} 
          position={[0, 0, 0.17]} 
          zIndexRange={[100, 0]}
          occlude
        >
          <div className="w-[260px] h-[560px] bg-[#0b0d12] rounded-3xl overflow-hidden flex flex-col relative text-white border border-[#1f222b]">
             {/* Phone UI Header */}
             <div className="w-full pt-8 pb-4 px-6 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent absolute top-0 z-10">
               <span className="text-xs font-semibold tracking-widest text-[#b76e79]">ELITE</span>
             </div>
             
             {/* Curated Profile Mockup */}
             <div className="flex-1 w-full bg-slate-900 relative">
               {/* Profile Image Mock (Abstract Gradient) */}
               <div className="absolute inset-0 bg-gradient-to-br from-[#2a2d36] to-[#0b0d12]" />
               <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(183,110,121,0.2),transparent_70%)]" />
               
               <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#0b0d12] to-transparent">
                  <div className="h-4 w-3/4 bg-white/20 rounded-full mb-3" />
                  <div className="h-3 w-1/2 bg-white/10 rounded-full" />
               </div>
             </div>
             
             {/* Bottom Nav Mock */}
             <div className="h-16 w-full bg-[#0b0d12] flex justify-around items-center border-t border-white/5 relative z-10">
                <div className="w-6 h-6 rounded-full bg-[#b76e79]/30 border border-[#b76e79]" />
                <div className="w-6 h-6 rounded-full bg-white/10" />
                <div className="w-6 h-6 rounded-full bg-white/10" />
             </div>
          </div>
        </Html>
      </RoundedBox>
    </group>
  );
}

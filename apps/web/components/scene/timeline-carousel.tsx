import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { useScroll } from "framer-motion";
import * as THREE from "three";
import { Float, Torus } from "@react-three/drei";

export function TimelineCarousel() {
  const { scrollYProgress } = useScroll();
  const groupRef = useRef<THREE.Group>(null);
  
  const material = useMemo(() => new THREE.MeshStandardMaterial({
    color: "#d4af37", // Champagne gold
    metalness: 1,
    roughness: 0.15,
  }), []);

  useFrame(() => {
    if (groupRef.current) {
      const scroll = scrollYProgress.get();
      
      // The timeline section roughly runs from scroll 0.4 to 0.7
      if (scroll > 0.25) {
        // Bring it up from behind/below
        const targetY = THREE.MathUtils.mapLinear(scroll, 0.3, 0.7, -5, 5);
        const targetZ = THREE.MathUtils.mapLinear(scroll, 0.3, 0.7, -8, -2);
        const targetRotX = scroll * Math.PI * 2;
        
        groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetY, 0.1);
        groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, targetZ, 0.1);
        groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRotX, 0.1);
        groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, scroll * Math.PI, 0.1);
      } else {
        // Hide it out of view when above
        groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, -15, 0.1);
      }
    }
  });

  return (
    <group ref={groupRef} position={[0, -15, -8]}>
      <Float speed={1.5} rotationIntensity={1} floatIntensity={1}>
        <Torus args={[3, 0.03, 32, 100]} material={material} />
        <Torus args={[2.5, 0.01, 32, 100]} rotation={[Math.PI / 2, 0, 0]} material={material} />
        <Torus args={[2, 0.05, 32, 100]} rotation={[0, Math.PI / 2, 0]} material={material} />
      </Float>
    </group>
  );
}

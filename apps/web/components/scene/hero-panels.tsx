import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { useScroll } from "framer-motion";
import * as THREE from "three";
import { Float, RoundedBox } from "@react-three/drei";

export function HeroPanels() {
  const { scrollYProgress } = useScroll();
  const groupRef = useRef<THREE.Group>(null);
  
  // Materials configured for high-end aesthetic
  const materials = useMemo(() => ({
    roseGold: new THREE.MeshStandardMaterial({
      color: "#b76e79",
      metalness: 0.9,
      roughness: 0.1,
      envMapIntensity: 1.5,
    }),
    slate: new THREE.MeshStandardMaterial({
      color: "#1f222b",
      metalness: 0.6,
      roughness: 0.4,
      envMapIntensity: 1,
    }),
    pearl: new THREE.MeshStandardMaterial({
      color: "#f8f9fa",
      metalness: 0.3,
      roughness: 0.2,
      envMapIntensity: 0.8,
    })
  }), []);

  useFrame((state) => {
    // Scroll smoothly drives the Z position (camera push through)
    // We use a smoothed scroll value for native feel
    const scroll = scrollYProgress.get();
    
    if (groupRef.current) {
      // The panels start at their defined positions. As scroll increases,
      // they move along positive Z, passing BEHIND the camera (which is at z=5)
      // We multiply by a large factor to make them fly past completely.
      const targetZ = scroll * 30;
      // Slight interpolation for extreme smoothness
      groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, targetZ, 0.1);
      
      // Gentle rotation as it flies past
      const targetRotY = scroll * Math.PI * 0.2;
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotY, 0.1);
    }
  });

  return (
    <group ref={groupRef}>
      {/* Panel 1 - Right Rose Gold */}
      <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
        <RoundedBox args={[3, 5, 0.1]} radius={0.05} smoothness={4} position={[3, 1, -2]} rotation={[0.1, -0.2, 0]} material={materials.roseGold} />
      </Float>
      
      {/* Panel 2 - Left Slate/Navy */}
      <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
        <RoundedBox args={[4, 6, 0.15]} radius={0.05} smoothness={4} position={[-3, -1, -5]} rotation={[-0.1, 0.3, 0.1]} material={materials.slate} />
      </Float>
      
      {/* Panel 3 - Center Back Pearl/Slate */}
      <Float speed={2.5} rotationIntensity={0.4} floatIntensity={1.2}>
        <RoundedBox args={[5, 7, 0.1]} radius={0.05} smoothness={4} position={[0, 0, -10]} rotation={[0, 0, -0.05]} material={materials.slate} />
      </Float>

      {/* Abstract floating shards */}
      <Float speed={3} rotationIntensity={2} floatIntensity={2}>
        <mesh position={[-2, 3, -1]} rotation={[1, 1, 1]} material={materials.roseGold}>
          <octahedronGeometry args={[0.3, 0]} />
        </mesh>
      </Float>
      
      <Float speed={2} rotationIntensity={1.5} floatIntensity={1.5}>
        <mesh position={[4, -2, -3]} rotation={[0.5, -0.5, 0]} material={materials.roseGold}>
          <octahedronGeometry args={[0.4, 0]} />
        </mesh>
      </Float>
    </group>
  );
}

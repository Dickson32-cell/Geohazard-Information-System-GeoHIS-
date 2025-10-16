import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, Box, Torus, Float } from '@react-three/drei';

// Animated geometric shapes component
function AnimatedShapes() {
  const groupRef = useRef();

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.2;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Floating spheres */}
      <Float speed={1.4} rotationIntensity={1} floatIntensity={2}>
        <Sphere args={[0.5, 32, 32]} position={[-3, 2, -2]}>
          <meshStandardMaterial
            color="#b45309"
            metalness={0.7}
            roughness={0.3}
            transparent
            opacity={0.6}
          />
        </Sphere>
      </Float>

      <Float speed={1.2} rotationIntensity={1.5} floatIntensity={1.5}>
        <Box args={[1, 1, 1]} position={[3, -1, -3]}>
          <meshStandardMaterial
            color="#1e3a8a"
            metalness={0.8}
            roughness={0.2}
            transparent
            opacity={0.5}
          />
        </Box>
      </Float>

      <Float speed={1.6} rotationIntensity={0.8} floatIntensity={2.5}>
        <Torus args={[0.8, 0.3, 16, 32]} position={[0, -2, -1]}>
          <meshStandardMaterial
            color="#374151"
            metalness={0.6}
            roughness={0.4}
            transparent
            opacity={0.4}
          />
        </Torus>
      </Float>

      {/* Additional geometric shapes */}
      <Float speed={1.8} rotationIntensity={1.2} floatIntensity={1.8}>
        <Sphere args={[0.3, 16, 16]} position={[-2, -3, 2]}>
          <meshStandardMaterial
            color="#fbbf24"
            metalness={0.9}
            roughness={0.1}
            transparent
            opacity={0.7}
          />
        </Sphere>
      </Float>

      <Float speed={1.3} rotationIntensity={0.9} floatIntensity={2.2}>
        <Box args={[0.6, 0.6, 0.6]} position={[2, 3, 1]}>
          <meshStandardMaterial
            color="#1e40af"
            metalness={0.5}
            roughness={0.5}
            transparent
            opacity={0.5}
          />
        </Box>
      </Float>
    </group>
  );
}

// Main 3D scene component
function Scene() {
  return (
    <div className="fixed inset-0 -z-10">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 60 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[10, 10, 5]}
          intensity={1}
          color="#ffffff"
        />
        <pointLight
          position={[-10, -10, -5]}
          intensity={0.5}
          color="#b45309"
        />

        {/* Animated shapes */}
        <AnimatedShapes />

        {/* Fog for depth */}
        <fog attach="fog" args={['#1e3a8a', 8, 25]} />
      </Canvas>
    </div>
  );
}

export default Scene;
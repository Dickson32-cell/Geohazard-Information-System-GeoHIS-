import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial, Float, OrbitControls } from '@react-three/drei';

const AnimatedSphere = ({ position, color, speed, scale = 1 }) => {
  const meshRef = useRef();

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.getElapsedTime() * speed;
      meshRef.current.rotation.y = state.clock.getElapsedTime() * speed * 0.5;
      meshRef.current.position.y = position[1] + Math.sin(state.clock.getElapsedTime() * speed * 2) * 0.2;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
      <Sphere ref={meshRef} args={[scale, 100, 100]} position={position}>
        <MeshDistortMaterial
          color={color}
          attach="material"
          distort={0.4}
          speed={2}
          roughness={0.2}
          metalness={0.8}
        />
      </Sphere>
    </Float>
  );
};

const RotatingGlobe = () => {
  const globeRef = useRef();

  useFrame((state) => {
    if (globeRef.current) {
      globeRef.current.rotation.y = state.clock.getElapsedTime() * 0.1;
    }
  });

  return (
    <group ref={globeRef}>
      <Sphere args={[2, 64, 64]} position={[0, 0, -8]}>
        <meshStandardMaterial
          color="#1e3a8a"
          roughness={0.7}
          metalness={0.1}
          wireframe={false}
        />
      </Sphere>
      {/* Add some orbiting elements */}
      <Sphere args={[0.1, 16, 16]} position={[3, 1, -6]}>
        <meshStandardMaterial color="#d4af37" emissive="#d4af37" emissiveIntensity={0.3} />
      </Sphere>
      <Sphere args={[0.08, 16, 16]} position={[-2.5, -1.5, -7]}>
        <meshStandardMaterial color="#d4af37" emissive="#d4af37" emissiveIntensity={0.2} />
      </Sphere>
    </group>
  );
};

const FloatingGeometry = () => {
  const groupRef = useRef();

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.3) * 0.2;
      groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.2;
    }
  });

  return (
    <group ref={groupRef} position={[-4, 2, -5]}>
      <mesh>
        <octahedronGeometry args={[0.8]} />
        <meshStandardMaterial color="#374151" wireframe />
      </mesh>
      <mesh position={[1.5, 0, 0]}>
        <tetrahedronGeometry args={[0.6]} />
        <meshStandardMaterial color="#d4af37" emissive="#d4af37" emissiveIntensity={0.1} />
      </mesh>
    </group>
  );
};

const Scene3D = () => {
  return (
    <div className="fixed top-0 left-0 w-full h-full -z-10">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 75 }}
        gl={{ antialias: true, alpha: true }}
      >
        <fog attach="fog" args={['#1e3a8a', 5, 15]} />

        {/* Lighting setup */}
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[10, 10, 5]}
          intensity={1}
          color="#ffffff"
          castShadow
        />
        <pointLight
          position={[-10, -10, -5]}
          intensity={0.5}
          color="#d4af37"
        />
        <pointLight
          position={[5, -5, 5]}
          intensity={0.3}
          color="#3b82f6"
        />

        {/* 3D Elements */}
        <RotatingGlobe />
        <FloatingGeometry />
        <AnimatedSphere position={[-3, -2, -3]} color="#1e3a8a" speed={0.15} scale={0.8} />
        <AnimatedSphere position={[3, 3, -4]} color="#d4af37" speed={0.2} scale={0.6} />
        <AnimatedSphere position={[1, -3, -2]} color="#374151" speed={0.25} scale={0.7} />

        {/* Subtle orbit controls for user interaction */}
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          enableRotate={true}
          autoRotate={true}
          autoRotateSpeed={0.5}
          maxPolarAngle={Math.PI / 2}
          minPolarAngle={Math.PI / 3}
        />
      </Canvas>
    </div>
  );
};

export default Scene3D;
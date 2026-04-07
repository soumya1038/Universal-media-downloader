import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function FloatingSphere({ mouse, theme = 'dark' }) {
  const meshRef = useRef();
  const targetRotation = useRef({ x: 0, y: 0 });

  const geometry = useMemo(() => new THREE.SphereGeometry(2, 64, 64), []);

  const baseColor = '#ffb199'; // Coral accent
  const emissiveColor = theme === 'dark' ? '#352b47' : '#f8fafc'; // Deep plum for dark, soft pearl for light

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    const t = state.clock.elapsedTime;

    // Fluid organic rotation
    meshRef.current.rotation.x += delta * 0.05;
    meshRef.current.rotation.y += delta * 0.08;
    meshRef.current.rotation.z += delta * 0.03;

    // Cursor-reactive tilt with smooth interpolation
    if (mouse.current) {
      targetRotation.current.x = mouse.current.y * 0.2;
      targetRotation.current.y = mouse.current.x * 0.2;
    }

    meshRef.current.rotation.x += (targetRotation.current.x - meshRef.current.rotation.x) * 0.02;
    meshRef.current.rotation.y += (targetRotation.current.y - meshRef.current.rotation.y) * 0.02;

    // Gentle floating
    meshRef.current.position.y = Math.sin(t * 0.4) * 0.3;
    meshRef.current.position.x = Math.cos(t * 0.3) * 0.15;

    // Soft blob effect via independent scaling
    meshRef.current.scale.x = 1 + Math.sin(t * 0.6) * 0.08;
    meshRef.current.scale.y = 1 + Math.cos(t * 0.5) * 0.06;
    meshRef.current.scale.z = 1 + Math.sin(t * 0.7) * 0.08;
  });

  return (
    <group>
      {/* Main frosted blob */}
      <mesh ref={meshRef} geometry={geometry}>
        <meshPhysicalMaterial
          color={baseColor}
          emissive={emissiveColor}
          emissiveIntensity={0.15}
          roughness={0.25}
          metalness={0.05}
          transmission={0.8}
          thickness={1.5}
          clearcoat={0.8}
          clearcoatRoughness={0.2}
          transparent
          opacity={0.9}
        />
      </mesh>
    </group>
  );
}

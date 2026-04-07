import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const PARTICLE_COUNT = 200;

export default function ParticleField({ mouse }) {
  const pointsRef = useRef();
  const targetOffset = useRef({ x: 0, y: 0 });
  const currentOffset = useRef({ x: 0, y: 0 });

  const [positions, sizes] = useMemo(() => {
    const pos = new Float32Array(PARTICLE_COUNT * 3);
    const sz = new Float32Array(PARTICLE_COUNT);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 15;
      sz[i] = Math.random() * 3 + 0.5;
    }

    return [pos, sz];
  }, []);

  useFrame((state) => {
    if (!pointsRef.current) return;
    const t = state.clock.elapsedTime;

    // Cursor-based parallax offset
    if (mouse.current) {
      targetOffset.current.x = mouse.current.x * 0.15;
      targetOffset.current.y = mouse.current.y * 0.1;
    }

    currentOffset.current.x += (targetOffset.current.x - currentOffset.current.x) * 0.01;
    currentOffset.current.y += (targetOffset.current.y - currentOffset.current.y) * 0.01;

    pointsRef.current.rotation.y = t * 0.02 + currentOffset.current.x;
    pointsRef.current.rotation.x = currentOffset.current.y * 0.5;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={PARTICLE_COUNT}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={PARTICLE_COUNT}
          array={sizes}
          itemSize={1}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#ffcebc"
        size={0.12}
        transparent
        opacity={0.5}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

import React, { useRef, useEffect, useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import FloatingSphere from './Objects/FloatingSphere';
import ParticleField from './Objects/ParticleField';

export default function BackgroundScene({ disabled = false, theme = 'dark' }) {
  const mouse = useRef({ x: 0, y: 0 });
  const [webglSupported, setWebglSupported] = useState(true);

  useEffect(() => {
    // Check WebGL support
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) setWebglSupported(false);
    } catch {
      setWebglSupported(false);
    }

    // Track mouse
    const handleMouseMove = (e) => {
      mouse.current = {
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: -(e.clientY / window.innerHeight) * 2 + 1,
      };
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  if (disabled || !webglSupported) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          background: 'radial-gradient(ellipse at 50% 50%, rgba(255,177,153,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 6], fov: 60 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.6} />
          <pointLight position={[10, 10, 10]} intensity={0.8} color="#ffb199" />
          <pointLight position={[-10, -10, -10]} intensity={0.5} color="#836bb4" />
          <FloatingSphere mouse={mouse} theme={theme} />
          <ParticleField mouse={mouse} />
        </Suspense>
      </Canvas>
    </div>
  );
}

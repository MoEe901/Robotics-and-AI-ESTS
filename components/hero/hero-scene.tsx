"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
import { useRef, useState } from "react";
import { type Points as PointsType } from "three";

function buildParticlePositions(): Float32Array {
  const count = 1200;
  const data = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    data[i * 3] = (Math.random() - 0.5) * 8;
    data[i * 3 + 1] = (Math.random() - 0.5) * 5;
    data[i * 3 + 2] = (Math.random() - 0.5) * 8;
  }
  return data;
}

function ParticleField() {
  const points = useRef<PointsType>(null);
  const elapsed = useRef(0);
  const [positions] = useState(buildParticlePositions);

  useFrame(({ pointer }, delta) => {
    if (!points.current) return;
    elapsed.current += delta;
    points.current.rotation.y = elapsed.current * 0.07 + pointer.x * 0.2;
    points.current.rotation.x = pointer.y * 0.12;
  });

  return (
    <Points ref={points} positions={positions} stride={3}>
      <PointMaterial transparent color="#7faeff" size={0.04} sizeAttenuation depthWrite={false} />
    </Points>
  );
}

export function HeroScene() {
  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
        <ambientLight intensity={0.4} />
        <ParticleField />
      </Canvas>
    </div>
  );
}

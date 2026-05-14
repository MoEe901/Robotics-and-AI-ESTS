"use client";

/**
 * HeroFloatingShapes — Three.js geometric scene for the hero section.
 *
 * Renders 3 floating wireframe+translucent geometric primitives with:
 *  - Slow self-rotation per shape
 *  - Gentle sin-wave vertical float (unique phase per shape)
 *  - Spring-eased mouse parallax (the shapes lean toward the pointer)
 *  - Violet + cyan point lights for ambient glow
 *  - IntersectionObserver: canvas only renders when the hero is visible
 *  - Respects prefers-reduced-motion (motion collapses to zero-speed)
 */

import { Canvas, useFrame } from "@react-three/fiber";
import { AdaptiveDpr } from "@react-three/drei";
import {
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as THREE from "three";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ShapeConfig {
  geometry: "icosahedron" | "torusknot" | "octahedron";
  position: [number, number, number];
  scale: number;
  rotSpeed: [number, number, number];
  floatSpeed: number;
  floatAmp: number;
  floatPhase: number;
  wireColor: string;
  solidColor: string;
  solidOpacity: number;
  wireOpacity: number;
  parallaxStrength: [number, number];
}

// ---------------------------------------------------------------------------
// Per-shape config — positions tuned for right-side hero layout
// ---------------------------------------------------------------------------
const SHAPES: ShapeConfig[] = [
  {
    geometry: "icosahedron",
    position: [3.1, 0.4, -1.2],
    scale: 1.18,
    rotSpeed: [0.08, 0.14, 0.04],
    floatSpeed: 0.52,
    floatAmp: 0.22,
    floatPhase: 0,
    wireColor: "#7c3aed",
    solidColor: "#7c3aed",
    solidOpacity: 0.055,
    wireOpacity: 0.38,
    parallaxStrength: [0.22, 0.14],
  },
  {
    geometry: "torusknot",
    position: [-2.8, -0.7, -2.0],
    scale: 0.68,
    rotSpeed: [0.07, 0.1, 0.055],
    floatSpeed: 0.38,
    floatAmp: 0.3,
    floatPhase: Math.PI * 0.7,
    wireColor: "#06b6d4",
    solidColor: "#06b6d4",
    solidOpacity: 0.045,
    wireOpacity: 0.30,
    parallaxStrength: [0.18, 0.10],
  },
  {
    geometry: "octahedron",
    position: [0.6, 2.2, -3.2],
    scale: 0.9,
    rotSpeed: [0.11, 0.07, 0.09],
    floatSpeed: 0.65,
    floatAmp: 0.16,
    floatPhase: Math.PI * 1.4,
    wireColor: "#a78bfa",
    solidColor: "#a78bfa",
    solidOpacity: 0.05,
    wireOpacity: 0.26,
    parallaxStrength: [0.28, 0.18],
  },
];

// ---------------------------------------------------------------------------
// FloatingShape — a single animated mesh pair (solid + wireframe)
// ---------------------------------------------------------------------------

function FloatingShape({
  cfg,
  reduced,
}: {
  cfg: ShapeConfig;
  reduced: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const clock = useRef(cfg.floatPhase);

  const geom = useMemo<THREE.BufferGeometry>(() => {
    if (cfg.geometry === "icosahedron")
      return new THREE.IcosahedronGeometry(1, 1);
    if (cfg.geometry === "torusknot")
      return new THREE.TorusKnotGeometry(0.72, 0.22, 96, 18);
    return new THREE.OctahedronGeometry(1, 0);
  }, [cfg.geometry]);

  const solidMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(cfg.solidColor),
        transparent: true,
        opacity: cfg.solidOpacity,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    [cfg.solidColor, cfg.solidOpacity],
  );

  const wireMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(cfg.wireColor),
        wireframe: true,
        transparent: true,
        opacity: cfg.wireOpacity,
        depthWrite: false,
      }),
    [cfg.wireColor, cfg.wireOpacity],
  );

  // Dispose geometries + materials on unmount
  useEffect(
    () => () => {
      geom.dispose();
      solidMat.dispose();
      wireMat.dispose();
    },
    [geom, solidMat, wireMat],
  );

  useFrame((state, delta) => {
    const g = groupRef.current;
    if (!g) return;

    // Skip heavy animation work when reduced-motion is requested
    const speed = reduced ? 0 : 1;

    clock.current += delta * speed;

    // Rotation
    g.rotation.x += cfg.rotSpeed[0] * delta * speed;
    g.rotation.y += cfg.rotSpeed[1] * delta * speed;
    g.rotation.z += cfg.rotSpeed[2] * delta * speed;

    // Vertical float
    const floatY =
      Math.sin(clock.current * cfg.floatSpeed) * cfg.floatAmp * speed;

    // Mouse parallax — spring-like by lerping toward target
    const px = state.pointer.x * cfg.parallaxStrength[0] * speed;
    const py = state.pointer.y * cfg.parallaxStrength[1] * speed;

    g.position.x = THREE.MathUtils.lerp(
      g.position.x,
      cfg.position[0] + px,
      0.04,
    );
    g.position.y = THREE.MathUtils.lerp(
      g.position.y,
      cfg.position[1] + floatY + py,
      0.04,
    );
    g.position.z = cfg.position[2];
  });

  return (
    <group ref={groupRef} position={cfg.position} scale={cfg.scale}>
      <mesh geometry={geom} material={solidMat} />
      <mesh geometry={geom} material={wireMat} />
    </group>
  );
}

// ---------------------------------------------------------------------------
// Scene contents — lights + shapes
// ---------------------------------------------------------------------------

function SceneContent({ reduced }: { reduced: boolean }) {
  return (
    <>
      {/* Violet fill light — gives the icosahedron its purple cast */}
      <pointLight
        color="#6d28d9"
        intensity={1.8}
        position={[4, 3, 0]}
        distance={12}
      />
      {/* Cyan rim light */}
      <pointLight
        color="#0891b2"
        intensity={1.2}
        position={[-4, -2, -1]}
        distance={10}
      />
      {/* Soft fuchsia accent */}
      <pointLight
        color="#c026d3"
        intensity={0.6}
        position={[0, 4, -2]}
        distance={8}
      />

      {SHAPES.map((cfg, i) => (
        <FloatingShape key={i} cfg={cfg} reduced={reduced} />
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// HeroFloatingShapes — root export
// ---------------------------------------------------------------------------

export function HeroFloatingShapes() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [reduced, setReduced] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false,
  );

  // Only render the canvas when the hero section is in the viewport
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setVisible(entry?.isIntersecting ?? false),
      { threshold: 0.05 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Listen for prefers-reduced-motion changes
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-0 z-[8]"
      aria-hidden
    >
      {visible && (
        <Canvas
          camera={{ position: [0, 0, 6], fov: 50 }}
          gl={{
            alpha: true,
            antialias: true,
            powerPreference: "high-performance",
            premultipliedAlpha: false,
          }}
          dpr={[1, 1.5]}
          frameloop="always"
        >
          <AdaptiveDpr pixelated />
          <Suspense fallback={null}>
            <SceneContent reduced={reduced} />
          </Suspense>
        </Canvas>
      )}
    </div>
  );
}

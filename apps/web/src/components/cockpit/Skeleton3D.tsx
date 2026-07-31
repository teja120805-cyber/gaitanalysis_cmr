"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Grid, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { useLiveStore } from "@/lib/store";
import { LEVEL } from "@/lib/risk";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/Panel";
import { useSampled } from "@/hooks/useSampled";
import { PersonStanding, Move3d } from "lucide-react";

// Joints we render, and the bones between them (MediaPipe Pose indices).
const JOINTS = [0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28];
const BONES: [number, number][] = [
  [11, 12],
  [11, 13],
  [13, 15],
  [12, 14],
  [14, 16],
  [11, 23],
  [12, 24],
  [23, 24],
  [23, 25],
  [25, 27],
  [24, 26],
  [26, 28],
];

const SCALE = 4;
function to3D(p: [number, number, number]): [number, number, number] {
  return [(p[0] - 0.5) * SCALE, (0.5 - p[1]) * SCALE, (p[2] ?? 0) * SCALE];
}

function Figure({ color }: { color: string }) {
  const jointRefs = useRef<(THREE.Mesh | null)[]>([]);
  const linesRef = useRef<THREE.LineSegments>(null);
  const headRef = useRef<THREE.Mesh>(null);
  const three = useMemo(() => new THREE.Color(color), [color]);

  // Bone geometry: one segment pair per bone + a neck segment.
  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const positions = new Float32Array((BONES.length + 1) * 2 * 3);
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return g;
  }, []);

  useFrame(() => {
    const pose = useLiveStore.getState().latestPose;
    if (!pose) return;
    const lm = pose.landmarks;

    // Joints
    JOINTS.forEach((idx, i) => {
      const m = jointRefs.current[i];
      if (m && lm[idx]) {
        const [x, y, z] = to3D(lm[idx]);
        m.position.set(x, y, z);
      }
    });

    // Head
    if (headRef.current && lm[0]) {
      const [x, y, z] = to3D(lm[0]);
      headRef.current.position.set(x, y, z);
    }

    // Bones
    const pos = geom.getAttribute("position") as THREE.BufferAttribute;
    BONES.forEach(([a, b], i) => {
      const pa = to3D(lm[a] ?? [0.5, 0.5, 0]);
      const pb = to3D(lm[b] ?? [0.5, 0.5, 0]);
      pos.setXYZ(i * 2, pa[0], pa[1], pa[2]);
      pos.setXYZ(i * 2 + 1, pb[0], pb[1], pb[2]);
    });
    // Neck: nose → shoulder midpoint
    const nose = to3D(lm[0] ?? [0.5, 0.12, 0]);
    const sMid: [number, number, number] = [
      ((lm[11]?.[0] ?? 0.4) + (lm[12]?.[0] ?? 0.6)) / 2,
      ((lm[11]?.[1] ?? 0.26) + (lm[12]?.[1] ?? 0.26)) / 2,
      0,
    ];
    const neck = to3D(sMid);
    const n = BONES.length;
    pos.setXYZ(n * 2, nose[0], nose[1], nose[2]);
    pos.setXYZ(n * 2 + 1, neck[0], neck[1], neck[2]);
    pos.needsUpdate = true;
  });

  return (
    <group position={[0, 0.2, 0]}>
      <lineSegments ref={linesRef} geometry={geom}>
        <lineBasicMaterial color={three} linewidth={2} transparent opacity={0.9} />
      </lineSegments>

      {JOINTS.map((_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            jointRefs.current[i] = el;
          }}
        >
          <sphereGeometry args={[0.09, 16, 16]} />
          <meshStandardMaterial
            color={three}
            emissive={three}
            emissiveIntensity={0.6}
            roughness={0.4}
          />
        </mesh>
      ))}

      {/* Head */}
      <mesh ref={headRef}>
        <sphereGeometry args={[0.22, 24, 24]} />
        <meshStandardMaterial
          color={three}
          emissive={three}
          emissiveIntensity={0.35}
          roughness={0.5}
          transparent
          opacity={0.85}
        />
      </mesh>
    </group>
  );
}

export function Skeleton3D() {
  // Color the figure by risk level (sampled slowly — this only drives material).
  const level = useSampled(
    () => useLiveStore.getState().latestRisk?.level ?? "normal",
    500
  );
  const color = LEVEL[level].color;

  return (
    <Panel className="flex flex-col overflow-hidden">
      <PanelHeader
        title="Skeleton Tracking"
        icon={<PersonStanding size={14} />}
        right={
          <span className="flex items-center gap-1 text-[10px] text-muted">
            <Move3d size={12} /> drag to orbit
          </span>
        }
      />
      <PanelBody className="min-h-[300px] flex-1 p-3">
        <div className="viewport h-full w-full overflow-hidden">
        <Canvas
          camera={{ position: [0, 0.3, 6.2], fov: 42 }}
          gl={{ antialias: true, alpha: true }}
          dpr={[1, 2]}
        >
          <ambientLight intensity={0.7} />
          <directionalLight position={[4, 6, 5]} intensity={0.8} />
          <pointLight position={[-4, 2, -3]} intensity={0.4} color="#38bdf8" />
          <Figure color={color} />
          <Grid
            args={[12, 12]}
            position={[0, -2.1, 0]}
            cellColor="#1c2430"
            sectionColor="#243040"
            fadeDistance={16}
            fadeStrength={2}
            infiniteGrid
          />
          <OrbitControls
            enablePan={false}
            autoRotate
            autoRotateSpeed={0.6}
            minPolarAngle={Math.PI / 3}
            maxPolarAngle={Math.PI / 1.8}
            minDistance={4}
            maxDistance={9}
          />
        </Canvas>
        </div>
      </PanelBody>
    </Panel>
  );
}

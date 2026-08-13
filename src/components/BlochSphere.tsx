import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, Line, Text, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import type { BlochVector, QubitState } from '../engine/blochState';
import { stateToBloch, probabilities, lerpBloch } from '../engine/blochState';
import { motion } from 'framer-motion';

// ── 3D Bloch Sphere Scene ─────────────────────────────────────

interface SceneProps {
  bloch: BlochVector;
  targetBloch: BlochVector;
  animating: boolean;
  rotationDeg: number;
}

function BlochScene({ bloch, targetBloch, animating, rotationDeg }: SceneProps) {
  const animT     = useRef(0);
  const currentBloch = useRef<BlochVector>(bloch);

  useFrame((_, delta) => {
    if (animating && animT.current < 1) {
      animT.current = Math.min(1, animT.current + delta * 1.6);
      currentBloch.current = lerpBloch(bloch, targetBloch, animT.current);
    } else if (!animating) {
      animT.current = 0;
      currentBloch.current = bloch;
    }
  });

  const b = animating ? currentBloch.current : bloch;
  const vecColor = bloch.z > 0.5 ? '#4F46E5' : bloch.z < -0.5 ? '#EF4444' : '#06B6D4';

  // Arc points for rotation indicator
  const arcPoints = Array.from({ length: 33 }, (_, i) => {
    const t = (i / 32) * Math.PI * 2 * (rotationDeg / 360);
    return new THREE.Vector3(Math.cos(t) * 0.52, 0, Math.sin(t) * 0.52);
  });

  return (
    <>
      <ambientLight intensity={0.7} />
      <pointLight position={[3, 3, 3]} intensity={0.8} />
      <pointLight position={[-3, -3, -3]} intensity={0.3} color="#06B6D4" />

      {/* Sphere */}
      <Sphere args={[1, 48, 48]}>
        <meshStandardMaterial color="#4F46E5" transparent opacity={0.06} side={THREE.DoubleSide} />
      </Sphere>
      <Sphere args={[1.002, 16, 16]}>
        <meshStandardMaterial color="#C7D2FE" transparent opacity={0.15} wireframe />
      </Sphere>

      {/* Rings */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1, 0.005, 8, 64]} />
        <meshBasicMaterial color="#CBD5E1" transparent opacity={0.5} />
      </mesh>
      <mesh>
        <torusGeometry args={[1, 0.005, 8, 64]} />
        <meshBasicMaterial color="#CBD5E1" transparent opacity={0.5} />
      </mesh>

      {/* Axes */}
      <Line points={[[0, -1.3, 0], [0, 1.3, 0]]} color="#64748B" lineWidth={1} dashed dashSize={0.08} gapSize={0.04} />
      <Line points={[[-1.3, 0, 0], [1.3, 0, 0]]} color="#64748B" lineWidth={1} dashed dashSize={0.08} gapSize={0.04} />
      <Line points={[[0, 0, -1.3], [0, 0, 1.3]]} color="#64748B" lineWidth={1} dashed dashSize={0.08} gapSize={0.04} />

      {/* Labels */}
      <Billboard position={[0, 1.5, 0]}><Text fontSize={0.12} color="#1E293B">|0⟩ (+Z)</Text></Billboard>
      <Billboard position={[0, -1.5, 0]}><Text fontSize={0.12} color="#1E293B">|1⟩ (−Z)</Text></Billboard>
      <Billboard position={[1.5, 0, 0]}><Text fontSize={0.11} color="#64748B">+X</Text></Billboard>
      <Billboard position={[-1.5, 0, 0]}><Text fontSize={0.11} color="#64748B">−X</Text></Billboard>
      <Billboard position={[0, 0, 1.5]}><Text fontSize={0.11} color="#64748B">+Y</Text></Billboard>
      <Billboard position={[0, 0, -1.5]}><Text fontSize={0.11} color="#64748B">−Y</Text></Billboard>

      {/* Pole dots */}
      <mesh position={[0, 1, 0]}><sphereGeometry args={[0.04]} /><meshBasicMaterial color="#4F46E5" /></mesh>
      <mesh position={[0, -1, 0]}><sphereGeometry args={[0.04]} /><meshBasicMaterial color="#EF4444" /></mesh>

      {/* Rotation arc */}
      <Line points={arcPoints} color="#06B6D4" lineWidth={2} />

      {/* State vector */}
      <Line points={[[0, 0, 0], [b.x, b.z, b.y]]} color={vecColor} lineWidth={3} />
      <mesh position={[b.x, b.z, b.y]}>
        <sphereGeometry args={[0.045]} />
        <meshStandardMaterial color={vecColor} emissive={vecColor} emissiveIntensity={0.3} />
      </mesh>

      <OrbitControls enablePan={false} enableZoom={true} minDistance={2} maxDistance={5} />
    </>
  );
}

// ── Main Bloch Sphere Component ───────────────────────────────

interface Props {
  state: QubitState;
  targetState: QubitState | null;
  animating: boolean;
  onAnimEnd: () => void;
}

export const BlochSphere: React.FC<Props> = ({ state, targetState, animating }) => {
  const [rotSlider, setRotSlider] = useState(0);
  const bloch  = stateToBloch(state);
  const target = targetState ? stateToBloch(targetState) : bloch;
  const probs  = probabilities(state);
  const rotDeg = Math.round(bloch.theta * 180 / Math.PI);

  return (
    <div className="space-y-4">
      {/* 3D Canvas */}
      <div className="relative rounded-2xl overflow-hidden border border-surface-200 bg-gradient-to-br from-slate-50 to-indigo-50/30" style={{ height: 380 }}>
        <Canvas camera={{ position: [2.5, 1.5, 2.5], fov: 45 }}>
          <BlochScene
            bloch={bloch}
            targetBloch={target}
            animating={animating}
            rotationDeg={rotSlider}
          />
        </Canvas>

        {/* Overlay */}
        <div className="absolute top-3 left-3">
          <div className="glass rounded-lg px-3 py-1.5">
            <p className="text-xs text-muted">State</p>
            <p className="text-sm font-bold text-primary">{state.label}</p>
          </div>
        </div>
        <div className="absolute top-3 right-3 text-xs text-muted glass rounded-lg px-2 py-1.5">
          Drag to rotate
        </div>
      </div>

      {/* Probability bars */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-xl border border-surface-200 bg-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted">P(|0⟩)</span>
            <span className="text-sm font-bold text-primary">{(probs.p0 * 100).toFixed(1)}%</span>
          </div>
          <div className="h-2 rounded-full bg-surface-100 overflow-hidden">
            <motion.div className="h-full bg-primary rounded-full" animate={{ width: `${probs.p0 * 100}%` }} transition={{ duration: 0.5 }} />
          </div>
        </div>
        <div className="p-3 rounded-xl border border-surface-200 bg-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted">P(|1⟩)</span>
            <span className="text-sm font-bold text-danger">{(probs.p1 * 100).toFixed(1)}%</span>
          </div>
          <div className="h-2 rounded-full bg-surface-100 overflow-hidden">
            <motion.div className="h-full bg-danger rounded-full" animate={{ width: `${probs.p1 * 100}%` }} transition={{ duration: 0.5 }} />
          </div>
        </div>
      </div>

      {/* Rotation slider */}
      <div className="p-4 rounded-xl border border-surface-200 bg-white">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-slate-700">Manual Rotation</span>
          <span className="text-sm font-bold text-secondary">{rotSlider}°</span>
        </div>
        <input
          type="range" min={0} max={360} value={rotSlider}
          onChange={e => setRotSlider(Number(e.target.value))}
          className="w-full h-2 bg-gradient-to-r from-primary to-accent rounded-full appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-xs text-muted mt-1">
          <span>0°</span><span>90°</span><span>180°</span><span>270°</span><span>360°</span>
        </div>
      </div>

      {/* Rotation info cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-xl border border-surface-200 bg-white space-y-1">
          <p className="text-xs text-muted">Rotation Angle</p>
          <p className="text-lg font-bold text-primary">{rotDeg}°</p>
        </div>
        <div className="p-3 rounded-xl border border-surface-200 bg-white space-y-1">
          <p className="text-xs text-muted">Rotation Axis</p>
          <p className="text-lg font-bold text-secondary">X</p>
        </div>
        <div className="p-3 rounded-xl border border-surface-200 bg-white space-y-1">
          <p className="text-xs text-muted">Operator</p>
          <code className="text-sm font-bold text-accent font-mono">Rx(π)</code>
        </div>
        <div className="p-3 rounded-xl border border-surface-200 bg-white space-y-1">
          <p className="text-xs text-muted">Gate</p>
          <p className="text-sm font-bold text-indigo-600">Poly-X</p>
        </div>
      </div>
    </div>
  );
};

export default BlochSphere;

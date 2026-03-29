'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Html, Text, Icosahedron, Sphere, MeshTransmissionMaterial } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, ChromaticAberration } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { YieldPool } from './YieldCompassApp';

const CHAIN_COLORS: Record<string, string> = {
  Ethereum: '#627EEA',
  Arbitrum: '#28A0F0',
  Optimism: '#FF0420',
  Base: '#0052FF',
  Polygon: '#8247E5',
  Solana: '#14F195',
  Avalanche: '#E84142',
};

// Generates grouped positions based on chain
function generatePositions(pools: YieldPool[]) {
  const chains = Array.from(new Set(pools.map((p) => p.chain)));
  const positions: Record<string, [number, number, number]> = {};

  chains.forEach((chain, i) => {
    // Spread clusters in a wider galaxy
    const angle = (i / chains.length) * Math.PI * 2;
    const radius = 35;
    const yOffset = Math.sin(angle * 2) * 10;
    positions[chain] = [
      Math.cos(angle) * radius,
      yOffset,
      Math.sin(angle) * radius,
    ];
  });

  return pools.map((pool) => {
    const basePos = positions[pool.chain] || [0, 0, 0];
    const offsetRadius = Math.random() * 12 + 2;
    const offsetAngle = Math.random() * Math.PI * 2;
    const offsetPhi = Math.random() * Math.PI;

    return {
      ...pool,
      position: [
        basePos[0] + offsetRadius * Math.sin(offsetPhi) * Math.cos(offsetAngle),
        basePos[1] + offsetRadius * Math.cos(offsetPhi) * 0.5, // Flattened Y to make a "disk"
        basePos[2] + offsetRadius * Math.sin(offsetPhi) * Math.sin(offsetAngle),
      ] as [number, number, number],
      color: CHAIN_COLORS[pool.chain] || '#00ffcc',
      size: Math.max(0.8, Math.min(3, Math.log10(pool.tvlUsd) / 2.5)),
    };
  });
}

function YieldNode({ data, onSelect, filterWallet }: any) {
  const innerRef = useRef<THREE.Mesh>(null);
  const outerRef = useRef<THREE.Mesh>(null);
  const [hovered, setHover] = useState(false);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    // Gentle floating
    if (innerRef.current && outerRef.current) {
      const yOffset = Math.sin(t * 1.5 + data.id.charCodeAt(0)) * 0.5;
      innerRef.current.position.y = yOffset;
      outerRef.current.position.y = yOffset;
      // Outer shell spins opposite
      outerRef.current.rotation.x = t * 0.2;
      outerRef.current.rotation.y = t * 0.3;
    }
  });

  const isCompatible = data.symbol.includes('USDC') || data.symbol.includes('ETH');
  const opacity = filterWallet ? (isCompatible ? 1 : 0.05) : 0.9;
  
  // Base scales
  const pulseScale = hovered ? 1.4 : 1;
  const targetScale = filterWallet && !isCompatible ? 0.3 : pulseScale;

  useFrame((state, delta) => {
    if (innerRef.current && outerRef.current) {
      // Smooth lerp scaling
      innerRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), delta * 5);
      outerRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), delta * 5);
    }
  });

  return (
    <group position={data.position}>
      {/* INNER GLOWING CORE */}
      <Sphere
        ref={innerRef}
        args={[data.size * 0.6, 32, 32]}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(data);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHover(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHover(false);
          document.body.style.cursor = 'auto';
        }}
      >
        <meshStandardMaterial
          color={data.color}
          emissive={data.color}
          emissiveIntensity={hovered ? 5 : (filterWallet && isCompatible ? 3 : 1.5)}
          transparent
          opacity={opacity}
          roughness={0.1}
          metalness={0.9}
        />
      </Sphere>

      {/* OUTER GLASS/HOLOGRAPHIC SHELL */}
      <Icosahedron ref={outerRef} args={[data.size, 1]}>
        <meshPhysicalMaterial
          color={data.color}
          transmission={0.9} // Glass effect
          opacity={opacity}
          transparent
          roughness={0.1}
          thickness={0.5}
          wireframe={hovered} // Turns into wireframe on hover for cool sci-fi feel
        />
      </Icosahedron>

      {(hovered || data.apy > 20) && opacity > 0.2 && (
        <Html distanceFactor={25} center position={[0, data.size * 1.5 + 1, 0]}>
          <div className="bg-[#050510]/80 backdrop-blur-xl px-3 py-1.5 rounded-md text-[11px] text-white whitespace-nowrap border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.1)] pointer-events-none transition-all duration-300">
            <span className="font-bold text-[#00ffcc] tracking-wide">{data.apy.toFixed(2)}%</span>{' '}
            <span className="text-slate-400 opacity-70 ml-1">| {data.symbol}</span>
          </div>
        </Html>
      )}
    </group>
  );
}

function Constellation({ pools, onSelect, filterWallet }: any) {
  const mappedPools = useMemo(() => generatePositions(pools), [pools]);

  return (
    <group>
      {mappedPools.map((pool, i) => (
        <YieldNode key={pool.id + i} data={pool} onSelect={onSelect} filterWallet={filterWallet} />
      ))}

      {/* Chain Labels (floating spatial text) */}
      {Array.from(new Set(mappedPools.map((p) => p.chain))).map((chain) => {
        const chainPools = mappedPools.filter((p) => p.chain === chain);
        if (chainPools.length === 0) return null;

        const center = chainPools.reduce(
          (acc, p) => [acc[0] + p.position[0], acc[1] + p.position[1], acc[2] + p.position[2]],
          [0, 0, 0]
        );
        center[0] /= chainPools.length;
        center[1] /= chainPools.length;
        center[2] /= chainPools.length;

        // Position label slightly above the cluster
        return (
          <Text
            key={`label-${chain}`}
            position={[center[0], center[1] - 12, center[2]]}
            color={CHAIN_COLORS[chain] || '#ffffff'}
            fontSize={3}
            anchorX="center"
            anchorY="middle"
            fillOpacity={0.8}
            outlineWidth={0.1}
            outlineColor="#000000"
            letterSpacing={0.1}
          >
            {chain.toUpperCase()}
          </Text>
        );
      })}
    </group>
  );
}

export default function Scene({ pools, loading, onSelect, filterWallet }: any) {
  return (
    <Canvas camera={{ position: [0, 40, 80], fov: 45 }} dpr={[1, 2]}>
      {/* Deep space color */}
      <color attach="background" args={['#020205']} />
      
      {/* Fog to obscure distant clusters */}
      <fog attach="fog" args={['#020205', 40, 150]} />

      <ambientLight intensity={0.4} />
      {/* Key lights pointing at the scene to catch glass reflections */}
      <spotLight position={[50, 100, 50]} intensity={4000} color="#ffffff" angle={0.5} penumbra={1} />
      <pointLight position={[-100, -100, -100]} intensity={2000} color="#9d4edd" />

      {/* Stars backdrop */}
      <Stars radius={200} depth={50} count={6000} factor={5} saturation={1} fade speed={0.8} />

      {!loading && pools.length > 0 && (
        <Constellation pools={pools} onSelect={onSelect} filterWallet={filterWallet} />
      )}

      {/* Advanced Cinematic Post-Processing */}
      <EffectComposer>
        <Bloom 
          luminanceThreshold={0.5} // Only glow bright things
          luminanceSmoothing={0.9}
          intensity={1.5} 
          levels={8} 
        />
        <Vignette eskil={false} offset={0.1} darkness={0.8} blendFunction={BlendFunction.MULTIPLY} />
      </EffectComposer>

      <OrbitControls
        enablePan={true}
        enableDamping={true}
        dampingFactor={0.05}
        minDistance={10}
        maxDistance={120}
        autoRotate={!loading}
        autoRotateSpeed={0.5}
        maxPolarAngle={Math.PI / 1.5}
      />
    </Canvas>
  );
}

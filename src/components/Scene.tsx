'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { CameraControls, Stars, Html, Text, Float, Sparkles, Environment, Sphere, Line } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import { useMemo, useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { easing } from 'maath';
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

// Generates smooth elegant orbital rings
function generatePositions(pools: YieldPool[]) {
  const chains = Array.from(new Set(pools.map((p) => p.chain)));
  const positions: Record<string, [number, number, number]> = {};

  // Space out the blockchains as central anchor points (solar systems)
  chains.forEach((chain, i) => {
    const angle = (i / chains.length) * Math.PI * 2;
    // Massive radius to give scale
    const radius = 60;
    const yOffset = Math.sin(angle * 3) * 15;
    positions[chain] = [
      Math.cos(angle) * radius,
      yOffset,
      Math.sin(angle) * radius,
    ];
  });

  return pools.map((pool) => {
    const basePos = positions[pool.chain] || [0, 0, 0];
    // Distance from the blockchain center (orbit radius based on TVL to prevent crazy overlaps)
    const orbitRadius = 6 + Math.log10(pool.tvlUsd) * 1.5;
    const orbitAngle = Math.random() * Math.PI * 2;
    const orbitTilt = (Math.random() - 0.5) * 0.4;

    return {
      ...pool,
      orbitCenter: basePos,
      orbitRadius,
      orbitSpeed: (Math.random() * 0.2 + 0.05) * (Math.random() > 0.5 ? 1 : -1),
      orbitAngle,
      orbitTilt,
      color: CHAIN_COLORS[pool.chain] || '#00ffcc',
      size: Math.max(1, Math.min(4, Math.log10(pool.tvlUsd) / 2)),
    };
  });
}

// Draw the orbit ring line
function OrbitRing({ radius, tilt, center, color, opacity }: any) {
  const points = useMemo(() => {
    const pts = [];
    for (let i = 0; i <= 64; i++) {
      const angle = (i / 64) * Math.PI * 2;
      pts.push(
        new THREE.Vector3(
          Math.cos(angle) * radius,
          Math.sin(angle) * radius * tilt,
          Math.sin(angle) * radius
        )
      );
    }
    return pts;
  }, [radius, tilt]);

  return (
    <group position={center}>
      <Line points={points} color={color} transparent opacity={opacity * 0.3} lineWidth={1} />
    </group>
  );
}

function YieldNode({ data, onSelect, filterWallet, isSelected }: any) {
  const groupRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const [hovered, setHover] = useState(false);

  // Dynamic Orbital Movement
  useFrame((state, delta) => {
    if (groupRef.current && !isSelected) { // Stop orbiting if selected so we can zoom in smoothly
      data.orbitAngle += data.orbitSpeed * delta * 0.2;
      
      const x = data.orbitCenter[0] + Math.cos(data.orbitAngle) * data.orbitRadius;
      const y = data.orbitCenter[1] + Math.cos(data.orbitAngle) * data.orbitRadius * data.orbitTilt;
      const z = data.orbitCenter[2] + Math.sin(data.orbitAngle) * data.orbitRadius;

      groupRef.current.position.set(x, y, z);
    }

    // Pulse core
    if (coreRef.current) {
      const t = state.clock.elapsedTime;
      coreRef.current.scale.setScalar(
        1 + Math.sin(t * 3 + data.id.charCodeAt(0)) * 0.1
      );
    }
  });

  const isCompatible = data.symbol.includes('USDC') || data.symbol.includes('ETH');
  const opacity = filterWallet ? (isCompatible ? 1 : 0.02) : 0.9;
  
  // Smoothly damp scale on hover
  const targetScale = isSelected ? 1.5 : (hovered ? 1.2 : 1);
  const finalScale = filterWallet && !isCompatible ? 0.3 : targetScale;

  useFrame((_, delta) => {
    if (groupRef.current) {
      easing.damp3(groupRef.current.scale, [finalScale, finalScale, finalScale], 0.1, delta);
    }
  });

  return (
    <>
      <OrbitRing 
        radius={data.orbitRadius} 
        tilt={data.orbitTilt} 
        center={data.orbitCenter} 
        color={data.color}
        opacity={filterWallet && !isCompatible ? 0.05 : 1}
      />
      
      <group ref={groupRef} position={[
        data.orbitCenter[0] + Math.cos(data.orbitAngle) * data.orbitRadius,
        data.orbitCenter[1] + Math.cos(data.orbitAngle) * data.orbitRadius * data.orbitTilt,
        data.orbitCenter[2] + Math.sin(data.orbitAngle) * data.orbitRadius
      ]}>
        
        <group>
          {/* Outer high-fidelity Transmission Glass (Optimized) */}
          <Sphere 
            args={[data.size, 16, 16]}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(data);
            }}
            onPointerOver={(e) => { e.stopPropagation(); setHover(true); document.body.style.cursor = 'pointer'; }}
            onPointerOut={() => { setHover(false); document.body.style.cursor = 'auto'; }}
          >
            <meshPhysicalMaterial 
              color={data.color}
              thickness={data.size * 0.5}
              roughness={0.1}
              transmission={0.9}
              ior={1.5}
              transparent
              opacity={opacity}
            />
          </Sphere>
          
          {/* Inner solid brilliant reactor core */}
          <Sphere ref={coreRef} args={[data.size * 0.3, 16, 16]}>
            <meshBasicMaterial 
              color={data.color} 
              transparent 
              opacity={opacity} 
            />
          </Sphere>
        </group>

        {((hovered || data.apy > 15) && opacity > 0.2) || isSelected ? (
          <Html distanceFactor={25} center position={[0, data.size + 1.5, 0]}>
            <div className={`
              bg-[#050510]/80 backdrop-blur-xl px-3 py-1.5 rounded-lg text-[11px] text-white whitespace-nowrap 
              border transition-all duration-300 pointer-events-none tracking-wider
              ${isSelected ? 'border-[#00ffcc] shadow-[0_0_20px_rgba(0,255,204,0.4)] scale-110' : 'border-white/10 shadow-lg'}
            `}>
              <span className="font-bold text-[#00ffcc] text-[13px]">{data.apy.toFixed(2)}%</span>
              <span className="text-slate-400 opacity-80 ml-2 text-[10px]">{data.symbol}</span>
            </div>
          </Html>
        ) : null}
      </group>
    </>
  );
}

// The core constellation controller
function Constellation({ pools, onSelect, filterWallet, selectedPool }: any) {
  const mappedPools = useMemo(() => generatePositions(pools), [pools]);

  return (
    <group>
      {mappedPools.map((pool, i) => (
        <YieldNode 
          key={pool.id + i} 
          data={pool} 
          onSelect={onSelect} 
          filterWallet={filterWallet} 
          isSelected={selectedPool?.id === pool.id}
        />
      ))}

      {/* Chain Solar System Centers (Sun Labels) */}
      {Array.from(new Set(mappedPools.map((p) => p.chain))).map((chain) => {
        const p = mappedPools.find(p => p.chain === chain);
        if(!p) return null;
        
        return (
          <Float key={`sun-${chain}`} speed={1} rotationIntensity={0.2} floatIntensity={0.5}>
            <Text
              position={p.orbitCenter}
              color={CHAIN_COLORS[chain] || '#ffffff'}
              fontSize={4}
              anchorX="center"
              anchorY="middle"
              fillOpacity={0.8}
              letterSpacing={0.2}
              outlineWidth={0.1}
              outlineColor="#000000"
            >
              {chain.toUpperCase()}
            </Text>
            {/* Glowing ring under text */}
            <mesh position={p.orbitCenter} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[8, 8.5, 64]} />
              <meshBasicMaterial color={CHAIN_COLORS[chain] || '#ffffff'} transparent opacity={0.15} side={THREE.DoubleSide} />
            </mesh>
          </Float>
        );
      })}
    </group>
  );
}

// Camera flight controller
function CameraRigger({ selectedPool }: { selectedPool?: YieldPool }) {
  const controlsRef = useRef<any>(null);

  useEffect(() => {
    if (controlsRef.current) {
      if (selectedPool) {
        // Find the node's position dynamically. Because it rotates, we can't pinpoint it directly by static state easily without passing refs, 
        // BUT we can just zoom into the general area or fake the position based on its generated state.
        // Actually, scene.children search by UUID or name is standard, but since we didn't name them, we can just zoom out or into its origin.
        // For absolute premium feel: we just lerp to a very specific offset view.
        controlsRef.current.setLookAt(
          0, 20, 40,
          0, 0, 0,
          true
        );
      } else {
        // Reset overview
        controlsRef.current.setLookAt(
          0, 80, 160,
          0, 0, 0,
          true
        );
      }
    }
  }, [selectedPool]);

  return (
    <CameraControls 
      ref={controlsRef} 
      makeDefault 
      dollySpeed={0.5}
      minDistance={10} 
      maxDistance={300} 
      polarAngle={Math.PI / 3} // Default tilt
      smoothTime={0.8} // Extreme buttery smoothness
    />
  );
}

export default function Scene({ pools, loading, onSelect, filterWallet, selectedPool }: any) {
  return (
    <Canvas camera={{ position: [0, 80, 160], fov: 40 }} dpr={[1, 2]}>
      {/* Deep space color */}
      <color attach="background" args={['#010103']} />
      <fog attach="fog" args={['#010103', 60, 250]} />
      <Environment preset="city" />

      {/* Cinematic Lighting required for Transmission Material */}
      <ambientLight intensity={1.5} />
      <directionalLight position={[10, 20, 15]} intensity={5} color="#ffffff" castShadow />
      <directionalLight position={[-10, -20, -15]} intensity={2} color="#9d4edd" />
      <spotLight position={[0, 100, 0]} intensity={200} angle={Math.PI/2} penumbra={1} color="#00ffcc" />

      {/* Ambient particles (optimized) */}
      <Sparkles count={1500} scale={200} size={1} speed={0.4} opacity={0.4} color="#00ffcc" />
      <Stars radius={250} depth={50} count={2000} factor={4} saturation={1} fade speed={0.2} />

      {!loading && pools.length > 0 && (
        <Constellation 
          pools={pools} 
          onSelect={onSelect} 
          filterWallet={filterWallet} 
          selectedPool={selectedPool}
        />
      )}

      {/* God-Tier Post Processing */}
      <EffectComposer multisampling={4}>
        <Bloom 
          luminanceThreshold={0.7} 
          luminanceSmoothing={0.9} 
          intensity={2.5} 
          mipmapBlur 
        />
        <Vignette eskil={false} offset={0.3} darkness={0.9} blendFunction={BlendFunction.MULTIPLY} />
      </EffectComposer>

      <CameraRigger selectedPool={selectedPool} />
    </Canvas>
  );
}

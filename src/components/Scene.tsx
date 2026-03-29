'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Html, Text } from '@react-three/drei';
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
  const chains = Array.from(new Set(pools.map(p => p.chain)));
  const positions: Record<string, [number, number, number]> = {};
  
  chains.forEach((chain, i) => {
    const angle = (i / chains.length) * Math.PI * 2;
    const radius = 25;
    // Base center for the chain cluster
    positions[chain] = [
      Math.cos(angle) * radius,
      (Math.random() - 0.5) * 10,
      Math.sin(angle) * radius
    ];
  });

  return pools.map((pool) => {
    const basePos = positions[pool.chain] || [0,0,0];
    // Spread pools around their chain's center based on TVL (bigger TVL = closer to center)
    const offsetRadius = Math.random() * 8 + 2; 
    const offsetAngle = Math.random() * Math.PI * 2;
    
    return {
      ...pool,
      position: [
        basePos[0] + Math.cos(offsetAngle) * offsetRadius,
        basePos[1] + (Math.random() - 0.5) * 6,
        basePos[2] + Math.sin(offsetAngle) * offsetRadius
      ] as [number, number, number],
      color: CHAIN_COLORS[pool.chain] || '#00ffcc',
      size: Math.max(0.5, Math.min(2.5, Math.log10(pool.tvlUsd) / 3)) // Scale by TVL
    };
  });
}

function YieldNode({ data, onSelect, filterWallet }: any) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHover] = useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      // Gentle floating animation
      meshRef.current.position.y += Math.sin(state.clock.elapsedTime * 2 + data.id.charCodeAt(0)) * 0.01;
    }
  });

  // If wallet filtering is active, we mock the logic (dimming nodes randomly or based on "ETH/USDC" rules)
  // For a pure prototype, if it's not a standard USDC/ETH pool, we dim it when checked.
  const isCompatible = data.symbol.includes('USDC') || data.symbol.includes('ETH');
  const opacity = filterWallet ? (isCompatible ? 1 : 0.1) : 0.8;

  return (
    <group position={data.position}>
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(data);
        }}
        onPointerOver={(e) => { e.stopPropagation(); setHover(true); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { setHover(false); document.body.style.cursor = 'auto'; }}
      >
        <sphereGeometry args={[data.size, 32, 32]} />
        <meshStandardMaterial 
          color={data.color} 
          emissive={data.color}
          emissiveIntensity={hovered ? 2 : (filterWallet && isCompatible ? 1.5 : 0.5)}
          transparent
          opacity={opacity}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>
      
      {(hovered || data.apy > 20) && opacity > 0.2 && (
        <Html distanceFactor={15} center position={[0, data.size + 1, 0]}>
          <div className="bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[10px] text-white whitespace-nowrap border border-white/10 pointer-events-none">
            <span className="font-bold text-[#00ffcc]">{data.apy.toFixed(1)}%</span> | {data.symbol}
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
      {/* Draw connections between nodes of the same chain? (Optional complex visual) */}
      {mappedPools.map((pool, i) => (
        <YieldNode 
          key={pool.id + i} 
          data={pool} 
          onSelect={onSelect}
          filterWallet={filterWallet}
        />
      ))}
      
      {/* Chain Labels */}
      {Array.from(new Set(mappedPools.map(p => p.chain))).map(chain => {
        const chainPools = mappedPools.filter(p => p.chain === chain);
        if(chainPools.length === 0) return null;
        
        // Find center of cluster
        const center = chainPools.reduce((acc, p) => [acc[0]+p.position[0], acc[1]+p.position[1], acc[2]+p.position[2]], [0,0,0]);
        center[0] /= chainPools.length;
        center[1] /= chainPools.length;
        center[2] /= chainPools.length;

        return (
          <Text 
            key={`label-${chain}`}
            position={[center[0], center[1] - 8, center[2]]}
            color={CHAIN_COLORS[chain] || '#ffffff'}
            fontSize={2}
            anchorX="center"
            anchorY="middle"
            fillOpacity={0.5}
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
    <Canvas camera={{ position: [0, 30, 60], fov: 45 }} dpr={[1, 2]}>
      <color attach="background" args={['#020205']} />
      <fog attach="fog" args={['#020205', 30, 100]} />
      
      <ambientLight intensity={0.2} />
      <pointLight position={[100, 100, 100]} intensity={1} />
      <pointLight position={[-100, -100, -100]} intensity={0.5} color="#9d4edd" />

      <Stars radius={150} depth={50} count={3000} factor={4} saturation={1} fade speed={0.5} />
      
      {!loading && pools.length > 0 && (
        <Constellation pools={pools} onSelect={onSelect} filterWallet={filterWallet} />
      )}
      
      <OrbitControls 
        enablePan={false}
        minDistance={10}
        maxDistance={120}
        autoRotate={!loading}
        autoRotateSpeed={0.3}
        maxPolarAngle={Math.PI / 1.5} // Don't let user look totally from under
      />
    </Canvas>
  );
}

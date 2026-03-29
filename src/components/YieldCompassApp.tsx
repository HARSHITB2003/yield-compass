'use client';

import { useState, useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useBalance } from 'wagmi';
import { Compass, Info, ShieldAlert, Sparkles } from 'lucide-react';
import Scene from './Scene';
import { motion, AnimatePresence } from 'framer-motion';

export type YieldPool = {
  id: string;
  chain: string;
  project: string;
  symbol: string;
  tvlUsd: number;
  apy: number;
  apyBase: number;
  apyReward: number;
  rewardTokens: string[];
  link: string;
};

export default function YieldCompassApp() {
  const { address, isConnected } = useAccount();
  const balance = useBalance({ address });
  
  const [pools, setPools] = useState<YieldPool[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterWallet, setFilterWallet] = useState(false);
  const [selectedPool, setSelectedPool] = useState<YieldPool | null>(null);

  useEffect(() => {
    async function fetchYields() {
      try {
        const res = await fetch('/api/yields');
        const data = await res.json();
        if (data.success) {
          setPools(data.data);
        }
      } catch (err) {
        console.error("Failed to load generic pool data", err);
      } finally {
        setLoading(false);
      }
    }
    fetchYields();
  }, []);

  // Format currency
  const fmtTvl = (n: number) => {
    if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
    if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
    return `$${n.toLocaleString()}`;
  };

  return (
    <div className="relative w-full h-screen font-mono">
      {/* HEADER */}
      <header className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-50 pointer-events-auto bg-gradient-to-b from-[#050510]/90 to-transparent">
        <div className="flex items-center gap-3">
          <div className="p-2 border border-neon rounded-lg bg-black/40 backdrop-blur-md">
            <Compass className="text-neon-glow text-[#00ffcc]" size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-wider text-white">YIELD<span className="text-[#00ffcc]">COMPASS</span></h1>
            <p className="text-xs text-[#00ffcc]/70 uppercase tracking-widest">Cross-Chain Terminal</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {isConnected && (
            <button 
              onClick={() => setFilterWallet(!filterWallet)}
              className={`px-4 py-2 text-sm border rounded-lg transition-all duration-300 flex items-center gap-2 ${filterWallet ? 'bg-[#00ffcc]/20 border-[#00ffcc] text-[#00ffcc] shadow-[0_0_15px_rgba(0,255,204,0.3)]' : 'bg-black/40 border-slate-700 text-slate-300 hover:border-[#00ffcc]/50'}`}
            >
              <Sparkles size={16} />
              {filterWallet ? 'Filtering by Wallet' : 'Scan My Wallet'}
            </button>
          )}
          <ConnectButton 
            chainStatus="icon" 
            showBalance={false} 
          />
        </div>
      </header>

      {/* 3D SCENE BACKGROUND */}
      <div className="absolute inset-0 z-0">
        <Scene 
          pools={pools} 
          loading={loading} 
          onSelect={setSelectedPool} 
          filterWallet={filterWallet}
          walletAssets={[]} // Mocked for safety if we can't parse all chain RPCs perfectly today
          selectedPool={selectedPool}
        />
      </div>

      {/* INSPECTOR MODAL */}
      <AnimatePresence>
        {selectedPool && (
          <motion.div
            initial={{ opacity: 0, x: 50, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="absolute right-6 top-32 w-80 bg-[#0a0a1a]/90 backdrop-blur-xl border border-neon rounded-xl p-5 z-50 shadow-[0_0_30px_rgba(0,255,204,0.1)] pointer-events-auto"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-xs text-[#9d4edd] font-bold uppercase tracking-widest mb-1">{selectedPool.chain}</p>
                <h2 className="text-xl font-bold text-white leading-tight">{selectedPool.symbol}</h2>
                <p className="text-sm text-slate-400 mt-1">{selectedPool.project}</p>
              </div>
              <button 
                onClick={() => setSelectedPool(null)}
                className="text-slate-500 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div className="bg-black/50 p-3 rounded-lg border border-slate-800">
                <p className="text-xs text-slate-500 uppercase mb-1">Total APY</p>
                <p className="text-3xl font-bold text-[#00ffcc] text-neon-glow">
                  {selectedPool.apy.toFixed(2)}%
                </p>
                <div className="flex gap-2 mt-2 text-xs">
                  <span className="text-slate-400">Base: {selectedPool.apyBase?.toFixed(2) || '0.00'}%</span>
                  <span className="text-slate-400">Rwd: {selectedPool.apyReward?.toFixed(2) || '0.00'}%</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-black/50 p-3 rounded-lg border border-slate-800">
                  <p className="text-xs text-slate-500 uppercase mb-1">TVL</p>
                  <p className="text-sm font-semibold text-white">{fmtTvl(selectedPool.tvlUsd)}</p>
                </div>
                <div className="bg-black/50 p-3 rounded-lg border border-slate-800">
                  <p className="text-xs text-slate-500 uppercase mb-1">Rewards</p>
                  <p className="text-sm font-semibold text-white truncate">
                    {selectedPool.rewardTokens?.length > 0 ? selectedPool.rewardTokens.join(', ') : 'None'}
                  </p>
                </div>
              </div>
            </div>

            <a 
              href={selectedPool.link}
              target="_blank"
              rel="noreferrer"
              className="w-full py-3 bg-gradient-to-r from-[#00ffcc] to-[#9d4edd] text-black font-bold uppercase tracking-wider text-sm rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
            >
              Deposit via {selectedPool.project}
            </a>

            <div className="mt-4 flex items-start gap-2 text-[10px] text-slate-500">
              <ShieldAlert size={14} className="shrink-0 mt-0.5 text-[#f72585]" />
              <p>Verify contract addresses and impermanent loss risks before depositing funds. Yields fluctuate constantly.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LOADING OVERLAY */}
      <AnimatePresence>
        {loading && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#050510] z-40 flex flex-col items-center justify-center"
          >
            <div className="w-16 h-16 border-4 border-slate-800 border-t-[#00ffcc] rounded-full animate-spin mb-4 shadow-[0_0_15px_rgba(0,255,204,0.5)]"></div>
            <p className="text-[#00ffcc] tracking-[0.2em] text-sm animate-pulse">SYNCING DEFI ORACLE...</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

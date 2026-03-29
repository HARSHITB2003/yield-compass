import { NextResponse } from 'next/server';

export const revalidate = 3600; // Cache for 1 hour

export async function GET() {
  try {
    const res = await fetch('https://yields.llama.fi/pools');
    
    if (!res.ok) {
      throw new Error(`Failed to fetch from DefiLlama: ${res.status}`);
    }

    const data = await res.json();
    
    if (!data.data || !Array.isArray(data.data)) {
      throw new Error('Invalid data format from DefiLlama');
    }

    // Filter for safe, liquid pools across major chains
    const validChains = ['Ethereum', 'Arbitrum', 'Base', 'Optimism', 'Polygon', 'Solana', 'Avalanche'];
    const safeTokens = ['USDC', 'USDT', 'DAI', 'WETH', 'ETH', 'WBTC', 'wstETH', 'cbETH'];

    const filteredPools = data.data
      .filter((pool: any) => {
        // TVL greater than $5M to avoid illiquid/risky micro-pools
        if (pool.tvlUsd < 5000000) return false;
        
        // Must be on a major chain we are visualizing
        if (!validChains.includes(pool.chain)) return false;

        // Ensure it contains at least one recognized blue-chip token symbol
        const symbols = pool.symbol.split('-');
        const hasSafeToken = symbols.some((sym: string) => safeTokens.includes(sym.toUpperCase()));
        if (!hasSafeToken) return false;

        return true;
      })
      .map((pool: any) => ({
        id: pool.pool,
        chain: pool.chain,
        project: pool.project,
        symbol: pool.symbol,
        tvlUsd: pool.tvlUsd,
        apy: pool.apy,
        apyBase: pool.apyBase,
        apyReward: pool.apyReward,
        rewardTokens: pool.rewardTokens || [],
        link: `https://defillama.com/yields/pool/${pool.pool}` // Fallback link
      }))
      .sort((a: any, b: any) => b.apy - a.apy) // Sort by APY descending
      .slice(0, 150); // Take top 150 safe yields to map out

    return NextResponse.json({ success: true, count: filteredPools.length, data: filteredPools });

  } catch (error: any) {
    console.error('Error fetching yields:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch yield data' },
      { status: 500 }
    );
  }
}

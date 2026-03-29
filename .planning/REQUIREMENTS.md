# 🌍 Requirements: YieldCompass (Working Prototype)

## Core Requirements (No Mock Data)

### 1. Web3 Wallet Connection (The "Full Stack" layer)
- Must integrate RainbowKit or ConnectKit.
- Must support MetaMask, WalletConnect, and Coinbase Wallet.
- Must read the user's connected wallet address and basic token balances (specifically USDC or ETH) on the Ethereum/Arbitrum/Base chains.

### 2. Live Data Ingestion
- Must fetch real-time APY and TVL data from the DefiLlama `/pools` API endpoint.
- Must filter this massive dataset on the server to prevent crashing the browser (e.g., only show pools with >$10M TVL and >5% APY).

### 3. The 3D Engine
- Must render an interactive 3D WebGL map using React Three Fiber.
- Hovering/clicking a 3D node must open an HTML-overlay "Inspector Modal" (using Framer Motion) showing real data (Protocol Name, Chain, APY, TVL, and a direct link to the dApp).

### 4. Interactive Filtration
- "Scan My Wallet" button: Reads the user's balances and filters the 3D map to only show yields matching the tokens they currently hold.

### 5. UI/UX Design System
- Theme: "Cyberpunk Terminal" (Deep space blacks, glowing neon greens, purples, and blues).
- Font: monospace or sleek sans-serif (Inter/Geist).

## Non-Requirements (Out of Scope for Day 3)
- Writing a custom smart contract router.
- Building our own Subgraph/Indexer.
- Directly executing bridging transactions within our own UI (we will link out to the specific protocol or 1inch to prevent security liability for a 1-day build).

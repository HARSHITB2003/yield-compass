# 🌍 Execution Roadmap: YieldCompass

This roadmap outlines the steps to build a fully-functional, live-data Web3 prototype.

## Phase 1: Project Initialization & Scaffold
- [ ] Initialize Next.js 15 with Tailwind v4 in `/desktop/yield-compass`
- [ ] Install 3D packages: `three`, `@react-three/fiber`, `@react-three/drei`
- [ ] Install Web3 packages: `wagmi`, `viem`, `@tanstack/react-query`
- [ ] Install motion packages: `framer-motion`, `lucide-react`
- [ ] Set up global CSS for the "Deep Space/Cyberpunk" theme

## Phase 2: Live Data Integration (The Engine)
- [ ] Create server-side API route (`/api/yields`) to fetch from `https://yields.llama.fi/pools`
- [ ] Write a data transformer to filter the top 50 safest/highest USDC/ETH pools
- [ ] Create a React component to fetch and hold this data cleanly

## Phase 3: The 3D WebGL Visualization
- [ ] Build the base `Canvas` component covering the full viewport
- [ ] Implement `OrbitControls` for panning/zooming
- [ ] Create a `YieldNode` component: A glowing 3D sphere representing a specific liquidity pool
- [ ] Map the DefiLlama data to dynamically generate `YieldNode` spheres in a galaxy/constellation layout
- [ ] Implement `Html` overlays (from `@react-three/drei`) so nodes display APY text in 3D space

## Phase 4: Web3 Wallet & User Interaction
- [ ] Add the "Connect Wallet" RainbowKit button to the header UI
- [ ] Implement the Wagmi hook `useBalance` to read standard USDC/ETH balances
- [ ] Create the "Scan My Assets" feature: A toggle that dims all 3D nodes that do not match the user's wallet tokens, highlighting valid opportunities.
- [ ] Build the "Inspector Modal" (2D overlay) that appears when a 3D node is clicked, showing TVL, 30-day APY trend, and a "Deposit Now" outbound link to the real protocol.

## Phase 5: Polish & Deployment
- [ ] Add post-processing effects to the 3D canvas (Bloom/Glow for high-yield nodes)
- [ ] Ensure the 2D UI elements are glassmorphic and visually stunning
- [ ] Deploy to Vercel and verify live API + Wallet connection on production

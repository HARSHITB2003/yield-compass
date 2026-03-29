# 🌍 Project Vision: YieldCompass

## Core Vision
YieldCompass is a visually striking, interactive 3D Web3 application that transforms Decentralized Finance (DeFi) data from boring spreadsheets into a breathtaking spatial experience. It is **not a fake dashboard**. It connects to live blockchains, pulls real-time APY data via DefiLlama, and reads a user's actual Web3 wallet balance.

## The Problem
DeFi UIs are notoriously terrible. Finding the highest, safest yield for a blue-chip asset like USDC requires jumping between dozens of tabs, DApps, and chains. Retail and mid-tier users are overwhelmed by rows of raw data.

## The Solution
A "Bloomberg Terminal crossed with a cyberpunk video game." 
Chains are visualized as 3D glowing nodes, and liquidity pools orbit them. Users connect their real MetaMask or Phantom wallet. The map filters the massive universe of yields, highlighting *only* the specific smart contracts their current assets can be deposited into, allowing them to click straight through to the protocol.

## Target Audience
- Mid-curve crypto investors who understand basic DeFi but hate navigating 15 different protocol websites.
- Airdrop farmers looking for high-yield multi-chain opportunities.
- Web3 enthusiasts who appreciate high-end design.

## Core Stack
- **Framework:** Next.js 15 (App Router)
- **Styling:** Tailwind CSS v4 
- **3D Visualization:** `three.js`, `@react-three/fiber`, `@react-three/drei`
- **Web3 Integration:** `wagmi`, `viem`, `@rainbow-me/rainbowkit` (for wallet connections)
- **Live Data:** DefiLlama `/pools` API (Real-time yield data)
- **Animations:** Framer Motion (for 2D overlays and modals)

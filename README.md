# 👑 Grand Royale Casino Simulator

> **A luxury, full-stack Progressive Web App (PWA) casino simulator built strictly for virtual play-money entertainment, mathematical game theory research, and strategy experimentation.**

[![License: MIT](https://img.shields.io/badge/License-MIT-amber.svg)](LICENSE)
[![React 19](https://img.shields.io/badge/React-19.0.1-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind-v4.3-38bdf8.svg)](https://tailwindcss.com/)
[![PWA Ready](https://img.shields.io/badge/PWA-Installable%20%26%20Offline-success.svg)](https://web.dev/progressive-web-apps/)
[![Provably Fair](https://img.shields.io/badge/Fairness-Provably%20Fair%20SHA--256-emerald.svg)](#-provably-fair-engine)
[![Play Money Only](https://img.shields.io/badge/Currency-100%25%20Virtual%20Play%20Money-gold.svg)](#-educational--responsible-gaming-disclaimer)

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Playable Game Catalog (7 Games)](#-playable-game-catalog-7-games)
  - [1. Golden Fortune Slots](#1-golden-fortune-slots)
  - [2. Royal Velvet Blackjack](#2-royal-velvet-blackjack)
  - [3. European Roulette](#3-european-roulette)
  - [4. Imperial Dice Arena (Hi-Lo & Table Craps)](#4-imperial-dice-arena)
  - [5. Jacks or Better Video Poker](#5-jacks-or-better-video-poker)
  - [6. Royal Baccarat (Punto Banco)](#6-royal-baccarat-punto-banco)
  - [7. Royal Plinko Pyramid](#7-royal-plinko-pyramid)
- [Experiment Lab & Monte Carlo Simulator](#-experiment-lab--monte-carlo-simulator)
- [Progressive Web App (PWA) & Offline Mode](#-progressive-web-app-pwa--offline-mode)
- [Version Control & Hard Cache Clearing](#-version-control--hard-cache-clearing)
- [Mobile & Touch Optimization](#-mobile--touch-optimization)
- [Provably Fair Engine](#-provably-fair-engine)
- [Virtual Economy & Peer Transfers](#-virtual-economy--peer-transfers)
- [Admin Management Console](#-admin-management-console)
- [Procedural Audio Engine](#-procedural-audio-engine)
- [System Architecture](#-system-architecture)
- [REST API Reference](#-rest-api-reference)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Deployment](#-deployment)
- [Educational & Responsible Gaming Disclaimer](#-educational--responsible-gaming-disclaimer)

---

## 🌟 Overview

**Grand Royale Casino Simulator** is an authentic, elegant casino simulation platform engineered with React 19, TypeScript, Node.js/Express, and Tailwind CSS v4. Designed with high-roller aesthetics (emerald felt, obsidian leather, brushed gold accents), the application simulates real Vegas and European casino mathematics, payouts, and betting constraints.

Every chip, transaction, and balance is **100% virtual play-money**. The platform is designed for enthusiasts, students, and strategists seeking to understand casino mathematics, house edges, and probability distributions without financial risk.

---

## 🎯 Key Features

- **🎰 7 Fully Playable Casino Games**: Slots, Blackjack, Roulette, Craps/Hi-Lo Dice, Video Poker, Baccarat, and Plinko.
- **📱 Robust PWA & Offline Support**: Installable on Android, iOS, Windows, and macOS with service worker precaching and seamless offline gameplay via a local browser simulation engine.
- **🔬 Monte Carlo Experiment Lab**: Automated strategy simulator testing Martingale, Paroli, D'Alembert, Flat Betting, and Fibonacci across 50–1,000 rounds with interactive SVG bankroll charts.
- **🔐 Provably Fair Cryptography**: Cryptographic SHA-256 server seed hashes, client seeds, and incremental nonces to verify game outcomes cannot be manipulated.
- **👥 Peer-to-Peer Transfer Market**: Send virtual chips between simulated players with memos, transfer fees, and balance protection.
- **⚙️ Live Admin Console**: Tweak theoretical house edge percentages, minimum/maximum table limits, toggle individual games, adjust balances, and audit chronological security logs.
- **🎵 Synthesized Procedural Audio**: Custom Web Audio API synthesizer for realistic chip clatter, card deals, wheel spin clicks, and jackpot fanfares without loading external MP3 files.
- **♿ Inclusive Accessibility**: Native support for reduced-motion animations, volume controls, mute toggles, and high-contrast game tables.

---

## 🎮 Playable Game Catalog (7 Games)

### 1. Golden Fortune Slots
- **Structure**: 3-reel mechanical slot machine with 5 classic paylines (3 horizontal, 2 diagonal).
- **Symbols & Paytable**: 
  - 🍒 Cherries (2x – 5x)
  - 🔔 Golden Bells (10x)
  - 🍫 Triple Bars (25x)
  - 7️⃣ Lucky Sevens (50x)
  - 💎 Diamonds / Wilds (100x – 250x)
- **Math & Settings**: Configurable RTP profiles (Standard 96.5%, Generous 98.0%, Tight 93.5%) with reel-spin deceleration physics.

### 2. Royal Velvet Blackjack
- **Table Rules**: Classic Vegas & European table rules. Dealer hits on soft 16 and stands on all 17s.
- **Player Actions**: Hit, Stand, Double Down (on two-card 9, 10, 11), and Split pairs.
- **Payouts**: 3:2 natural blackjack payout (configurable to 6:5 or 2:1 in Admin), standard 1:1 wins, and push on ties.
- **Shoe Mechanics**: Continuous 6-deck shoe simulation with standard rank/suit tracking.

### 3. European Roulette
- **Wheel Layout**: Single-zero European wheel with 37 numbered pockets (0, 1–36) offering a superior 2.70% house edge over American double-zero variants.
- **Betting Felt**: Full interactive layout supporting:
  - *Inside Bets*: Straight Up (35:1), Split (17:1), Street (11:1), Corner (8:1), Line (5:1).
  - *Outside Bets*: Red/Black (1:1), Odd/Even (1:1), Low 1-18 / High 19-36 (1:1), Dozens (2:1), Columns (2:1).
- **Animation & History**: CSS/SVG wheel spin animation with decelerating ball landing and hot/cold number statistics.

### 4. Imperial Dice Arena
Dual-mode dice table offering both modern provably fair dice and traditional casino craps:
- **Multiplier Hi-Lo Slider**:
  - Target slider selectable from 2.00 to 98.00.
  - Roll Over / Roll Under toggle.
  - Dynamic multiplier calculation ($99 / \text{winChance}$) and win probability readout.
- **Table Craps**:
  - Multi-roll pass line state machine (Come Out roll vs. Point phase).
  - Bets: Pass Line, Don't Pass, Field (double on 2 & 12), and Any Seven (4:1).
  - Animated 3D-styled dice tumble animations.

### 5. Jacks or Better Video Poker
- **Variant**: Full-pay 9/6 Jacks or Better video poker.
- **Mechanics**: 5-card deal phase with individual card HOLD toggles, followed by a second DRAW phase replacing non-held cards from the remaining deck.
- **Evaluated Hands & Multipliers**:
  - Royal Flush (250:1)
  - Straight Flush (50:1)
  - Four of a Kind (25:1)
  - Full House (9:1)
  - Flush (6:1)
  - Straight (4:1)
  - Three of a Kind (3:1)
  - Two Pair (2:1)
  - Jacks or Better (Pair of Jacks, Queens, Kings, or Aces) (1:1)

### 6. Royal Baccarat (Punto Banco)
- **Table Bets**: Player (1:1), Banker (1:1 less 5% commission, 0.95:1), Tie (8:1), Player Pair (11:1), Banker Pair (11:1).
- **Tableau Rules**: Automated standard third-card drawing rules:
  - Natural 8 or 9 ends the hand immediately.
  - Player draws on 0–5, stands on 6–7.
  - Banker draws conditionally according to the standard Baccarat tableau based on the Banker's total and the Player's third card.
- **Roadmaps**: Traditional Bead Plate score tracking for Player, Banker, and Tie outcomes.

### 7. Royal Plinko Pyramid
- **Engine**: Real-time 2D HTML5 canvas physics simulation of balls colliding against alternating rows of golden pegs.
- **Customizable Volatility**:
  - **Pin Rows**: 8, 12, or 16 rows.
  - **Risk Modes**: Low, Medium, High risk curves.
- **Payouts**: Edge-weighted multipliers scaling from 0.2x in the center up to **1,000x** on outer slots.

---

## 🔬 Experiment Lab & Monte Carlo Simulator

The **Experiment Lab** enables users to simulate thousands of betting rounds in milliseconds to test strategies against mathematical realities:

| Strategy | Logic | Risk Profile |
| :--- | :--- | :--- |
| **Flat Betting** | Wager the exact same base amount every round. | Lowest volatility, linear house edge decay. |
| **Martingale** | Double the wager after every loss; reset to base on win. | High risk of table limit ceiling and rapid bust. |
| **Reverse Martingale (Paroli)** | Double wager after each win up to 3 streaks; reset on loss. | Protects bankroll while riding hot streaks. |
| **D'Alembert** | Increase wager by 1 unit after loss; decrease by 1 unit after win. | Moderate equilibrium model. |
| **Fibonacci** | Step forward through Fibonacci sequence on loss, back 2 steps on win. | Slower escalation than Martingale. |

### Visual Analytics:
- **Interactive SVG Trajectory Chart**: Visualizes bankroll fluctuation over time.
- **Empirical RTP**: Real measured return-to-player compared to theoretical expectation.
- **Max Drawdown**: Peak-to-trough drop in balance during the test run.
- **Win/Loss Distribution**: Pie breakdown of wins, losses, and pushes.

---

## 📱 Progressive Web App (PWA) & Offline Mode

Grand Royale is an installable, standalone Progressive Web App conforming to modern PWA specifications:

### PWA Highlights:
- **Vite PWA Plugin (`vite-plugin-pwa`)**: Configured with `registerType: 'autoUpdate'` for seamless background updates.
- **Offline Gameplay Engine**: When disconnected from the internet or running in static environments, the application automatically switches to `LocalCasinoEngine` backed by `localStorage`. All games, balances, and history continue operating offline.
- **In-App Install Banner & Modal**:
  - Automatically captures the `beforeinstallprompt` event.
  - Prompts one-click installation on Chrome/Edge/Android.
  - Displays step-by-step guidance for iOS Safari users (*Share* $\rightarrow$ *Add to Home Screen*).
  - Automatically hides when the app runs in `standalone` display mode.
- **Web App Manifest**: Full metadata, dark theme colors (`#052e16`), high-resolution icons (192x192, 512x512), and maskable icons.
- **Connectivity Notification**: Non-intrusive `OfflineIndicator` bar when network drops.

---

## ⚡ Version Control & Hard Cache Clearing

Grand Royale implements strict client-side version tagging, migration verification, and an atomic hard cache clearing system:

- **Semantic Versioning (`v2.4.0`)**: Tracked across `package.json`, client `version.ts`, and server API responses (`/api/version` and `/api/state`).
- **One-Click Hard Cache Purge**:
  - Accessible via the top bar database icon, the mobile bottom navigation bar, the editorial footer, and the Admin Console.
  - **Service Worker Unregistration**: Programmatically iterates and unregisters all active service worker registrations (`navigator.serviceWorker.getRegistrations()`).
  - **Cache Storage Flush**: Deletes all browser Cache API namespaces (`caches.delete(cacheName)`).
  - **Session & Storage Cleaning**: Resets session memory and clears obsolete cache entries with an option to preserve virtual player chip balances.
  - **Forced Cache-Busting Reload**: Reloads the viewport using timestamp query parameters (`?_purge=...`) to force HTTP cache revalidation and load fresh JavaScript bundles.
- **Storage Diagnostics Dashboard**: Real-time breakdown of CacheStorage count, LocalStorage usage, Service Worker lifecycle status, and active cache namespaces.
- **Release Changelog Modal**: Chronological history of releases and architectural improvements directly accessible in the UI.

---

## 📲 Mobile & Touch Optimization

Engineered specifically for smooth handheld performance across smartphones and tablets:

- **Thumb-Friendly Bottom Navigation (`MobileNavBar`)**: Fixed bottom navigation bar with one-touch switching between Games, Strategy Lab, Transfers, Rules, Player Profile, and Cache Tools on mobile viewports.
- **Touch-Action Manipulation (`touch-action: manipulation`)**: Eliminates 300ms double-tap zoom delays on iOS WebKit and Android Chromium.
- **Safe-Area Insets**: Incorporates `viewport-fit=cover` and CSS `env(safe-area-inset-bottom)` padding to prevent device notches, rounded screen corners, and home swipe bars from clipping UI elements.
- **Enlarged Touch Targets**: 48px+ touch targets for chip denominations, bet multipliers, card hit/stand controls, and spin buttons.
- **Horizontal Swipe Strips**: Mobile chip selectors, game cards, and navigation rows scroll smoothly with native inertia.
- **Disabled Pinch Accidental Zooming**: Prevents accidental layout breaks while preserving accessibility options.

---

## 🔐 Provably Fair Engine

Every roll, shuffle, and spin can be verified cryptographically:

1. **Server Seed Generation**: At server startup, a secure 256-bit random seed is generated:
   $$\text{Seed} = \text{randomBytes}(32)$$
2. **Commitment Phase**: The client receives a public SHA-256 hash of the server seed:
   $$\text{Hash} = \text{SHA-256}(\text{Server Seed})$$
3. **Nonce Increment**: Every round increments a sequential nonce counter.
4. **Deterministic Resolution**: The result is derived deterministically from the combined server seed, client seed, and round nonce, preventing retroactive alterations.

---

## 💰 Virtual Economy & Peer Transfers

- **Starting Bankroll**: New players receive 5,000 starting chips.
- **Daily Bonus**: Claim 1,000 chips every 24 hours with an active countdown timer.
- **Instant Practice Refill**: Tap *Free Refill (+5,000)* or *Reset Balance* anytime to practice risk-free.
- **Peer Transfers**: Send chips to simulated players (`LadyLuck_Alice`, `StrategyLab_Pro`, etc.) with customized memos and optional transfer fee deductions.
- **Transaction Ledger**: Complete audit trail of every bet, win, bonus claim, and peer transfer.

---

## ⚙️ Admin Management Console

Access the **Management Console** tab to customize casino operations in real time:

- **Game Enablement**: Toggle any of the 7 games ON or OFF with immediate UI propagation.
- **Table Limits**: Set custom minimum bets (1–500) and maximum bets (10–50,000) per game.
- **House Edge Calibration**: Adjust theoretical house edges (0.1% to 15.0%).
- **Rule Modifiers**: Adjust Blackjack natural payouts (3:2, 6:5, 2:1) and slot volatility.
- **Player Oversight**: Freeze/unfreeze accounts, credit or debit chip balances, and review security audit logs.
- **Factory Reset**: Restore all balances, bankrolls, and settings to original defaults with one click.

---

## 🎵 Procedural Audio Engine

The `SoundService` class employs the browser's native **Web Audio API** (`AudioContext`) to generate synthesized procedural sound effects without downloading external audio files:

- **Chip Clatter**: High-frequency damped sine bursts (1800 Hz – 2400 Hz) simulating ceramic chip movement.
- **Card Swish**: Bandpass-filtered white noise mimicking felt friction.
- **Reel Click / Peg Bounce**: Short percussive impulses with rapid exponential gain decay.
- **Jackpot Fanfare**: Multi-tone harmonic triads (C major / G major / E major) for big wins.
- **Full Control**: Global mute toggle and volume slider in the top navigation bar.

---

## 🏗️ System Architecture

Grand Royale utilizes a **Hybrid Dual-Engine Architecture** that guarantees functionality across all deployment targets:

```
┌─────────────────────────────────────────────────────────────┐
│                    React 19 SPA (Client)                     │
│  ┌───────────────────────┐       ┌───────────────────────┐  │
│  │     UI Components     │       │     Sound Engine      │  │
│  │ (Blackjack, Baccarat, │       │   (Web Audio API)     │  │
│  │  Plinko, Slots, etc.) │       └───────────────────────┘  │
│  └───────────┬───────────┘                                  │
│              │                                              │
│              ▼                                              │
│     ┌─────────────────────────────────────────────────┐     │
│     │            ApiService Client Layer              │     │
│     └────────┬───────────────────────────────┬────────┘     │
└──────────────┼───────────────────────────────┼──────────────┘
               │ (Online / Full-Stack)         │ (Offline / Static)
               ▼                               ▼
┌───────────────────────────────┐  ┌───────────────────────────┐
│     Express REST Backend      │  │    Local Browser Engine   │
│         (server.ts)           │  │     (localEngine.ts)      │
│  - Provably Fair RNG          │  │  - Zero Network Required  │
│  - Anti-Replay Nonces         │  │  - localStorage Fallback  │
│  - Persistent JSON Storage    │  │  - Client-Side RNG        │
│  - Audit Logging              │  │  - Instant PWA Play       │
└───────────────────────────────┘  └───────────────────────────┘
```

1. **Full-Stack Mode (Node.js/Express)**:
   - Full REST endpoints validate bets, handle card dealing, check balances, and prevent double-spending.
   - State persists to `data/casino_state.json`.
2. **Offline & Static Mode (PWA / GitHub Pages)**:
   - If `/api/*` endpoints are unavailable, `ApiService` gracefully falls back to `localEngine.ts`.
   - Complete gameplay, admin settings, and wallets are preserved in `localStorage`.

---

## 📡 REST API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/state` | Returns casino configuration, active player profile, and server seed hash. |
| `POST` | `/api/config` | Updates game rules, table limits, and house edge percentages. |
| `POST` | `/api/player/bonus/claim` | Claims the 24-hour daily bonus. |
| `POST` | `/api/player/balance/reset` | Resets practice wallet to default balance. |
| `POST` | `/api/player/transfer` | Transfers chips to another player with a memo. |
| `POST` | `/api/games/slots/spin` | Evaluates a slot machine spin across 5 paylines. |
| `POST` | `/api/games/blackjack/deal` | Initiates a new blackjack hand and deals initial cards. |
| `POST` | `/api/games/blackjack/action` | Executes a blackjack action (`hit`, `stand`, `double`, `split`). |
| `POST` | `/api/games/roulette/spin` | Evaluates inside and outside roulette wagers. |
| `POST` | `/api/games/dice/multiplier` | Resolves a Provably Fair Hi-Lo dice roll. |
| `POST` | `/api/games/dice/craps` | Rolls craps dice and updates Pass/Don't Pass game state. |
| `POST` | `/api/games/videopoker/deal` | Deals initial 5 video poker cards. |
| `POST` | `/api/games/videopoker/draw` | Discards non-held cards, draws replacements, and pays winning hands. |
| `POST` | `/api/games/baccarat/play` | Deals Punto Banco hands, applies 3rd card rules, and calculates payouts. |
| `POST` | `/api/games/plinko/drop` | Drops a ball through peg rows and returns path and multiplier. |
| `POST` | `/api/experiment/simulate` | Executes a batch Monte Carlo strategy simulation. |

---

## 📂 Project Structure

```
.
├── data/
│   └── casino_state.json        # Persistent JSON database (players, config, audit)
├── public/
│   ├── favicon.png              # High-res casino chip favicon
│   ├── icon.svg                 # Scalable vector master logo
│   ├── pwa-192x192.png          # Standard mobile PWA home screen icon
│   ├── pwa-512x512.png          # High-resolution splash icon
│   ├── pwa-maskable-512x512.png # Adaptive maskable Android icon
│   └── apple-touch-icon.png     # iOS Safari home screen icon
├── scripts/
│   └── generate-icons.js        # Automated Sharp image generator for PWA assets
├── src/
│   ├── components/
│   │   ├── games/
│   │   │   ├── SlotsGame.tsx       # 3-reel slot machine component
│   │   │   ├── BlackjackGame.tsx   # Blackjack table & card hand renderer
│   │   │   ├── RouletteGame.tsx    # European wheel & betting felt
│   │   │   ├── DiceGame.tsx        # Multiplier slider & craps felt
│   │   │   ├── VideoPokerGame.tsx  # Jacks or Better card hold/draw interface
│   │   │   ├── BaccaratGame.tsx    # Punto Banco table & bead plate
│   │   │   └── PlinkoGame.tsx      # HTML5 canvas peg physics simulator
│   │   ├── AdminDashboard.tsx      # Management console & rule tuning
│   │   ├── ChipSelector.tsx        # Denomination betting chips (10, 25, 100, 500, etc.)
│   │   ├── ExperimentLab.tsx       # Monte Carlo testing workbench & charts
│   │   ├── Header.tsx              # Top bar, balance badges, audio & PWA controls
│   │   ├── OfflineIndicator.tsx    # Network connectivity banner
│   │   ├── ProfileModal.tsx        # Player achievements, stats & wallet ledger
│   │   ├── PWAInstallButton.tsx    # In-app installation trigger & iOS modal
│   │   ├── RulesSection.tsx        # Mathematical rules & paytables guide
│   │   └── TransferMarket.tsx      # Peer-to-peer chip transfer interface
│   ├── hooks/
│   │   ├── useOnlineStatus.ts      # Real-time online/offline network detection
│   │   └── usePWAInstall.ts        # PWA install prompt & standalone detection
│   ├── services/
│   │   ├── api.ts                  # HTTP client with automatic local fallback
│   │   ├── localEngine.ts          # Complete offline client simulation engine
│   │   └── sound.ts                # Web Audio API procedural sound synthesizer
│   ├── types/
│   │   └── casino.ts               # Core TypeScript models, games, and states
│   ├── App.tsx                     # Main layout and tab routing
│   ├── main.tsx                    # React mount & PWA service worker registration
│   └── index.css                   # Global styles & Tailwind CSS v4 setup
├── server.ts                       # Express backend with game logic & persistence
├── vite.config.ts                  # Vite build config with VitePWA plugin
├── tsconfig.json                   # TypeScript compiler configuration
└── package.json                    # Project metadata and dependencies
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### Installation
```bash
# Clone the repository
git clone https://github.com/CptNope/Lucas-Idea.git
cd Lucas-Idea

# Install dependencies
npm install
```

### Running Locally (Full-Stack Dev Mode)
```bash
# Starts Express server mounted with Vite middlewares at http://localhost:3000
npm run dev
```

### Type Checking & Linting
```bash
npm run lint
```

### Production Build
```bash
npm run build
```

---

## 🚢 Deployment

### 1. Full-Stack Node / Container (Recommended)
Because `server.ts` combines both the API routes and production static file serving, you can deploy to any Node.js environment (Cloud Run, Docker, Render, Fly.io, VPS):

```bash
# 1. Build the frontend
npm run build

# 2. Start the production server
npm run start
```

### 2. Static Hosting / GitHub Pages
The application includes an automated workflow (`.github/workflows/deploy.yml`) for GitHub Pages. 

When hosted statically without a Node backend, `ApiService` automatically detects the static environment and boots the embedded **`LocalCasinoEngine`**, delivering 100% of games, wallet functionality, and PWA capabilities offline.

1. Push your changes to the `main` branch.
2. In GitHub, go to **Settings** > **Pages**.
3. Under **Build and deployment** > **Source**, choose **GitHub Actions**.

---

## 🛡️ Educational & Responsible Gaming Disclaimer

> **IMPORTANT NOTICE:**  
> **Grand Royale Casino Simulator is strictly an educational tool and simulation game.**  
> - All chips, balances, wagers, and payouts consist **entirely of simulated play money** with **zero real-world financial value**.
> - There are **NO real deposits, NO withdrawals, and NO prizes of any kind**.
> - The purpose of this software is to demonstrate casino mathematics, probability theory, software architecture, and Progressive Web App mechanics.
> - Practice or success in simulated casino games does not imply future success at real-money gambling.
> - If you or someone you know is experiencing gambling-related problems, please consult resources such as the [National Council on Problem Gambling](https://www.ncpgambling.org/) (1-800-522-4700).

---

## 📄 License

This project is licensed under the **MIT License** — feel free to explore, learn from, and adapt the codebase for educational and personal projects.

---

Built by [Jeremy Anderson Tech](https://jeremyanderson.tech/), a web development and security practice in Shrewsbury, MA. Read more on the [project page](https://jeremyanderson.tech/project/grand-royale-casino-simulator/). [Services](https://jeremyanderson.tech/services/)

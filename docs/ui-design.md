# Technical Specification: Pharos Volatility Sentinel Dashboard Redesign

This document specifies the architecture, UI layout, and simulation logic for the redesigned Pharos Volatility Sentinel (Gate 7) Web Sandbox Dashboard.

---

## 1. Goal & Objectives
The original Web Sandbox layout mimicked the older Execution Shield single-transaction form. To differentiate this standalone project and emphasize Gate 7 (Market Regime Gate), the UI is redesigned as a real-time **Volatility Sentinel Command Center**.

The redesigned sandbox accomplishes the following:
1. **Interactive Real-Time Monitoring Grid:** Shifts from static fields to dynamic oracle indicators (VIX, Bridge Net Flow, Price Divergence) rendered with live sparklines.
2. **AI Agent Simulation Arena:** Spawns mock AI agents executing transactions simultaneously on a loop, visually demonstrating regime gate enforcement.
3. **Explicit Hackathon Partner Technologies Display:** Integrated visualizations highlighting GoPlus Security Address checks, CertiK SkyNet rating scales, and Anvita Flow middleware error handling.
4. **Alibaba Cloud serverless representation:** Highlighting serverless uptime and function endpoints.

---

## 2. Component Architecture & UI Layout

The interface is structured as a responsive single-page dashboard using CSS grid layout:

```
+---------------------------------------------------------------------------------------------------+
|  [PHAROS VOLATILITY SENTINEL]                           (Mock Mode: On/Off) (Wallet Status/Addr)  |
+---------------------------------------------------------------------------------------------------+
|                                                                                                   |
|  +----------------------------------------------------+   +------------------------------------+  |
|  | COLUMN 1: Live Security Oracle Monitor            |   | COLUMN 2: Market Regime Shield    |  |
|  | +------------------------------------------------+ |   | +--------------------------------+ |  |
|  | | [VIX Chart]   | [Bridge Net Flow] | [Diverge]  | |   | |       (Shield Radar Sweep)     | |  |
|  | +------------------------------------------------+ |   | |                                | |  |
|  |                                                  | |   | |       [NORMAL / ACTIVE]        | |  |
|  | Market Risk Shock Injectors:                     | |   | +--------------------------------+ |  |
|  | [Dex Spike] [Bridge Panic] [Stabilize Feeds]     | |   | [Normal] [Volatile] [Panic]      | |  |
|  +----------------------------------------------------+   +------------------------------------+  |
|                                                                                                   |
|  +---------------------------------------------------------------------------------------------+  |
|  | FULL WIDTH: AI Agent Simulation Arena                                                       |  |
|  | +---------------------------------+  +-------------------------------+  +-----------------+ |  |
|  | | DeFi Yield Agent               |  | Arbitrage Agent               |  | Liquidation Bot | |  |
|  | | Target: Uniswap (CertiK: 94)   |  | Target: Pool (CertiK: Low)    |  | Target: Scam    | |  |
|  | | Status: Executed               |  | Status: Blocked (Gate 7)      |  | Status: Phishing| |  |
|  | +---------------------------------+  +-------------------------------+  +-----------------+ |  |
|  +---------------------------------------------------------------------------------------------+  |
|                                                                                                   |
|  +---------------------------------------------------------------------------------------------+  |
|  | FULL WIDTH: Security Gate System Monitoring Logs Console                                     |  |
|  +---------------------------------------------------------------------------------------------+  |
+---------------------------------------------------------------------------------------------------+
```

### 2.1 UI Theme & Styles
* **Typography:** `Outfit` for display and dashboard labels; `Fira Code` for terminal output, transaction hashes, and addresses.
* **Palette:**
  * Background: Cyberpunk deep dark (`#08090d`).
  * Normal/Success: Neon green (`#2bad0a`).
  * Warning/Volatile: Neon orange (`#ff761c`).
  * Danger/Panic: Neon red (`#d0021b`).
  * Highlights/Info: Electric blue (`#0ea5e9`).
* **Visual Effects:** Smooth CSS variables, subtle glassmorphism blur (`12px`), radial gradients, neon glows, and scale animations.

---

## 3. Detailed Components Specification

### 3.1 Live Security Oracle Monitor
Queries and renders three parameters on a 3-second update loop:
1. **Market Volatility (VIX):** Normal range `15.0 - 22.0`. Warning/Volatile threshold `>30.0`. Panic threshold `>45.0`.
2. **Bridge Net Flow:** Normal range `0.5M - 2.0M`. Panic threshold `>10.0M`.
3. **Oracle Price Divergence:** Normal range `<0.10%`. Volatile threshold `>1.00%`.

**Sparklines rendering:** Built using dynamic inline SVG path generation. An array of the last 10 historical values is stored. Each update pushes a new value, drops the oldest, scales the points dynamically to fit the container bounds, and recalculates the SVG `<path d="...">` attribute.

### 3.2 Market Risk Shock Injectors
Buttons trigger immediate state overrides:
* **Dex Volatility Spike:** Elevates VIX to `48.0` and price divergence to `2.4%`.
* **Bridge Outflow Panic:** Shoots Bridge Net Flow to `14.8M / hr`.
* **Stabilize Feeds:** Returns metrics to VIX=`18.2`, Bridge=`1.2M`, Divergence=`0.05%` over 2 cycles.

### 3.3 Market Regime Shield
Renders the current protective state of Gate 7:
* **Shield Radar Ring:** Rotates continuously via CSS keyframes.
* **Shield Core Icon:** Uses classes that toggle pulsing scales and color drop-shadows:
  * `.secure-pulse` (Green): 2s pulse. Normal state.
  * `.warning-pulse` (Orange): 1.5s pulse. Volatile state.
  * `.danger-pulse` (Red): 0.8s rapid pulse. Panic state.
* **Keeper Bot Auto Toggle:** If active, updates the regime automatically:
  * `Bridge Net Flow > 10M` $\to$ **PANIC**
  * `VIX > 30` or `Price Divergence > 1.0%` $\to$ **VOLATILE**
  * Else $\to$ **NORMAL**
* **Manual Override Buttons:** Forces market regime update. In Mock Mode, toggles immediately; in Web3 mode, triggers a MetaMask transaction invoking `setMarketRegime(uint8)`.

### 3.4 AI Agent Simulation Arena
Three mock agents operate continuously, demonstrating the defensive pipelines:
1. **DeFi Yield Agent:** targets Uniswap V2 Router (`0x2c692A2291ad46D034bAbF4a5ACF287341B7797a`). CertiK score `94` (Verified).
2. **DeFi Arbitrage Agent:** targets Unrated Contract (`0x2222222222222222222222222222222222222222`). CertiK score `0` (Unverified).
3. **Phishing Target Agent:** targets a malicious address (`0x1111111254fb6c44bac0bed2854e76f90643097d`). Flagged as phishing.

**State-Regime Matrix:**
| Regime | DeFi Yield Agent (Uniswap, Score 94) | Arbitrage Agent (Unrated, Score 0) | Phishing Agent (Scam Address) |
|---|---|---|---|
| **NORMAL** | **✅ Executed** (Registry/Slippage ok) | **✅ Executed** (Allowed under normal) | **❌ Blocked** (Registry/GoPlus intercepts) |
| **VOLATILE** | **✅ Executed** (CertiK score $94 > 80$) | **❌ Blocked** (Gate 7: CertiK score low) | **❌ Blocked** (Registry/GoPlus intercepts) |
| **PANIC** | **❌ Blocked** (Gate 7: Halted globally) | **❌ Blocked** (Gate 7: Halted globally) | **❌ Blocked** (Registry/GoPlus intercepts) |

---

## 4. Integration with Hackathon Partner Technologies

The frontend logic exposes and explains the following alignments:
* **GoPlus Security Address API:** Simulated or live JSON-RPC calls checking addresses. Output shows phishing checks explicitly blocking malicious targets.
* **CertiK SkyNet ratings:** Scoring badges dynamically rendered next to transaction targets inside the Agent Arena.
* **Anvita Flow Middleware:** The logs capture structural fallback actions (e.g. "Anvita Graph Node triggers Slippage Re-optimization fallback route" when slippage fails).
* **Alibaba Cloud Serverless:** Displays Alibaba Function Compute endpoint configurations and execution latency statistics in the header.

---

## 5. Implementation Steps
1. **HTML Revamp:** Modify `index.html` to structure the grid layout, charts, Agent Arena cards, and updated CSS selectors.
2. **CSS Polish:** Append style rules to `css/style.css` matching the Cyberpunk dark theme, SVG sparklines, radar sweep animations, and agent arena indicators.
3. **JS Logic Overhaul:** Rewrite `js/app.js` to coordinate the 3-second oracle updates, SVG line draw calculations, shock injectors, Keeper bot thresholds, and multi-agent simulation loop.
4. **Local Verification:** Run `npm run demo-web` to verify layout rendering and simulation flows.

# Design Specification: Pharos Market Regime Gate Premium Dashboard (Vara-Style)

This document specifies the technical design, visual aesthetics, component structure, and behavior logic for the redesigned **Pharos Volatility Sentinel & Market Regime Gate Dashboard** located in `d:\dorahack\pharos-market-regime-gate`.

---

## 1. Brand Identity & Visual Aesthetics

The visual theme follows the **Glassmorphic Neon Cyberpunk** aesthetic, inspired by the Vara Network Agents Dashboard. It focuses on premium developer tools, signaling trust, automation, and real-time execution safety.

### Color Tokens
*   **Base Canvas Background:** `#030303` (Pure obsidian black)
*   **Glass Containers:** `rgba(9, 9, 11, 0.65)` with `backdrop-filter: blur(24px)`
*   **Default Card Borders:** `rgba(255, 255, 255, 0.05)` (Ultra thin 1px border)
*   **Primary Accent (Pharos Orange):** `#ff761c` (Glow/active border shadow)
*   **Success Green:** `#24a107` (Verified contracts, Normal Regime, safe actions)
*   **Info Blue:** `#0ea5e9` (Standard network metrics)
*   **Danger Red:** `#ef4444` (Blacklisted contracts, Panic Regime, blocked status)

### Typography
*   **Headers & Body UI:** `Geist Sans` (`sans-serif`) - for clean, modern readability.
*   **Technical Data & Console Logs:** `Geist Mono` (`monospace`) - for hex values, block numbers, log streams, and metric values.

---

## 2. Layout Structure & Components

The interface is structured as a fluid, modern dashboard layout with a responsive two-column grid on desktop.

```
+-------------------------------------------------------------------------+
| [Brand logo] Pharos::Sentinel   Overview Regime Gate Agent Arena Logs   |  <-- Glass Header
+-------------------------------------------------------------------------+
| Pulse Dot  Pharos Atlantic Testnet  Block #188K  Regime: NORMAL  Wallet |  <-- Sub-header
+-------------------------------------------------------------------------+
|  VIX Metric     Bridge Flow     Price Divergence    Auto-Keeper Bot     |  <-- Metrics Grid
|  [Sparkline]    [Sparkline]     [Sparkline]         [Shock Injectors]   |
+-------------------------------------------------+-----------------------+
|  Shield Gate: Gate 7 Market Regime Shield       |  AI Agent Arena       |
|                                                 |  - Yield Agent Card   |
|  [Concentric animated radar ring display]       |  - Arb Agent Card     |
|                                                 |  - Scam Agent Card    |
|  [NORMAL] [VOLATILE] [PANIC] Buttons (Override)  |                       |
+-------------------------------------------------+-----------------------+
|  Live Security Extrinsics Event Logs Console                            |  <-- Logs Feed
+-------------------------------------------------------------------------+
```

### 1. Sticky Glass Navigation Bar
*   **Brand Link:** Logo icon (Zap/Shield) with `Pharos::Sentinel` branding.
*   **Center Navigation:** Links to `#overview`, `#regime-gate`, `#agent-arena`, `#live-logs`.
*   **Right Controls:**
    *   Mock Mode Toggler (Switch).
    *   Wallet Connect Button: Shows status dot, connection account string (`Mock Mode Active` or truncated Web3 address).
    *   Network Badge: `PHRS ATLANTIC`.

### 2. Sub-header Metadata Bar
*   **Left:** Pulsing network health dot with `Pharos Atlantic Testnet` label.
*   **Right:**
    *   `Block #<number>` (Increments every 3 seconds to simulate chain progress).
    *   `Active Regime <NORMAL/VOLATILE/PANIC>` (Highlights active regime in corresponding state color).
    *   `Wallet Balance` (MetaMask balance or mock balance).
    *   `Engine` (Truncated address link to the ExecutionEngine contract).

### 3. Insights Metrics Grid
*   **Market Volatility (VIX):** Numerical index value + dynamically drawn SVG sparkline path (Orange glow, gradient area fill).
*   **Bridge Net Flow:** Flow speed (e.g. `1.2M / hr`) + blue SVG sparkline.
*   **Oracle Price Divergence:** Percentage value + green stable indicator line.
*   **Auto-Keeper Bot Controller:**
    *   Auto-Keeper toggle switch.
    *   **Risk Shock Injectors:** Inline button row (`DEX Spike`, `Bridge Outflow`, `Stabilize`) to trigger mock conditions.

### 4. Gate 7 Market Regime Shield
*   **Radar/WebGL Display:** Replace static CSS circles with a WebGL `<canvas id="shield-3d-canvas">` running a Three.js scene.
*   **Three.js Visual Effects:**
    *   **Core Particle Sphere:** 1,200 particle points (`THREE.Points`) arranged in a sphere, rotating slowly. Màu hạt thay đổi tự động (lerp) theo trạng thái regime: Green (Normal), Orange (Volatile), Red (Panic).
    *   **Hologram Scanning Rings:** Flat rotating wireframe rings surrounding the sphere, simulating active security sweeps.
    *   **Regime-Dependent Speeds:** Rotation speed increases as regime severity intensifies (Normal = 1x, Volatile = 2.5x, Panic = 6x).
*   **Regime Buttons:** Manual override button row (`Normal`, `Volatile`, `Panic`) styled in corresponding state colors.

### 5. AI Agent Arena
*   Contains 3 autonomous agent cards, each containing custom interactive graphics:
    *   **Yield Agent Card:** Features a 2D Canvas Radar Chart showing five axes (Safety, Yield, Liquidity, Gas, Speed). The chart area breathes slowly using a Sine wave.
    *   **Arb Agent Card:** Features a 2D Canvas Dual-Line Chart showing two overlapping curves (DEX Pool vs. Reference Price) in blue and orange. The shaded delta represents the arbitrage spread.
    *   **Scam Agent Card:** Features a 2D Canvas Generative Dendritic Tree (Cấu trúc phân nhánh mã độc) drawn recursively in glowing neon red, simulating blockchain phishing propagation.
    *   **Agent Terminal Logs:** Dedicated monospace console logs displaying transaction feedback.

### 6. Live Logs Console (Live Security Extrinsics)
*   Table-styled scrolling terminal container displaying:
    *   Timestamp column.
    *   Status Badge (`[SYS]`, `[ERR]`, `[OK ]`, `[INF]`).
    *   Details log text.

---

## 3. Dynamic Logic & Simulation States

The dashboard logic handles both **Mock Mode** (local UI simulation loop) and **Web3 Mode** (real-time MetaMask integration).

### Mock Mode Loops
*   **Fluctuation Loop:** Every 3 seconds, unless recently shocked, the metrics slowly float up/down by small randomized deltas.
*   **Auto-Keeper Logic:** If Auto-Keeper is enabled, the code evaluates metrics:
    *   If `Bridge Net Flow > 10.0M / hr` -> Trigger PANIC (2).
    *   If `VIX > 30.0` or `Oracle Price Divergence > 1.0%` -> Trigger VOLATILE (1).
    *   Else -> Trigger NORMAL (0).
*   **Shock Parameters:**
    *   `DEX Spike`: Sets VIX to `42.8` and Divergence to `1.85%`.
    *   `Bridge Outflow`: Sets Bridge Flow to `14.8M / hr`.
    *   `Stabilize`: Returns VIX to `18.2`, Bridge Flow to `1.2M / hr`, Divergence to `0.05%`.

### Web3 Mode Integration
*   Connects to MetaMask using Ethers.js v6.
*   Synchronizes the active regime state by reading `currentRegime()` from the deployed `MarketRegimeGate` contract (`0xECF86Cf42d27582FDcc60Eed65F0bB7567c789CF`).
*   Broadcasts transaction `setMarketRegime(uint8 _regime)` when manually overriding the regime (verifying owner permission).

---

## 4. Advanced Graphics Technical Specifications

### Three.js (WebGL) Shield Render Implementation
*   **Renderer:** WebGLRenderer with `alpha: true` and `antialias: true` targeting `#shield-3d-canvas`.
*   **Scene Components:**
    *   `THREE.Points` with a custom shader or texture to represent a glowing particle core.
    *   `THREE.RingGeometry` for the outer orbital rings.
    *   `THREE.AmbientLight` and `THREE.PointLight` for local illumination, colors bound to `currentRegime`.
*   **Animation Loop:**
    ```javascript
    function animate() {
        requestAnimationFrame(animate);
        // Rotate particle core
        particleSphere.rotation.y += rotationSpeed;
        particleSphere.rotation.x += rotationSpeed * 0.5;
        // Rotate scanner ring
        scanningRing.rotation.z += scanSpeed;
        renderer.render(scene, camera);
    }
    ```

### Canvas 2D Graphic Engines
1.  **Radar Web (Yield Agent):**
    *   Draws five outer vertices at radius $R$: $P_i = (cx + R \cos\theta_i, cy + R \sin\theta_i)$ where $\theta_i = i \times \frac{2\pi}{5}$.
    *   Fills the inner region using a semi-transparent orange color: `rgba(255, 118, 28, 0.2)`.
    *   Modulates $R$ slightly with a temporal factor $\sin(t)$ for breathing animation.
2.  **Arb Dual-Line Chart:**
    *   Plots two curves:
        *   Curve A: $y_A(x) = cy + A \sin(\omega x + \phi_A) + \text{noise}$
        *   Curve B: $y_B(x) = cy + B \cos(\omega x + \phi_B) + \text{noise}$
    *   Draws fill styling between the curves when $y_B(x) > y_A(x)$ (highlighting arbitrage opportunities).
3.  **Generative Dendritic Tree (Scam Agent):**
    *   Recursive function `drawBranch(x, y, length, angle, depth)` using lines:
        *   `ctx.moveTo(x, y); ctx.lineTo(x2, y2); ctx.stroke();`
        *   Spawns two child branches at angles $\theta \pm \delta\theta$ with scaled length.
        *   Triggered/updated at each transaction iteration, growing slowly and then restarting.

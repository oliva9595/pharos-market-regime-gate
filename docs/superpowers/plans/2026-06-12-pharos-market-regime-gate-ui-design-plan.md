# Volatility Sentinel Dashboard Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the frontend web interface and demo logic of the Volatility Sentinel sandbox to establish a premium cyberpunk Risk Command Center, replacing the old sandbox structure.

**Architecture:** We will structure the UI as a single-page responsive grid with dynamic oracle sparklines (SVG), a central animated regime status shield, a mock multi-agent simulation arena to demonstrate real-time transaction blocks/executions, and a console log stream.

**Tech Stack:** HTML5, CSS3, Ethers.js v6, Vanilla JS.

---

## Proposed Changes

### Task 1: Update index.html Layout

**Files:**
- Modify: `d:/dorahack/pharos-market-regime-gate/index.html`

- [ ] **Step 1: Replace HTML Structure**
  Replace the entire body structure of `index.html` to establish the new layout: Live Security Oracle Monitor, Market Shock Injector, Regime Shield, Agent Arena, and Security Logs.
  
  Code to write in `index.html`:
  ```html
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Pharos Volatility Sentinel & Regime Gate</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;700&family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
      <link rel="stylesheet" href="css/style.css">
      <script src="https://cdnjs.cloudflare.com/ajax/libs/ethers/6.13.0/ethers.umd.min.js"></script>
      <script defer src="js/app.js"></script>
  </head>
  <body>
      <header class="app-header">
          <div class="header-brand">
              <img src="assets/pharos_shield_logo.png" alt="Pharos Shield Logo" width="32" height="32" onerror="this.src='https://raw.githubusercontent.com/enzo151097/pharos-skill-engine/main/assets/pharos_shield_logo.png'">
              <span id="app-title">Pharos Volatility Sentinel</span>
          </div>
          <div class="header-controls">
              <div class="serverless-status">
                  <span class="status-dot connected"></span>
                  <span class="status-label">Alibaba Serverless: Active</span>
              </div>
              <div class="mock-mode-container">
                  <span class="toggle-label">Mock Mode</span>
                  <label class="switch">
                      <input type="checkbox" id="mock-mode-toggle" checked>
                      <span class="slider round"></span>
                  </label>
              </div>
              <div class="wallet-status-indicator">
                  <span id="wallet-status-dot" class="status-dot connected"></span>
                  <span id="wallet-account" class="account-text">Mock Mode Connected</span>
              </div>
              <button id="btn-connect-wallet" class="btn btn-connect">Connect Wallet</button>
          </div>
      </header>

      <div class="sentinel-grid">
          
          <!-- COLUMN 1: Live Security Oracle Monitor -->
          <section class="card">
              <div class="card-header">
                  <h2 class="card-title">Live Security Oracle Monitor</h2>
                  <span class="card-subtitle">Real-time off-chain price stability and network liquidity parameters.</span>
              </div>
              
              <div class="oracle-feeds-container">
                  <!-- Feed 1: VIX -->
                  <div class="oracle-feed-card" id="oracle-card-vix">
                      <div class="oracle-header">
                          <span class="oracle-title">Market Volatility (VIX)</span>
                          <i class="fas fa-chart-line" style="color: var(--primary-accent);"></i>
                      </div>
                      <div class="oracle-value" id="oracle-vix-val">18.2</div>
                      <div class="sparkline-container">
                          <svg class="sparkline-svg" id="svg-vix">
                              <path d="" stroke="#ff761c" stroke-width="2" fill="none"></path>
                          </svg>
                      </div>
                  </div>
                  
                  <!-- Feed 2: Bridge Volume -->
                  <div class="oracle-feed-card" id="oracle-card-bridge">
                      <div class="oracle-header">
                          <span class="oracle-title">Bridge Net Flow</span>
                          <i class="fas fa-bridge" style="color: var(--color-blue);"></i>
                      </div>
                      <div class="oracle-value" id="oracle-bridge-val">1.2M <span style="font-size: 10px; color: var(--text-secondary);">/ hr</span></div>
                      <div class="sparkline-container">
                          <svg class="sparkline-svg" id="svg-bridge">
                              <path d="" stroke="#0ea5e9" stroke-width="2" fill="none"></path>
                          </svg>
                      </div>
                  </div>
                  
                  <!-- Feed 3: Price Divergence -->
                  <div class="oracle-feed-card" id="oracle-card-div">
                      <div class="oracle-header">
                          <span class="oracle-title">Oracle Price Divergence</span>
                          <i class="fas fa-scale-unbalanced" style="color: var(--color-green);"></i>
                      </div>
                      <div class="oracle-value" id="oracle-div-val">0.05%</div>
                      <div class="sparkline-container">
                          <svg class="sparkline-svg" id="svg-div">
                              <path d="" stroke="#2bad0a" stroke-width="2" fill="none"></path>
                          </svg>
                      </div>
                  </div>
              </div>
              
              <div class="shock-section">
                  <h3 class="section-title">Market Risk Shock Injector Controls</h3>
                  <div class="shock-controls-grid">
                      <button class="btn-shock btn-shock-warning" id="btn-shock-dex">DEX Volatility Spike</button>
                      <button class="btn-shock btn-shock-danger" id="btn-shock-bridge">Bridge Outflow Panic</button>
                      <button class="btn-shock btn-shock-success" id="btn-shock-stabilize">Stabilize Feeds</button>
                  </div>
              </div>
          </section>

          <!-- COLUMN 2: Gate 7 On-chain Controls -->
          <section class="card">
              <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
                  <div>
                      <h2 class="card-title">Gate 7: Market Regime Gate</h2>
                      <span class="card-subtitle">On-chain active security enforcement shield.</span>
                  </div>
                  <div class="keeper-status-badge" id="keeper-status-badge">
                      <i class="fas fa-robot"></i> Auto-Keeper Off
                  </div>
              </div>
              
              <div class="keeper-toggle-row">
                  <span class="toggle-label">Keeper Bot Auto-Regime Selector</span>
                  <label class="switch">
                      <input type="checkbox" id="keeper-toggle">
                      <span class="slider round"></span>
                  </label>
              </div>
              
              <div class="shield-sentinel-display">
                  <div class="shield-radar-ring"></div>
                  <div class="sentinel-shield-core" id="sentinel-shield-core">
                      <i class="fas fa-shield-halved"></i>
                  </div>
                  <div class="shield-status-label" id="sentinel-status-label">NORMAL MODE</div>
              </div>
              
              <div class="regime-buttons-grid">
                  <button class="btn btn-secondary" id="regime-btn-0">Normal</button>
                  <button class="btn btn-secondary" id="regime-btn-1">Volatile</button>
                  <button class="btn btn-secondary" id="regime-btn-2">Panic</button>
              </div>
          </section>
          
          <!-- FULL WIDTH: AI Agent Simulation Arena -->
          <section class="card full-width-card">
              <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
                  <div>
                      <h2 class="card-title">AI Agent Simulation Arena</h2>
                      <span class="card-subtitle">Observe autonomous agents reacting dynamically to market volatility regimes.</span>
                  </div>
                  <div class="arena-controls">
                      <span class="toggle-label" style="font-size: 12px; margin-right: 8px;">Run Loop</span>
                      <label class="switch">
                          <input type="checkbox" id="arena-loop-toggle" checked>
                          <span class="slider round"></span>
                      </label>
                  </div>
              </div>
              
              <div class="agents-arena-grid">
                  <!-- Agent 1: DeFi Yield Agent -->
                  <div class="agent-card" id="agent-yield">
                      <div class="agent-status-indicator">
                          <span class="agent-status-dot active"></span>
                          <span class="agent-pulse-ring"></span>
                      </div>
                      <div class="agent-header">
                          <i class="fas fa-money-bill-trend-up agent-icon"></i>
                          <h3 class="agent-title">DeFi Yield Agent</h3>
                      </div>
                      <p class="agent-desc">Optimizes yield by staking assets in Uniswap V2 Router.</p>
                      <div class="agent-meta">
                          <div class="meta-row">
                              <span class="meta-label">Target:</span>
                              <span class="meta-val font-mono">Uniswap V2 Router</span>
                          </div>
                          <div class="meta-row">
                              <span class="meta-label">CertiK Rating:</span>
                              <span class="meta-val badge status-verified">Score: 94 / 100</span>
                          </div>
                          <div class="meta-row">
                              <span class="meta-label">GoPlus Status:</span>
                              <span class="meta-val text-green"><i class="fas fa-check-circle"></i> Clean</span>
                          </div>
                      </div>
                      <div class="agent-console">
                          <div class="agent-console-title font-mono">Agent Terminal Logs</div>
                          <div class="agent-console-lines font-mono" id="agent-yield-logs">
                              <div>[YieldAgent] Idle. Loop active.</div>
                          </div>
                      </div>
                  </div>

                  <!-- Agent 2: Arbitrage Agent -->
                  <div class="agent-card" id="agent-arb">
                      <div class="agent-status-indicator">
                          <span class="agent-status-dot active"></span>
                          <span class="agent-pulse-ring"></span>
                      </div>
                      <div class="agent-header">
                          <i class="fas fa-scale-balanced agent-icon"></i>
                          <h3 class="agent-title">Arbitrage Agent</h3>
                      </div>
                      <p class="agent-desc">Swaps between unverified decentralized pools for mispricing.</p>
                      <div class="agent-meta">
                          <div class="meta-row">
                              <span class="meta-label">Target:</span>
                              <span class="meta-val font-mono">Unrated Pool Target</span>
                          </div>
                          <div class="meta-row">
                              <span class="meta-label">CertiK Rating:</span>
                              <span class="meta-val badge status-blacklisted" style="color: var(--primary-accent); border-color: rgba(255,118,28,0.3); background: rgba(255,118,28,0.1)">Score: 0 / 100</span>
                          </div>
                          <div class="meta-row">
                              <span class="meta-label">GoPlus Status:</span>
                              <span class="meta-val text-yellow"><i class="fas fa-triangle-exclamation"></i> Unverified</span>
                          </div>
                      </div>
                      <div class="agent-console">
                          <div class="agent-console-title font-mono">Agent Terminal Logs</div>
                          <div class="agent-console-lines font-mono" id="agent-arb-logs">
                              <div>[ArbAgent] Idle. Loop active.</div>
                          </div>
                      </div>
                  </div>

                  <!-- Agent 3: Malicious Phishing Agent -->
                  <div class="agent-card" id="agent-scam">
                      <div class="agent-status-indicator">
                          <span class="agent-status-dot active"></span>
                          <span class="agent-pulse-ring"></span>
                      </div>
                      <div class="agent-header">
                          <i class="fas fa-skull-crossbones agent-icon"></i>
                          <h3 class="agent-title">Phishing Scam Target</h3>
                      </div>
                      <p class="agent-desc">Simulates interacting with a malicious drainer contract.</p>
                      <div class="agent-meta">
                          <div class="meta-row">
                              <span class="meta-label">Target:</span>
                              <span class="meta-val font-mono">Malicious Wallet Drainer</span>
                          </div>
                          <div class="meta-row">
                              <span class="meta-label">CertiK Rating:</span>
                              <span class="meta-val badge status-blacklisted">Score: 12 / 100</span>
                          </div>
                          <div class="meta-row">
                              <span class="meta-label">GoPlus Status:</span>
                              <span class="meta-val text-red"><i class="fas fa-circle-xmark"></i> Blacklisted</span>
                          </div>
                      </div>
                      <div class="agent-console">
                          <div class="agent-console-title font-mono">Agent Terminal Logs</div>
                          <div class="agent-console-lines font-mono" id="agent-scam-logs">
                              <div>[ScamBot] Idle. Loop active.</div>
                          </div>
                      </div>
                  </div>
              </div>
          </section>

          <!-- FULL WIDTH: Security Gate Logger Console -->
          <section class="card card-terminal full-width-card">
              <div class="terminal-header">
                  <h2 class="terminal-title">SECURITY GATE SYSTEM MONITORING LOGS</h2>
                  <button type="button" id="btn-clear-terminal" class="btn-clear">Clear</button>
              </div>
              <div class="terminal">
                  <div id="terminal-output" class="terminal-output">
                      <div class="terminal-line system-msg">Pharos Execution Security Gate Console active. Ready.</div>
                  </div>
              </div>
          </section>
          
      </div>

      <footer class="app-footer">
          <p>&copy; 2026 Pharos Network. Volatility Shield Sentinel Middleware.</p>
      </footer>
  </body>
  </html>
  ```

- [ ] **Step 2: Verify index.html changes**
  Open the file and verify there are no syntax errors or leftover tags.

---

### Task 2: Update css/style.css to style the Sentinel layout

**Files:**
- Modify: `d:/dorahack/pharos-market-regime-gate/css/style.css`

- [ ] **Step 1: Append styling rules**
  Add styles for `.sentinel-grid`, `.oracle-feeds-container`, `.oracle-feed-card`, `.sparkline-container`, `.btn-shock`, `.shield-sentinel-display`, `.agents-arena-grid`, `.agent-card`, and responsive media queries.
  
  CSS code to write into `css/style.css`:
  ```css
  /* Specific styling for Pharos Volatility Sentinel Grid */
  .sentinel-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 24px;
      padding: 30px 40px;
      max-width: 1400px;
      margin: 0 auto;
      width: 100%;
  }

  @media (min-width: 992px) {
      .sentinel-grid {
          grid-template-columns: 1.2fr 0.8fr;
      }
      .full-width-card {
          grid-column: span 2;
      }
  }

  /* Serverless badge in header */
  .serverless-status {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: var(--text-secondary);
      background: rgba(0, 0, 0, 0.2);
      padding: 6px 12px;
      border-radius: 20px;
      border: 1px solid var(--border-color);
  }

  /* Oracle feeds card container */
  .oracle-feeds-container {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-top: 10px;
  }

  @media (max-width: 768px) {
      .oracle-feeds-container {
          grid-template-columns: 1fr;
      }
  }

  .oracle-feed-card {
      display: flex;
      flex-direction: column;
      gap: 12px;
      background: rgba(0, 0, 0, 0.25);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 16px;
      position: relative;
      overflow: hidden;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
  }

  .oracle-feed-card:hover {
      border-color: rgba(255, 118, 28, 0.15);
  }

  .oracle-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
  }

  .oracle-title {
      font-size: 11px;
      font-weight: 700;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
  }

  .oracle-value {
      font-family: var(--font-mono);
      font-size: 22px;
      font-weight: 700;
      color: var(--text-primary);
  }

  .sparkline-container {
      width: 100%;
      height: 45px;
  }

  .sparkline-svg {
      width: 100%;
      height: 100%;
  }

  /* Shock injector controls */
  .shock-section {
      margin-top: 24px;
      border-top: 1px solid var(--border-color);
      padding-top: 20px;
  }

  .shock-controls-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
  }

  .btn-shock {
      padding: 12px 14px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-radius: 8px;
      cursor: pointer;
      background: transparent;
      transition: all 0.2s ease;
      font-family: var(--font-outfit);
  }

  .btn-shock-danger {
      border: 1px solid var(--color-red);
      color: var(--color-red);
      background: rgba(208, 2, 27, 0.05);
  }

  .btn-shock-danger:hover {
      background: var(--color-red);
      color: #fff;
      box-shadow: var(--neon-shadow-red);
  }

  .btn-shock-warning {
      border: 1px solid var(--primary-accent);
      color: var(--primary-accent);
      background: rgba(255, 118, 28, 0.05);
  }

  .btn-shock-warning:hover {
      background: var(--primary-accent);
      color: #000;
      box-shadow: var(--neon-shadow);
  }

  .btn-shock-success {
      border: 1px solid var(--color-green);
      color: var(--color-green);
      background: rgba(43, 173, 10, 0.05);
  }

  .btn-shock-success:hover {
      background: var(--color-green);
      color: #000;
      box-shadow: var(--neon-shadow-green);
  }

  /* Market Regime Shield display */
  .keeper-toggle-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 12px;
      margin-bottom: 12px;
  }

  .shield-sentinel-display {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 220px;
      background: rgba(0, 0, 0, 0.3);
      border-radius: 12px;
      border: 1px solid var(--border-color);
      position: relative;
      overflow: hidden;
      margin-top: 15px;
      box-shadow: inset 0 0 25px rgba(0,0,0,0.8);
  }

  .shield-radar-ring {
      position: absolute;
      width: 140px;
      height: 140px;
      border-radius: 50%;
      border: 1px dashed rgba(255, 118, 28, 0.15);
      animation: spin-radar 20s linear infinite;
  }

  @keyframes spin-radar {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
  }

  .sentinel-shield-core {
      font-size: 56px;
      color: var(--color-blue);
      text-shadow: 0 0 15px rgba(14, 165, 233, 0.4);
      z-index: 2;
      transition: all 0.3s ease;
  }

  .sentinel-shield-core.secure-pulse {
      color: var(--color-green);
      text-shadow: 0 0 25px rgba(43, 173, 10, 0.6);
      animation: pulse-secure 2s infinite ease-in-out;
  }

  .sentinel-shield-core.warning-pulse {
      color: var(--primary-accent);
      text-shadow: 0 0 25px rgba(255, 118, 28, 0.6);
      animation: pulse-warn 1.5s infinite ease-in-out;
  }

  .sentinel-shield-core.danger-pulse {
      color: var(--color-red);
      text-shadow: 0 0 30px rgba(208, 2, 27, 0.8);
      animation: pulse-danger 0.8s infinite ease-in-out;
  }

  @keyframes pulse-secure {
      0% { transform: scale(1); }
      50% { transform: scale(1.05); }
      100% { transform: scale(1); }
  }

  @keyframes pulse-warn {
      0% { transform: scale(1); }
      50% { transform: scale(1.08); }
      100% { transform: scale(1); }
  }

  @keyframes pulse-danger {
      0% { transform: scale(1); }
      50% { transform: scale(1.12); }
      100% { transform: scale(1); }
  }

  .shield-status-label {
      font-family: var(--font-mono);
      font-size: 14px;
      font-weight: 700;
      margin-top: 12px;
      letter-spacing: 1.5px;
      z-index: 2;
      transition: color 0.3s ease;
  }

  .regime-buttons-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin-top: 20px;
  }

  .keeper-status-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      background: rgba(148, 163, 184, 0.08);
      color: var(--text-secondary);
      border: 1px solid var(--border-color);
      padding: 4px 10px;
      border-radius: 12px;
  }

  .keeper-status-badge.keeper-active {
      background: rgba(43, 173, 10, 0.1);
      color: var(--color-green);
      border-color: rgba(43, 173, 10, 0.3);
  }

  /* Agents Simulation Arena grid layout */
  .agents-arena-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin-top: 15px;
  }

  @media (max-width: 992px) {
      .agents-arena-grid {
          grid-template-columns: 1fr;
      }
  }

  .agent-card {
      background: rgba(0, 0, 0, 0.2);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 20px;
      position: relative;
      display: flex;
      flex-direction: column;
      gap: 12px;
      overflow: hidden;
  }

  .agent-status-indicator {
      position: absolute;
      top: 16px;
      right: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
  }

  .agent-status-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: var(--text-secondary);
      z-index: 2;
  }

  .agent-status-dot.active {
      background: var(--color-green);
  }

  .agent-status-dot.blocked {
      background: var(--color-red);
  }

  .agent-status-dot.warning {
      background: var(--primary-accent);
  }

  .agent-pulse-ring {
      position: absolute;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: 1px solid var(--color-green);
      opacity: 0;
      animation: pulse-ring 2s infinite ease-out;
      z-index: 1;
  }

  @keyframes pulse-ring {
      0% { transform: scale(0.5); opacity: 0.8; }
      100% { transform: scale(1.8); opacity: 0; }
  }

  .agent-header {
      display: flex;
      align-items: center;
      gap: 12px;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 10px;
  }

  .agent-icon {
      font-size: 18px;
      color: var(--primary-accent);
  }

  .agent-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--text-primary);
  }

  .agent-desc {
      font-size: 13px;
      color: var(--text-secondary);
      min-height: 38px;
  }

  .agent-meta {
      display: flex;
      flex-direction: column;
      gap: 8px;
      background: rgba(0,0,0,0.15);
      padding: 10px 14px;
      border-radius: 8px;
      border: 1px solid rgba(255,255,255,0.02);
  }

  .meta-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
  }

  .meta-label {
      color: var(--text-secondary);
  }

  .meta-val {
      color: var(--text-primary);
  }

  .text-green { color: var(--color-green); }
  .text-yellow { color: var(--primary-accent); }
  .text-red { color: var(--color-red); }

  /* Agent terminal logs viewport */
  .agent-console {
      background: #020204;
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 6px;
      padding: 10px;
      font-size: 11px;
      display: flex;
      flex-direction: column;
      gap: 6px;
  }

  .agent-console-title {
      font-size: 9px;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1px solid rgba(255,255,255,0.03);
      padding-bottom: 4px;
  }

  .agent-console-lines {
      height: 60px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 4px;
      color: #7dd3fc;
  }

  .agent-console-lines .tx-success {
      color: #4dfa1d;
  }

  .agent-console-lines .tx-failed {
      color: #ff3344;
  }
  ```

- [ ] **Step 2: Check CSS loading**
  Ensure files import properly without overrides breaking styles.

---

### Task 3: Implement js/app.js Sentinel Logic

**Files:**
- Modify: `d:/dorahack/pharos-market-regime-gate/js/app.js`

- [ ] **Step 1: Rewrite app.js**
  Write the core simulation loops, SVG chart drawers, mock agents, keeper bots, and MetaMask integration hooks.
  
  Code to write in `js/app.js`:
  ```javascript
  // Deployed Contract configurations on Pharos Atlantic Testnet
  const REGISTRY_ADDRESS = '0x8d87E6b80218a71be0D3DaB452020267c69BC937';
  const ENGINE_ADDRESS = '0xe0C047cBCBDB0e4b5Ca5544faec06A1eED247014';
  const REGIME_GATE_ADDRESS = '0x0b72Ed35d27a77a8C1CD32E0eDB7D7326A460243';

  const REGIME_GATE_ABI = [
    "function currentRegime() view returns (uint8)",
    "function setMarketRegime(uint8 _regime) external",
    "function owner() view returns (address)"
  ];

  const ENGINE_ABI = [
    "function checkTx(address target, bytes calldata data, uint256 value) view returns (bool)",
    "function executeTx(address target, bytes calldata data, uint256 value) payable returns (bytes memory)",
    "function regimeGate() view returns (address)",
    "function registry() view returns (address)"
  ];

  const REGISTRY_ABI = [
    "function checkAddress(address addr) view returns (bool)",
    "function isBlacklisted(address addr) view returns (bool)",
    "function isVerified(address addr) view returns (bool)"
  ];

  // Global instances
  let provider = null;
  let signer = null;
  let account = null;
  let engineContract = null;
  let regimeGateContract = null;
  let registryContract = null;
  let regimeGateOwner = null;

  // Oracle Metrics State
  let metrics = {
      vix: 18.2,
      bridge: 1.2,
      div: 0.05
  };

  // History arrays for drawing SVG sparklines (max 10 points)
  let history = {
      vix: [18.0, 18.2, 17.9, 18.5, 18.2, 18.1, 18.4, 18.0, 18.3, 18.2],
      bridge: [1.1, 1.3, 1.2, 1.4, 1.2, 1.1, 1.3, 1.2, 1.1, 1.2],
      div: [0.04, 0.05, 0.04, 0.06, 0.05, 0.04, 0.05, 0.06, 0.05, 0.05]
  };

  // Regime states: 0 = NORMAL, 1 = VOLATILE, 2 = PANIC
  let currentRegime = 0; 

  // Elements mapping
  const terminalOutput = document.getElementById('terminal-output');
  const mockModeToggle = document.getElementById('mock-mode-toggle');
  const walletStatusDot = document.getElementById('wallet-status-dot');
  const walletAccount = document.getElementById('wallet-account');
  const btnConnectWallet = document.getElementById('btn-connect-wallet');
  const keeperToggle = document.getElementById('keeper-toggle');
  const keeperStatusBadge = document.getElementById('keeper-status-badge');
  const shieldCore = document.getElementById('sentinel-shield-core');
  const shieldStatusLabel = document.getElementById('sentinel-status-label');
  const arenaLoopToggle = document.getElementById('arena-loop-toggle');

  // Sparkline elements
  const svgVix = document.getElementById('svg-vix');
  const svgBridge = document.getElementById('svg-bridge');
  const svgDiv = document.getElementById('svg-div');

  // Logs terminal helper
  function writeLog(message, type = 'system') {
      if (!terminalOutput) return;
      const div = document.createElement('div');
      div.className = `terminal-line ${type}-msg`;
      const time = new Date().toTimeString().split(' ')[0];
      div.innerHTML = `[${time}] ${message}`;
      terminalOutput.appendChild(div);
      setTimeout(() => { terminalOutput.scrollTop = terminalOutput.scrollHeight; }, 20);
  }

  // Draw Sparklines dynamically
  function drawSparkline(svgEl, dataPoints, minVal, maxVal) {
      if (!svgEl) return;
      const width = svgEl.clientWidth || 100;
      const height = svgEl.clientHeight || 45;
      
      const padding = 2;
      const range = maxVal - minVal || 1;
      
      const points = dataPoints.map((val, index) => {
          const x = padding + (index / (dataPoints.length - 1)) * (width - padding * 2);
          const y = height - padding - ((val - minVal) / range) * (height - padding * 2);
          return `${x.toFixed(1)},${y.toFixed(1)}`;
      });
      
      const pathData = `M ${points.join(' L ')}`;
      const pathEl = svgEl.querySelector('path');
      if (pathEl) {
          pathEl.setAttribute('d', pathData);
      }
  }

  // Update sparklines and values
  function updateOracleDisplay() {
      // Set values in HTML
      document.getElementById('oracle-vix-val').textContent = metrics.vix.toFixed(1);
      document.getElementById('oracle-bridge-val').innerHTML = `${metrics.bridge.toFixed(1)}M <span style="font-size: 10px; color: var(--text-secondary);">/ hr</span>`;
      document.getElementById('oracle-div-val').textContent = `${metrics.div.toFixed(2)}%`;
      
      // Update history arrays
      history.vix.push(metrics.vix);
      history.vix.shift();
      history.bridge.push(metrics.bridge);
      history.bridge.shift();
      history.div.push(metrics.div);
      history.div.shift();
      
      // Draw SVGs
      drawSparkline(svgVix, history.vix, Math.min(...history.vix), Math.max(...history.vix));
      drawSparkline(svgBridge, history.bridge, Math.min(...history.bridge), Math.max(...history.bridge));
      drawSparkline(svgDiv, history.div, Math.min(...history.div), Math.max(...history.div));
  }

  // Fluctuate Oracles slowly on regular loop
  setInterval(() => {
      // Fluctuate metrics only if not recently shocked
      const isMock = mockModeToggle.checked;
      if (isMock) {
          // Add minor noise
          const noise = () => (Math.random() - 0.5) * 0.2;
          
          if (metrics.vix < 25) metrics.vix = Math.max(15.0, metrics.vix + noise());
          if (metrics.bridge < 5) metrics.bridge = Math.max(0.5, metrics.bridge + noise() * 0.1);
          if (metrics.div < 0.2) metrics.div = Math.max(0.01, metrics.div + noise() * 0.01);
          
          updateOracleDisplay();
          
          // Evaluate Auto Keeper logic
          if (keeperToggle.checked) {
              evaluateAutoKeeper();
          }
      }
  }, 3000);

  // Evaluate Auto-Keeper
  function evaluateAutoKeeper() {
      let targetRegime = 0;
      if (metrics.bridge > 10.0) {
          targetRegime = 2; // PANIC
      } else if (metrics.vix > 30.0 || metrics.div > 1.0) {
          targetRegime = 1; // VOLATILE
      } else {
          targetRegime = 0; // NORMAL
      }
      
      if (targetRegime !== currentRegime) {
          writeLog(`[Auto-Keeper] Volatility anomaly detected. Auto-adjusting Market Regime.`, 'info');
          changeRegime(targetRegime);
      }
  }

  // Visual updater for shield state
  function updateShieldState(regime) {
      currentRegime = regime;
      
      // Clear classes
      shieldCore.className = 'sentinel-shield-core';
      const labels = ["NORMAL MODE", "VOLATILE MODE", "PANIC MODE"];
      shieldStatusLabel.textContent = labels[regime];
      
      if (regime === 0) {
          shieldCore.classList.add('secure-pulse');
          shieldStatusLabel.style.color = 'var(--color-green)';
      } else if (regime === 1) {
          shieldCore.classList.add('warning-pulse');
          shieldStatusLabel.style.color = 'var(--primary-accent)';
      } else if (regime === 2) {
          shieldCore.classList.add('danger-pulse');
          shieldStatusLabel.style.color = 'var(--color-red)';
      }
      
      // Update override buttons selection state
      document.querySelectorAll('.regime-buttons-grid .btn').forEach((btn, idx) => {
          if (idx === regime) {
              btn.className = 'btn btn-primary';
          } else {
              btn.className = 'btn btn-secondary';
          }
      });
  }

  // Change regime action
  async function changeRegime(regime) {
      const isMock = mockModeToggle.checked;
      const labels = ["NORMAL", "VOLATILE", "PANIC"];
      
      if (isMock) {
          updateShieldState(regime);
          writeLog(`[Market Regime] State updated locally to: ${labels[regime]} Mode`, 'system');
      } else {
          if (!regimeGateContract) {
              writeLog("❌ Web3 Error: Regime Gate contract not connected.", "error");
              return;
          }
          
          try {
              if (regimeGateOwner && account && regimeGateOwner.toLowerCase() !== account.toLowerCase()) {
                  writeLog(`❌ Web3 Error: Only the owner (${regimeGateOwner.slice(0,6)}...) can change regime on-chain.`, "error");
                  return;
              }
              
              writeLog(`[Web3] Calling on-chain setMarketRegime(${regime}) [${labels[regime]}]...`, "info");
              const tx = await regimeGateContract.setMarketRegime(regime);
              writeLog(`Transaction broadcasted: ${tx.hash}. Waiting for block confirmation...`, "info");
              await tx.wait();
              updateShieldState(regime);
              writeLog(`🎉 [Web3] Market Regime state updated successfully on-chain!`, "success");
          } catch (err) {
              writeLog(`❌ Web3 transaction failed: ${err.message}`, "error");
          }
      }
  }

  // Shock Injector click handlers
  document.getElementById('btn-shock-dex').addEventListener('click', () => {
      writeLog("⚠️ Triggering DEX Volatility Spike shock parameter!", 'info');
      metrics.vix = 42.8;
      metrics.div = 1.85;
      updateOracleDisplay();
      if (keeperToggle.checked) evaluateAutoKeeper();
  });

  document.getElementById('btn-shock-bridge').addEventListener('click', () => {
      writeLog("🚨 Outflow Alert: Triggering Bridge Panic net outflow shock!", 'error');
      metrics.bridge = 14.8;
      updateOracleDisplay();
      if (keeperToggle.checked) evaluateAutoKeeper();
  });

  document.getElementById('btn-shock-stabilize').addEventListener('click', () => {
      writeLog("✅ Stabilizing oracles to standard market settings.", 'success');
      metrics.vix = 18.2;
      metrics.bridge = 1.2;
      metrics.div = 0.05;
      updateOracleDisplay();
      if (keeperToggle.checked) evaluateAutoKeeper();
  });

  // Keeper auto toggle listener
  keeperToggle.addEventListener('change', () => {
      if (keeperToggle.checked) {
          keeperStatusBadge.className = 'keeper-status-badge keeper-active';
          keeperStatusBadge.innerHTML = '<i class="fas fa-robot"></i> Auto-Keeper On';
          writeLog("Auto-Keeper Bot activated. Scanning security parameters...", 'info');
          evaluateAutoKeeper();
      } else {
          keeperStatusBadge.className = 'keeper-status-badge';
          keeperStatusBadge.innerHTML = '<i class="fas fa-robot"></i> Auto-Keeper Off';
          writeLog("Auto-Keeper Bot deactivated.", 'system');
      }
  });

  // Direct buttons
  document.getElementById('regime-btn-0').addEventListener('click', () => changeRegime(0));
  document.getElementById('regime-btn-1').addEventListener('click', () => changeRegime(1));
  document.getElementById('regime-btn-2').addEventListener('click', () => changeRegime(2));

  // --- AI Agent Arena Simulation Loop ---
  let simulationTimer = null;
  const agentLogs = {
      yield: document.getElementById('agent-yield-logs'),
      arb: document.getElementById('agent-arb-logs'),
      scam: document.getElementById('agent-scam-logs')
  };

  function writeAgentLog(agentKey, line, isSuccess = true) {
      const parent = agentLogs[agentKey];
      if (!parent) return;
      const div = document.createElement('div');
      div.className = isSuccess ? 'tx-success' : 'tx-failed';
      div.textContent = `> ${line}`;
      parent.appendChild(div);
      if (parent.children.length > 3) {
          parent.removeChild(parent.firstChild);
      }
      parent.scrollTop = parent.scrollHeight;
  }

  function runAgentSimulationStep() {
      const isMock = mockModeToggle.checked;
      
      // Update Agent indicators
      const dotYield = document.querySelector('#agent-yield .agent-status-dot');
      const dotArb = document.querySelector('#agent-arb .agent-status-dot');
      const dotScam = document.querySelector('#agent-scam .agent-status-dot');

      // 1. Phishing Agent: Always gets registry blocked
      dotScam.className = 'agent-status-dot blocked';
      writeAgentLog('scam', 'Sending 1.5 ETH approve swap...', false);
      writeAgentLog('scam', '❌ Registry Gate: GoPlus Phishing flag detected! Blocked.', false);
      writeLog('🛡️ [GoPlus API] Scam Target Address (0x1111...) intercepted. Blocked transaction.', 'error');

      // 2. DeFi Yield Agent (Uniswap, CertiK 94)
      if (currentRegime === 2) {
          dotYield.className = 'agent-status-dot blocked';
          writeAgentLog('yield', 'Attempting Uniswap swap...', false);
          writeAgentLog('yield', '❌ Regime Gate: Market panic. Suspended.', false);
          writeLog('🛡️ [Market Regime Gate] DeFi Yield Agent blocked. PANIC REGIME ACTIVE.', 'error');
      } else {
          dotYield.className = 'agent-status-dot active';
          writeAgentLog('yield', 'Checking Slippage limits...');
          writeAgentLog('yield', '✅ Uniswap swap executed successfully. (CertiK: 94)');
          writeLog('🛡️ [ExecutionEngine] DeFi Yield Agent transaction executed successfully.', 'success');
      }

      // 3. Arbitrage Agent (Unrated Pool, CertiK 0)
      if (currentRegime === 2) {
          dotArb.className = 'agent-status-dot blocked';
          writeAgentLog('arb', 'Attempting pool arbitrage swap...', false);
          writeAgentLog('arb', '❌ Regime Gate: Market panic. Suspended.', false);
          writeLog('🛡️ [Market Regime Gate] Arbitrage Agent blocked. PANIC REGIME ACTIVE.', 'error');
      } else if (currentRegime === 1) {
          dotArb.className = 'agent-status-dot blocked';
          writeAgentLog('arb', 'Attempting pool arbitrage swap...', false);
          writeAgentLog('arb', '❌ Regime Gate: Volatile Regime restricts unrated targets.', false);
          writeLog('🛡️ [Market Regime Gate] Arbitrage Agent blocked. Target CertiK rating below Volatile state limit (>80).', 'error');
          writeLog('💡 [Anvita Flow Fallback] Actionable RevertDiagnose: Redirecting flow to Uniswap V3.', 'info');
      } else {
          dotArb.className = 'agent-status-dot active';
          writeAgentLog('arb', 'Checking pool registry...');
          writeAgentLog('arb', '✅ Arb trade executed. Profit: 0.12 ETH');
          writeLog('🛡️ [ExecutionEngine] Arbitrage Agent transaction executed successfully.', 'success');
      }
  }

  // Simulation Arena trigger
  arenaLoopToggle.addEventListener('change', () => {
      if (arenaLoopToggle.checked) {
          startSimulationLoop();
      } else {
          stopSimulationLoop();
      }
  });

  function startSimulationLoop() {
      if (simulationTimer) clearInterval(simulationTimer);
      writeLog("Arena Simulation loop started. Bots dispatching transactions...", 'info');
      simulationTimer = setInterval(runAgentSimulationStep, 4000);
  }

  function stopSimulationLoop() {
      if (simulationTimer) {
          clearInterval(simulationTimer);
          simulationTimer = null;
      }
      writeLog("Arena Simulation loop suspended.", 'system');
  }

  // --- Wallet & MetaMask connection logic ---
  async function connectWallet() {
      if (typeof window.ethereum === 'undefined') {
          writeLog("❌ Web3 Error: MetaMask extension not detected.", "error");
          return;
      }
      
      try {
          writeLog("Connecting Web3 Browser wallet...", "info");
          const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
          account = accounts[0];
          provider = new ethers.BrowserProvider(window.ethereum);
          signer = await provider.getSigner();

          engineContract = new ethers.Contract(ENGINE_ADDRESS, ENGINE_ABI, signer);
          
          const regimeGateAddr = await engineContract.regimeGate();
          const registryAddr = await engineContract.registry();

          regimeGateContract = new ethers.Contract(regimeGateAddr, REGIME_GATE_ABI, signer);
          registryContract = new ethers.Contract(registryAddr, REGISTRY_ABI, signer);
          regimeGateOwner = await regimeGateContract.owner();
          
          // Sync regime from contract
          const chainRegime = await regimeGateContract.currentRegime();
          updateShieldState(Number(chainRegime));
          
          mockModeToggle.checked = false;
          walletStatusDot.className = "status-dot connected";
          walletStatusDot.style.backgroundColor = "";
          walletAccount.textContent = `${account.slice(0, 6)}...${account.slice(-4)}`;
          
          writeLog(`🎉 Wallet connected: ${account}`, "success");
          writeLog(`Connected to On-Chain MarketRegimeGate at: ${regimeGateAddr}`, "success");
          
          // Disable simulation arena loop on live web3 connection
          arenaLoopToggle.checked = false;
          stopSimulationLoop();
      } catch (err) {
          writeLog(`❌ Web3 Wallet connection failed: ${err.message}`, "error");
      }
  }

  mockModeToggle.addEventListener('change', () => {
      if (mockModeToggle.checked) {
          walletStatusDot.className = "status-dot connected";
          walletStatusDot.style.backgroundColor = '#eab308';
          walletAccount.textContent = "Mock Mode Connected";
          writeLog("Mock mode active. Sandboxed off-chain logic enabled.", "info");
          startSimulationLoop();
          arenaLoopToggle.checked = true;
      } else {
          walletStatusDot.style.backgroundColor = '';
          if (account) {
              walletStatusDot.className = "status-dot connected";
              walletAccount.textContent = `${account.slice(0, 6)}...${account.slice(-4)}`;
          } else {
              walletStatusDot.className = "status-dot disconnected";
              walletAccount.textContent = "Disconnected";
          }
          writeLog("Mock mode deactivated. Switched to Web3 context.", "info");
          stopSimulationLoop();
          arenaLoopToggle.checked = false;
      }
  });

  btnConnectWallet.addEventListener('click', connectWallet);

  // Initialize
  updateOracleDisplay();
  updateShieldState(0);
  startSimulationLoop();
  ```

- [ ] **Step 2: Verify app.js loading**
  Check that it compiles cleanly on browser loading.

---

### Task 4: Verification and Run Server

**Files:**
- Test command: `npm run demo-web`

- [ ] **Step 1: Start the application**
  Run: `npm run demo-web`
  Expected: Serves the page locally on `http://localhost:8080` (or the default port).

- [ ] **Step 2: Manual Check**
  Verify the layout loads properly, sparkline SVGs draw paths dynamically, shock buttons trigger regime changes, auto-keeper bot triggers, and simulation bots print their logs in the arena cards.

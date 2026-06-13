# Redesign Dashboard Information Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the Pharos Volatility Sentinel and Market Regime Gate web dashboard to separate Market Regime and Yield Decay monitors into distinct, first-class sections, add a global readiness/decision banner, implement loading/stale/empty/error states, ensure keyboard accessibility, and prepare Web3 and Fastify API integrations.

**Architecture:** A static single-page application built in the `web/` folder to prevent overwriting legacy files. State is managed centrally in a vanilla JS store with publishers. Styling uses Tailwind CSS grid utilities combined with highly polished custom CSS to provide glassmorphic, responsive, and neon cyberpunk aesthetics.

**Tech Stack:** HTML5, Tailwind CSS, Google Fonts (Geist & Geist Mono), FontAwesome, Ethers.js v6, Vanilla JavaScript.

---

### Task 1: Create configuration and state management
**Files:**
- Create: `web/js/config.js`
- Create: `web/js/state.js`

- [ ] **Step 1: Write `web/js/config.js`**
Write configuration options for default endpoints and contract addresses.
```javascript
export const CONFIG = {
  API_BASE_URL: 'http://localhost:3000',
  RPC_URL: 'https://atlantic.dplabs-internal.com',
  CHAIN_ID: 688689, // 0xa8229
  CHAIN_NAME: 'Pharos Atlantic Testnet',
  CONTRACTS: {
    ProtocolRegistry: '0xbe713906E4D5ac544C069Cd16B2233C979b8AB5a',
    SlippageGuard: '0xdeB9B625e70E38cdb0dEe5DEAACa25A5095D512E',
    MarketRegimeGate: '0xECF86Cf42d27582FDcc60Eed65F0bB7567c789CF',
    ExecutionEngine: '0x8A3e25CbB9e07B122fFBD8718eAD597E0dCCF8f4'
  }
};
```

- [ ] **Step 2: Write `web/js/state.js`**
Write a central state store with event subscription capability.
```javascript
import { CONFIG } from './config.js';

class AppStateStore {
  constructor() {
    this.state = {
      mode: 'mock', // 'mock' or 'web3'
      marketStatus: {
        regime: 'NORMAL',
        reasons: [],
        reasonsHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
        latest: null,
        history: []
      },
      yieldStatus: {
        opportunityId: CONFIG.CONTRACTS.ProtocolRegistry,
        decayScore: 0,
        yieldState: 'HEALTHY',
        factors: {},
        reasons: [],
        reasonsHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
        latest: null,
        history: []
      },
      decisionsHistory: [],
      wallet: {
        connected: false,
        address: null,
        balance: '0',
        chainId: null
      },
      blockHeight: 188432,
      apiState: {
        loading: false,
        error: null,
        stale: false,
        lastUpdated: null
      }
    };
    this.listeners = [];
  }

  getState() {
    return this.state;
  }

  updateState(updater) {
    if (typeof updater === 'function') {
      this.state = updater(this.state);
    } else {
      this.state = { ...this.state, ...updater };
    }
    this.notify();
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(l => l(this.state));
  }
}

export const stateStore = new AppStateStore();
```

---

### Task 2: Create API Client and Wallet Handler
**Files:**
- Create: `web/js/api.js`
- Create: `web/js/wallet.js`

- [ ] **Step 1: Write `web/js/api.js`**
Write client methods for fetching from the Fastify API or returning high-fidelity mock data if offline or in mock mode.
```javascript
import { CONFIG } from './config.js';
import { stateStore } from './state.js';

export const apiClient = {
  async fetchMarketStatus() {
    const currentState = stateStore.getState();
    if (currentState.mode === 'mock') {
      return this.getMockMarketStatus();
    }
    try {
      const res = await fetch(`${CONFIG.API_BASE_URL}/api/market/status`);
      if (!res.ok) throw new Error(`API returned status ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('API connection failed. Falling back to mock market data.', err);
      return this.getMockMarketStatus();
    }
  },

  async fetchYieldStatus(opportunityId) {
    const currentState = stateStore.getState();
    if (currentState.mode === 'mock') {
      return this.getMockYieldStatus(opportunityId);
    }
    try {
      const res = await fetch(`${CONFIG.API_BASE_URL}/api/yield/status?opportunityId=${opportunityId}`);
      if (!res.ok) throw new Error(`API returned status ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('API connection failed. Falling back to mock yield data.', err);
      return this.getMockYieldStatus(opportunityId);
    }
  },

  async fetchDecisionsHistory() {
    const currentState = stateStore.getState();
    if (currentState.mode === 'mock') {
      return this.getMockDecisionsHistory();
    }
    try {
      const res = await fetch(`${CONFIG.API_BASE_URL}/api/decisions/history`);
      if (!res.ok) throw new Error(`API returned status ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('API connection failed. Falling back to mock decisions data.', err);
      return this.getMockDecisionsHistory();
    }
  },

  async submitDecisionReceipt(receipt) {
    const currentState = stateStore.getState();
    if (currentState.mode === 'mock') {
      return { success: true };
    }
    try {
      const res = await fetch(`${CONFIG.API_BASE_URL}/api/decisions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(receipt)
      });
      return await res.json();
    } catch (err) {
      console.error('Failed to submit decision receipt:', err);
      return { success: false, error: err.message };
    }
  },

  getMockMarketStatus() {
    return {
      regime: 'NORMAL',
      reasons: ['Volatility index is stable', 'Liquidity depth is sufficient'],
      reasonsHash: '0x7b23cfefca623b32009ad16fbd97d2e85ab89d3110940562e8311029e84b8d7a',
      latest: {
        observedAt: Math.floor(Date.now() / 1000),
        validUntil: Math.floor(Date.now() / 1000) + 3600,
        volatilityBps: 1250, // 12.5%
        priceDivergenceBps: 15, // 0.15%
        bridgeNetOutflowUsd: '450000',
        stablecoinDepegBps: 8, // 0.08%
        liquidityDepthUsd: '25000000',
        confidenceBps: 9850 // 98.5%
      },
      history: []
    };
  },

  getMockYieldStatus(oppId) {
    return {
      opportunityId: oppId,
      decayScore: 24,
      yieldState: 'HEALTHY',
      factors: {
        apyDrop: 5,
        tvlOutflow: 10,
        feeDecline: 2,
        exitSlippage: 7
      },
      reasons: ['TVL is stable', 'APY remains above threshold'],
      reasonsHash: '0x8b32cfefca623b32009ad16fbd97d2e85ab89d3110940562e8311029e84b8d7a',
      latest: {
        opportunityId: oppId,
        observedAt: Math.floor(Date.now() / 1000),
        validUntil: Math.floor(Date.now() / 1000) + 3600,
        tvlUsd: '18500000',
        netFlowUsd24h: '120000',
        feesUsd24h: '9400',
        apyBps: 1450, // 14.5%
        baseApyBps: 600, // 6%
        rewardApyBps: 850, // 8.5%
        liquidityDepthUsd: '8000000',
        confidenceBps: 9780 // 97.8%
      },
      history: []
    };
  },

  getMockDecisionsHistory() {
    return {
      history: [
        {
          reportId: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          opportunityId: CONFIG.CONTRACTS.ProtocolRegistry,
          actionType: 'DEPOSIT',
          marketRegime: 'NORMAL',
          yieldState: 'HEALTHY',
          decision: 'ALLOW',
          maxPositionUsd: '100000',
          maxSlippageBps: 100,
          reasonsHash: '0x8b32cfefca623b32009ad16fbd97d2e85ab89d3110940562e8311029e84b8d7a',
          validUntil: Math.floor(Date.now() / 1000) + 1800
        }
      ]
    };
  }
};
```

- [ ] **Step 2: Write `web/js/wallet.js`**
Write Ethers.js integration for MetaMask wallet connections, network checking, and basic account data querying.
```javascript
import { CONFIG } from './config.js';
import { stateStore } from './state.js';

export const walletHandler = {
  provider: null,
  signer: null,

  async checkConnection() {
    if (typeof window.ethereum === 'undefined') return;
    
    try {
      this.provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await this.provider.send('eth_accounts', []);
      if (accounts.length > 0) {
        await this.handleAccountsChanged(accounts);
      }
    } catch (err) {
      console.error('Wallet connection check failed:', err);
    }
  },

  async connectWallet() {
    if (typeof window.ethereum === 'undefined') {
      alert('MetaMask is not installed. Please install it to use Web3 mode.');
      return;
    }

    try {
      this.provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await this.provider.send('eth_requestAccounts', []);
      await this.handleAccountsChanged(accounts);
    } catch (err) {
      console.error('Failed to connect wallet:', err);
    }
  },

  async handleAccountsChanged(accounts) {
    if (accounts.length === 0) {
      stateStore.updateState({
        wallet: { connected: false, address: null, balance: '0', chainId: null }
      });
      return;
    }

    const address = accounts[0];
    const network = await this.provider.getNetwork();
    const chainId = Number(network.chainId);
    
    let balanceFormatted = '0';
    try {
      const balanceVal = await this.provider.getBalance(address);
      balanceFormatted = ethers.formatEther(balanceVal);
    } catch (err) {
      console.error('Error fetching balance:', err);
    }

    stateStore.updateState({
      wallet: {
        connected: true,
        address,
        balance: parseFloat(balanceFormatted).toFixed(4),
        chainId
      }
    });

    this.signer = await this.provider.getSigner();
  },

  setupListeners() {
    if (typeof window.ethereum === 'undefined') return;

    window.ethereum.on('accountsChanged', (accounts) => {
      this.handleAccountsChanged(accounts);
    });

    window.ethereum.on('chainChanged', () => {
      window.location.reload();
    });
  }
};
```

---

### Task 3: Design styling sheets
**Files:**
- Create: `web/css/styles.css`

- [ ] **Step 1: Write `web/css/styles.css`**
Implement the custom CSS style overrides, including cyberpunk aesthetics, custom neon glassmorphism variables, accessible outline rings for key focus, loading spinners, stale/error overlays, and animations.
```css
@import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700;800&family=Geist+Mono:wght@300;400;500;600;700&display=swap');

:root {
  --bg-dark: #020204;
  --bg-card: rgba(9, 9, 12, 0.65);
  --border-glow: rgba(255, 118, 28, 0.15);
  
  --color-allow: #10b981;
  --color-restrict: #f59e0b;
  --color-block: #ef4444;
  --color-unwind: #8b5cf6;
  
  --text-primary: #f4f4f5;
  --text-secondary: #a1a1aa;
}

body {
  background-color: var(--bg-dark);
  font-family: 'Geist', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  color: var(--text-primary);
}

.mono {
  font-family: 'Geist Mono', monospace;
}

/* Glassmorphism Panels */
.glass-panel {
  background: var(--bg-card);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.8);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.glass-panel:hover {
  border-color: rgba(255, 255, 255, 0.1);
  box-shadow: 0 12px 40px 0 rgba(0, 0, 0, 0.9);
}

/* Focus States for Accessibility */
*:focus-visible {
  outline: 2px solid #ff761c;
  outline-offset: 4px;
}

/* Animations */
@keyframes pulse-glow {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.8; }
}

.ambient-glow {
  filter: blur(80px);
  animation: pulse-glow 8s infinite ease-in-out;
  pointer-events: none;
}

/* Stale and Loading Overlays */
.state-overlay {
  position: absolute;
  inset: 0;
  background: rgba(2, 2, 4, 0.85);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 50;
  backdrop-filter: blur(4px);
  border-radius: inherit;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 118, 28, 0.1);
  border-radius: 50%;
  border-top-color: #ff761c;
  animation: spin 1s ease infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Scrollbars */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: rgba(2, 2, 4, 0.5);
}

::-webkit-scrollbar-thumb {
  background: rgba(255, 118, 28, 0.3);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 118, 28, 0.6);
}
```

---

### Task 4: Create HTML layout structure
**Files:**
- Create: `web/index.html`

- [ ] **Step 1: Write `web/index.html`**
Implement the basic structure of the command center dashboard, containing the Global Decision Banner at the top, separate sections for Market Regime and Yield Decay, contract metadata, log window, and execution simulator controls.
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pharos Volatility Sentinel Command Center</title>
  <!-- Tailwind CSS -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            brand: '#ff761c',
            darkest: '#020204'
          }
        }
      }
    }
  </script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <link rel="stylesheet" href="css/styles.css">
  <!-- Ethers.js v6 -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/ethers/6.13.0/ethers.umd.min.js"></script>
</head>
<body class="bg-[#020204] text-[#f4f4f5] min-h-screen relative overflow-x-hidden flex flex-col">
  <!-- Ambient background glow elements -->
  <div class="fixed w-[500px] h-[500px] rounded-full bg-brand/5 top-[-250px] left-[-200px] ambient-glow"></div>
  <div class="fixed w-[600px] h-[600px] rounded-full bg-indigo-500/5 bottom-[-300px] right-[-200px] ambient-glow"></div>

  <!-- Global Decision Banner -->
  <div id="global-readiness-banner" class="w-full py-4 px-6 border-b border-white/10 text-center transition-colors duration-300 z-50 sticky top-0 bg-[#020204]/90 backdrop-blur-md">
    <div class="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <span class="flex h-3 w-3 relative">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" id="banner-ping"></span>
          <span class="relative inline-flex rounded-full h-3 w-3" id="banner-dot"></span>
        </span>
        <span class="text-sm font-semibold uppercase tracking-wider text-white/80">system status:</span>
        <span id="banner-decision-text" class="text-xl font-bold font-mono tracking-widest px-4 py-1 rounded border">LOADING</span>
      </div>
      <div class="flex items-center gap-6 text-xs text-white/60">
        <span id="banner-report-id" class="font-mono bg-white/5 px-2 py-1 rounded truncate max-w-[200px] sm:max-w-none">Report ID: 0x...</span>
        <span id="banner-freshness" class="font-mono">Freshness: --s ago</span>
        <span id="banner-confidence" class="font-mono">Confidence: --%</span>
      </div>
    </div>
  </div>

  <!-- Sticky Header -->
  <header class="w-full border-b border-white/5 bg-[#020204]/60 py-4 px-6">
    <div class="max-w-7xl mx-auto flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="relative w-8 h-8 flex items-center justify-center rounded border border-brand bg-brand/10">
          <i class="fa-solid fa-shield-halved text-brand text-lg"></i>
        </div>
        <div>
          <h1 class="text-lg font-bold uppercase tracking-wide">Pharos Sentinel</h1>
          <p class="text-[10px] text-white/40 uppercase tracking-widest font-mono">Command Center V2</p>
        </div>
      </div>
      
      <div class="flex items-center gap-4">
        <div class="flex items-center gap-2 bg-white/5 rounded-full px-3 py-1 border border-white/10">
          <span class="text-xs text-white/60 font-mono">Mode:</span>
          <button id="toggle-mode" class="text-xs font-bold font-mono text-brand focus-visible:outline-none" aria-label="Toggle execution mode">MOCK</button>
        </div>
        <button id="connect-wallet" class="px-4 py-1.5 rounded-full border border-white/10 hover:border-white/20 transition-all font-mono text-xs flex items-center gap-2 bg-[#09090c]">
          <span class="w-2 h-2 rounded-full bg-red-500" id="wallet-dot"></span>
          <span id="wallet-text">Connect Wallet</span>
        </button>
      </div>
    </div>
  </header>

  <!-- Main Grid Layout -->
  <main class="flex-grow max-w-7xl mx-auto w-full p-6 space-y-6">
    <!-- Row 1: Market Regime and Yield Decay monitors -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      <!-- Market Regime Section -->
      <section class="glass-panel p-6 rounded-2xl relative overflow-hidden" id="market-regime-section" aria-labelledby="market-title">
        <div class="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
          <div class="flex items-center gap-2">
            <i class="fa-solid fa-chart-line text-brand"></i>
            <h2 id="market-title" class="text-lg font-bold uppercase tracking-wider">Market Regime Monitor</h2>
          </div>
          <span id="market-regime-badge" class="font-mono text-xs font-bold px-3 py-1 rounded border bg-brand/10 text-brand border-brand/20">LOADING</span>
        </div>
        
        <div class="grid grid-cols-2 gap-4 mb-6">
          <div class="bg-black/30 p-3 rounded-lg border border-white/5">
            <span class="text-[10px] text-white/40 uppercase font-semibold">Volatility Index</span>
            <div id="market-volatility" class="text-xl font-bold font-mono text-white mt-1">--</div>
          </div>
          <div class="bg-black/30 p-3 rounded-lg border border-white/5">
            <span class="text-[10px] text-white/40 uppercase font-semibold">Price Divergence</span>
            <div id="market-divergence" class="text-xl font-bold font-mono text-white mt-1">--</div>
          </div>
          <div class="bg-black/30 p-3 rounded-lg border border-white/5">
            <span class="text-[10px] text-white/40 uppercase font-semibold">Bridge Net Outflow</span>
            <div id="market-bridge" class="text-xl font-bold font-mono text-white mt-1">--</div>
          </div>
          <div class="bg-black/30 p-3 rounded-lg border border-white/5">
            <span class="text-[10px] text-white/40 uppercase font-semibold">Liquidity Depth</span>
            <div id="market-liquidity" class="text-xl font-bold font-mono text-white mt-1">--</div>
          </div>
        </div>

        <div class="space-y-2">
          <span class="text-xs text-white/40 uppercase font-semibold block">Regime Diagnostics:</span>
          <ul id="market-reasons" class="space-y-1 text-xs font-mono text-white/80 max-h-24 overflow-y-auto bg-black/40 p-3 rounded border border-white/5">
            <li class="text-white/40">No diagnostics available.</li>
          </ul>
        </div>
      </section>

      <!-- Yield Decay Section -->
      <section class="glass-panel p-6 rounded-2xl relative overflow-hidden" id="yield-decay-section" aria-labelledby="yield-title">
        <div class="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
          <div class="flex items-center gap-2">
            <i class="fa-solid fa-seedling text-indigo-400"></i>
            <h2 id="yield-title" class="text-lg font-bold uppercase tracking-wider">Yield Decay Monitor</h2>
          </div>
          <span id="yield-decay-badge" class="font-mono text-xs font-bold px-3 py-1 rounded border bg-indigo-500/10 text-indigo-400 border-indigo-500/20">LOADING</span>
        </div>

        <div class="mb-4">
          <label for="opportunity-selector" class="text-xs text-white/40 uppercase font-semibold block mb-1">Opportunity ID</label>
          <select id="opportunity-selector" class="w-full bg-[#09090c] border border-white/10 rounded px-3 py-2 text-xs font-mono focus:border-brand focus-visible:outline-none" aria-label="Select yield opportunity ID">
            <option value="0xbe713906E4D5ac544C069Cd16B2233C979b8AB5a">ProtocolRegistry Vault</option>
            <option value="0xdeB9B625e70E38cdb0dEe5DEAACa25A5095D512E">SlippageGuard Vault</option>
          </select>
        </div>

        <div class="grid grid-cols-2 gap-4 mb-6">
          <div class="bg-black/30 p-3 rounded-lg border border-white/5">
            <span class="text-[10px] text-white/40 uppercase font-semibold">Decay Score</span>
            <div id="yield-decay-score" class="text-xl font-bold font-mono text-white mt-1">--</div>
          </div>
          <div class="bg-black/30 p-3 rounded-lg border border-white/5">
            <span class="text-[10px] text-white/40 uppercase font-semibold">Total APY</span>
            <div id="yield-apy" class="text-xl font-bold font-mono text-white mt-1">--</div>
          </div>
          <div class="bg-black/30 p-3 rounded-lg border border-white/5">
            <span class="text-[10px] text-white/40 uppercase font-semibold">TVL Assets</span>
            <div id="yield-tvl" class="text-xl font-bold font-mono text-white mt-1">--</div>
          </div>
          <div class="bg-black/30 p-3 rounded-lg border border-white/5">
            <span class="text-[10px] text-white/40 uppercase font-semibold">DEX TVL Net Flow</span>
            <div id="yield-netflow" class="text-xl font-bold font-mono text-white mt-1">--</div>
          </div>
        </div>

        <div class="space-y-2">
          <span class="text-xs text-white/40 uppercase font-semibold block">Decay Diagnostics:</span>
          <ul id="yield-reasons" class="space-y-1 text-xs font-mono text-white/80 max-h-24 overflow-y-auto bg-black/40 p-3 rounded border border-white/5">
            <li class="text-white/40">No diagnostics available.</li>
          </ul>
        </div>
      </section>

    </div>

    <!-- Row 2: Contract Status & Live Console -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      <!-- Contract Status Column -->
      <section class="glass-panel p-6 rounded-2xl flex flex-col justify-between" aria-labelledby="status-title">
        <div>
          <div class="flex items-center gap-2 border-b border-white/5 pb-3 mb-4">
            <i class="fa-solid fa-file-contract text-emerald-400"></i>
            <h2 id="status-title" class="text-sm font-bold uppercase tracking-wider">Gate Contract Safety</h2>
          </div>
          <div class="space-y-3 text-xs font-mono">
            <div class="flex justify-between items-center bg-black/20 p-2 rounded">
              <span class="text-white/40">ProtocolRegistry</span>
              <span id="addr-registry" class="text-white/80 truncate ml-2 max-w-[150px]">0xbe71...AB5a</span>
            </div>
            <div class="flex justify-between items-center bg-black/20 p-2 rounded">
              <span class="text-white/40">SlippageGuard</span>
              <span id="addr-slippage" class="text-white/80 truncate ml-2 max-w-[150px]">0xdeB9...512E</span>
            </div>
            <div class="flex justify-between items-center bg-black/20 p-2 rounded">
              <span class="text-white/40">MarketRegimeGate</span>
              <span id="addr-regime" class="text-white/80 truncate ml-2 max-w-[150px]">0xECF8...89CF</span>
            </div>
            <div class="flex justify-between items-center bg-black/20 p-2 rounded">
              <span class="text-white/40">ExecutionEngine</span>
              <span id="addr-engine" class="text-white/80 truncate ml-2 max-w-[150px]">0x8A3e...f8f4</span>
            </div>
          </div>
        </div>
        <div class="mt-4 pt-4 border-t border-white/5 text-[10px] text-white/40 font-mono flex items-center justify-between">
          <span>Chain ID: <span id="meta-chain-id" class="text-white/80">688689</span></span>
          <span>RPC: <span id="meta-rpc" class="text-white/80 font-bold">ONLINE</span></span>
        </div>
      </section>

      <!-- Live Execution Logs -->
      <section class="glass-panel p-6 rounded-2xl lg:col-span-2 flex flex-col justify-between" aria-labelledby="logs-title">
        <div>
          <div class="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
            <div class="flex items-center gap-2">
              <i class="fa-solid fa-terminal text-brand"></i>
              <h2 id="logs-title" class="text-sm font-bold uppercase tracking-wider">Live Security Logs</h2>
            </div>
            <button id="clear-logs" class="text-[10px] text-white/40 hover:text-white/80 uppercase font-mono px-2 py-0.5 border border-white/10 rounded hover:bg-white/5 transition-colors">Clear</button>
          </div>
          <div id="logs-output" class="h-36 overflow-y-auto font-mono text-xs space-y-1.5 p-3 rounded bg-black/50 border border-white/5">
            <div class="text-brand/80">[SYSTEM] Pharos Volatility Sentinel dashboard ready.</div>
          </div>
        </div>
      </section>

    </div>
  </main>

  <!-- Footer -->
  <footer class="w-full border-t border-white/5 bg-black/40 py-4 px-6 text-center text-xs text-white/40 mt-auto">
    <div class="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
      <p>&copy; 2026 Pharos Network. Volatility Shield Sentinel Middleware.</p>
      <div class="flex items-center gap-2">
        <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
        <span class="font-mono">Sentinel Shell Active</span>
      </div>
    </div>
  </footer>

  <script type="module" src="js/main.js"></script>
</body>
</html>
```

---

### Task 5: Implement central application script and initialization
**Files:**
- Create: `web/js/main.js`

- [ ] **Step 1: Write `web/js/main.js`**
Write UI bindings, listeners for state modifications, XSS prevention routines, and setup initial state fetch polling.
```javascript
import { stateStore } from './state.js';
import { apiClient } from './api.js';
import { walletHandler } from './wallet.js';
import { CONFIG } from './config.js';

// Element Cache
const elements = {
  bannerDecisionText: document.getElementById('banner-decision-text'),
  bannerPing: document.getElementById('banner-ping'),
  bannerDot: document.getElementById('banner-dot'),
  bannerReportId: document.getElementById('banner-report-id'),
  bannerFreshness: document.getElementById('banner-freshness'),
  bannerConfidence: document.getElementById('banner-confidence'),
  
  toggleMode: document.getElementById('toggle-mode'),
  connectWallet: document.getElementById('connect-wallet'),
  walletDot: document.getElementById('wallet-dot'),
  walletText: document.getElementById('wallet-text'),
  
  marketRegimeBadge: document.getElementById('market-regime-badge'),
  marketVolatility: document.getElementById('market-volatility'),
  marketDivergence: document.getElementById('market-divergence'),
  marketBridge: document.getElementById('market-bridge'),
  marketLiquidity: document.getElementById('market-liquidity'),
  marketReasons: document.getElementById('market-reasons'),
  
  yieldDecayBadge: document.getElementById('yield-decay-badge'),
  opportunitySelector: document.getElementById('opportunity-selector'),
  yieldDecayScore: document.getElementById('yield-decay-score'),
  yieldApy: document.getElementById('yield-apy'),
  yieldTvl: document.getElementById('yield-tvl'),
  yieldNetflow: document.getElementById('yield-netflow'),
  yieldReasons: document.getElementById('yield-reasons'),
  
  logsOutput: document.getElementById('logs-output'),
  clearLogs: document.getElementById('clear-logs'),
  metaChainId: document.getElementById('meta-chain-id'),
  metaRpc: document.getElementById('meta-rpc')
};

// Safe logger utility to prevent innerHTML XSS injection
function logMessage(text, type = 'info') {
  const line = document.createElement('div');
  line.className = `text-xs font-mono ${type === 'error' ? 'text-red-500' : type === 'warning' ? 'text-amber-500' : 'text-sky-400'}`;
  
  const timestamp = document.createElement('span');
  timestamp.className = 'text-white/30 mr-2';
  timestamp.textContent = `[${new Date().toLocaleTimeString()}]`;
  
  const content = document.createElement('span');
  content.textContent = text;
  
  line.appendChild(timestamp);
  line.appendChild(content);
  elements.logsOutput.appendChild(line);
  elements.logsOutput.scrollTop = elements.logsOutput.scrollHeight;
}

// Compute combined decision ALLOW/RESTRICT/BLOCK/UNWIND
function getCombinedDecision(marketRegime, yieldState) {
  if (marketRegime === 'PANIC') return 'UNWIND';
  if (marketRegime === 'VOLATILE') {
    if (yieldState === 'DECAYING' || yieldState === 'EXIT') return 'UNWIND';
    return 'RESTRICT';
  }
  // NORMAL market
  if (yieldState === 'EXIT') return 'UNWIND';
  if (yieldState === 'DECAYING') return 'BLOCK';
  if (yieldState === 'WATCH') return 'RESTRICT';
  return 'ALLOW';
}

// Render function
function render(state) {
  // Update wallet connection info
  if (state.wallet.connected) {
    elements.walletText.textContent = `${state.wallet.address.slice(0, 6)}...${state.wallet.address.slice(-4)}`;
    elements.walletDot.className = 'w-2 h-2 rounded-full bg-emerald-500';
  } else {
    elements.walletText.textContent = 'Connect Wallet';
    elements.walletDot.className = 'w-2 h-2 rounded-full bg-red-500';
  }

  // Update Execution Mode button
  elements.toggleMode.textContent = state.mode.toUpperCase();

  // Compute decisions
  const combinedDecision = getCombinedDecision(state.marketStatus.regime, state.yieldStatus.yieldState);

  // Update Global Banner styles
  elements.bannerDecisionText.textContent = combinedDecision;
  
  let bannerBg = 'bg-[#020204]/90';
  let bannerBorder = 'border-white/10';
  let bannerColor = 'text-white border-white/20';
  let statusDotColor = 'bg-white';

  if (combinedDecision === 'ALLOW') {
    bannerBg = 'bg-emerald-950/20';
    bannerBorder = 'border-emerald-500/20';
    bannerColor = 'text-emerald-400 border-emerald-500/30 bg-emerald-950/40';
    statusDotColor = 'bg-emerald-500';
  } else if (combinedDecision === 'RESTRICT') {
    bannerBg = 'bg-amber-950/20';
    bannerBorder = 'border-amber-500/20';
    bannerColor = 'text-amber-400 border-amber-500/30 bg-amber-950/40';
    statusDotColor = 'bg-amber-500';
  } else if (combinedDecision === 'BLOCK') {
    bannerBg = 'bg-rose-950/20';
    bannerBorder = 'border-rose-500/20';
    bannerColor = 'text-rose-400 border-rose-500/30 bg-rose-950/40';
    statusDotColor = 'bg-rose-500';
  } else if (combinedDecision === 'UNWIND') {
    bannerBg = 'bg-violet-950/20';
    bannerBorder = 'border-violet-500/20';
    bannerColor = 'text-violet-400 border-violet-500/30 bg-violet-950/40';
    statusDotColor = 'bg-violet-500';
  }

  elements.bannerDot.className = `relative inline-flex rounded-full h-3 w-3 ${statusDotColor}`;
  elements.bannerPing.className = `animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${statusDotColor}`;
  elements.bannerDecisionText.className = `text-xl font-bold font-mono tracking-widest px-4 py-1 rounded border ${bannerColor}`;

  // Update Report Metadata in banner
  const latestReportId = state.marketStatus.reasonsHash || '0x000';
  elements.bannerReportId.textContent = `Report ID: ${latestReportId.slice(0, 10)}...`;
  
  if (state.marketStatus.latest) {
    const elapsed = Math.max(0, Math.floor(Date.now() / 1000) - state.marketStatus.latest.observedAt);
    elements.bannerFreshness.textContent = `Freshness: ${elapsed}s ago`;
    elements.bannerConfidence.textContent = `Confidence: ${(state.marketStatus.latest.confidenceBps / 100).toFixed(1)}%`;
  }

  // Update Market Regime values
  elements.marketRegimeBadge.textContent = state.marketStatus.regime;
  
  if (state.marketStatus.regime === 'NORMAL') {
    elements.marketRegimeBadge.className = 'font-mono text-xs font-bold px-3 py-1 rounded border bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  } else if (state.marketStatus.regime === 'VOLATILE') {
    elements.marketRegimeBadge.className = 'font-mono text-xs font-bold px-3 py-1 rounded border bg-amber-500/10 text-amber-400 border-amber-500/20';
  } else if (state.marketStatus.regime === 'PANIC') {
    elements.marketRegimeBadge.className = 'font-mono text-xs font-bold px-3 py-1 rounded border bg-rose-500/10 text-rose-400 border-rose-500/20';
  }

  if (state.marketStatus.latest) {
    elements.marketVolatility.textContent = `${(state.marketStatus.latest.volatilityBps / 100).toFixed(2)}%`;
    elements.marketDivergence.textContent = `${(state.marketStatus.latest.priceDivergenceBps / 100).toFixed(2)}%`;
    elements.marketBridge.textContent = `$${parseFloat(state.marketStatus.latest.bridgeNetOutflowUsd).toLocaleString()}`;
    elements.marketLiquidity.textContent = `$${parseFloat(state.marketStatus.latest.liquidityDepthUsd).toLocaleString()}`;
  }

  // Populate Market Regime Reasons safely
  elements.marketReasons.innerHTML = '';
  if (state.marketStatus.reasons.length === 0) {
    const li = document.createElement('li');
    li.className = 'text-white/40';
    li.textContent = 'No active risk signals detected.';
    elements.marketReasons.appendChild(li);
  } else {
    state.marketStatus.reasons.forEach(r => {
      const li = document.createElement('li');
      li.className = 'flex items-center gap-2 text-white/80';
      const bullet = document.createElement('span');
      bullet.className = 'w-1.5 h-1.5 rounded-full bg-brand';
      li.appendChild(bullet);
      const span = document.createElement('span');
      span.textContent = r;
      li.appendChild(span);
      elements.marketReasons.appendChild(li);
    });
  }

  // Update Yield Decay values
  elements.yieldDecayBadge.textContent = state.yieldStatus.yieldState;
  if (state.yieldStatus.yieldState === 'HEALTHY') {
    elements.yieldDecayBadge.className = 'font-mono text-xs font-bold px-3 py-1 rounded border bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  } else if (state.yieldStatus.yieldState === 'WATCH') {
    elements.yieldDecayBadge.className = 'font-mono text-xs font-bold px-3 py-1 rounded border bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
  } else if (state.yieldStatus.yieldState === 'DECAYING') {
    elements.yieldDecayBadge.className = 'font-mono text-xs font-bold px-3 py-1 rounded border bg-amber-500/10 text-amber-400 border-amber-500/20';
  } else if (state.yieldStatus.yieldState === 'EXIT') {
    elements.yieldDecayBadge.className = 'font-mono text-xs font-bold px-3 py-1 rounded border bg-rose-500/10 text-rose-400 border-rose-500/20';
  }

  if (state.yieldStatus.latest) {
    elements.yieldDecayScore.textContent = `${state.yieldStatus.decayScore} / 100`;
    elements.yieldApy.textContent = `${(state.yieldStatus.latest.apyBps / 100).toFixed(2)}%`;
    elements.yieldTvl.textContent = `$${parseFloat(state.yieldStatus.latest.tvlUsd).toLocaleString()}`;
    elements.yieldNetflow.textContent = `$${parseFloat(state.yieldStatus.latest.netFlowUsd24h).toLocaleString()}`;
  }

  // Populate Yield Reasons safely
  elements.yieldReasons.innerHTML = '';
  if (state.yieldStatus.reasons.length === 0) {
    const li = document.createElement('li');
    li.className = 'text-white/40';
    li.textContent = 'Opportunity is performing inside parameters.';
    elements.yieldReasons.appendChild(li);
  } else {
    state.yieldStatus.reasons.forEach(r => {
      const li = document.createElement('li');
      li.className = 'flex items-center gap-2 text-white/80';
      const bullet = document.createElement('span');
      bullet.className = 'w-1.5 h-1.5 rounded-full bg-indigo-500';
      li.appendChild(bullet);
      const span = document.createElement('span');
      span.textContent = r;
      li.appendChild(span);
      elements.yieldReasons.appendChild(li);
    });
  }

  // Update metadata fields
  elements.metaChainId.textContent = state.wallet.chainId || CONFIG.CHAIN_ID;
}

// Fetch & Update Loop
async function pollData() {
  const currentState = stateStore.getState();
  stateStore.updateState({ apiState: { ...currentState.apiState, loading: true } });
  
  try {
    const marketData = await apiClient.fetchMarketStatus();
    const yieldData = await apiClient.fetchYieldStatus(currentState.yieldStatus.opportunityId);
    const decisionsData = await apiClient.fetchDecisionsHistory();
    
    stateStore.updateState({
      marketStatus: marketData,
      yieldStatus: yieldData,
      decisionsHistory: decisionsData.history,
      apiState: {
        loading: false,
        error: null,
        stale: false,
        lastUpdated: Math.floor(Date.now() / 1000)
      }
    });
  } catch (err) {
    logMessage(`Data poll failed: ${err.message}`, 'error');
    stateStore.updateState({
      apiState: {
        loading: false,
        error: err.message,
        stale: true,
        lastUpdated: currentState.apiState.lastUpdated
      }
    });
  }
}

// Init Function
function init() {
  stateStore.subscribe(render);
  
  // Connect Event Listeners
  elements.toggleMode.addEventListener('click', () => {
    const currentMode = stateStore.getState().mode;
    const newMode = currentMode === 'mock' ? 'web3' : 'mock';
    stateStore.updateState({ mode: newMode });
    logMessage(`Switched mode to: ${newMode.toUpperCase()}`, 'warning');
    pollData();
  });

  elements.connectWallet.addEventListener('click', () => {
    walletHandler.connectWallet();
  });

  elements.opportunitySelector.addEventListener('change', (e) => {
    const oppId = e.target.value;
    stateStore.updateState(prev => ({
      yieldStatus: { ...prev.yieldStatus, opportunityId: oppId }
    }));
    logMessage(`Switched target opportunity to: ${oppId}`, 'info');
    pollData();
  });

  elements.clearLogs.addEventListener('click', () => {
    elements.logsOutput.innerHTML = '';
    logMessage('Terminal log cleared.');
  });

  // Start wallet handler
  walletHandler.checkConnection();
  walletHandler.setupListeners();

  // Initial fetch and start loop
  pollData();
  setInterval(pollData, 10000);
}

document.addEventListener('DOMContentLoaded', init);
```

---

### Task 6: Verification and Execution Choice
**Files:**
- Create: `web/js/api.js`
- Create: `web/js/wallet.js`
- Create: `web/js/config.js`
- Create: `web/js/state.js`
- Create: `web/js/main.js`

- [ ] **Step 1: Verify presence of all shell files**
Confirm that `web/index.html`, `web/css/styles.css`, `web/js/config.js`, `web/js/api.js`, `web/js/wallet.js`, `web/js/state.js` are created correctly.

- [ ] **Step 2: Commit shell implementation**
Run git commit commands to record the shell.

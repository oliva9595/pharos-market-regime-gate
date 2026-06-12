# Premium Dashboard UI Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Overhaul the layout, CSS styles, and JavaScript logic of the Pharos Market Regime Gate web application to establish a premium glassmorphic neon cyberpunk dashboard aesthetic (inspired by the Vara Network Agents Dashboard).

**Architecture:** Hybrid approach using Tailwind CSS CDN for layout grid utility classes and custom CSS overrides in `css/style.css` for high-fidelity glassmorphism, dynamic glowing ambient backgrounds, rotating radar animations, and pulsing status cores.

**Tech Stack:** HTML5, Tailwind CSS, Google Fonts (Geist & Geist Mono), Ethers.js v6, Vanilla JS.

---

### Task 1: Update index.html
**Files:**
- Modify: `d:\dorahack\pharos-market-regime-gate\index.html`

- [ ] **Step 1: Write the updated index.html structure**
Overwrites `index.html` entirely with a modern layout, floating glass header navigation, sub-header metadata status bar, metrics grid (VIX, Bridge, Divergence, Auto-Keeper controls), Shield radar display, Agent Arena cards, and Live Extrinsics Console.

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pharos Volatility Sentinel & Regime Gate</title>
    
    <!-- Google Fonts: Geist & Geist Mono -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700;800&family=Geist+Mono:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    
    <!-- Tailwind CSS CDN -->
    <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
    <script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    colors: {
                        primary: "#ff761c",
                        "color-green": "#24a107",
                        "color-blue": "#0ea5e9",
                        "color-red": "#ef4444"
                    }
                }
            }
        }
    </script>
    
    <!-- Font Awesome CDN -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <!-- Local styles override -->
    <link rel="stylesheet" href="css/style.css?v=3">
    <!-- Ethers.js v6 CDN -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/ethers/6.13.0/ethers.umd.min.js"></script>
    <!-- App JavaScript -->
    <script defer src="js/app.js?v=3"></script>
</head>
<body class="bg-[#030303] text-[#f4f4f5] font-sans antialiased min-h-screen relative overflow-x-hidden">
    <!-- Ambient glowing backgrounds -->
    <div class="page-ambient" aria-hidden="true">
        <div class="page-ambient__glow page-ambient__glow--one"></div>
        <div class="page-ambient__glow page-ambient__glow--two"></div>
    </div>

    <!-- Sticky Glass Header -->
    <header class="app-header">
        <div class="max-w-[1240px] mx-auto px-5 w-full flex items-center justify-between h-16">
            <a class="flex items-center gap-3 brand-link" href="#">
                <div class="logo-container">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-[#ff761c]">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                    <span class="logo-glow"></span>
                </div>
                <div class="leading-none">
                    <div class="brand-title">
                        <span>Pharos</span><span class="text-[#a1a1aa]">::Sentinel</span>
                    </div>
                    <div class="brand-subtitle">Network</div>
                </div>
            </a>

            <!-- Navigation Links -->
            <nav class="hidden lg:flex items-center gap-1 header-nav">
                <a class="nav-link" href="#overview">
                    <i class="fas fa-chart-line"></i>
                    <span>Overview</span>
                </a>
                <a class="nav-link" href="#regime-gate">
                    <i class="fas fa-shield-halved"></i>
                    <span>Regime Gate</span>
                </a>
                <a class="nav-link" href="#agent-arena">
                    <i class="fas fa-robot"></i>
                    <span>Agent Arena</span>
                </a>
                <a class="nav-link" href="#live-logs">
                    <i class="fas fa-file-invoice"></i>
                    <span>Live Logs</span>
                </a>
            </nav>

            <!-- Header Controls -->
            <div class="flex items-center gap-4">
                <div class="mock-mode-container flex items-center gap-2">
                    <span class="text-xs text-[#a1a1aa]">Mock Mode</span>
                    <label class="switch">
                        <input type="checkbox" id="mock-mode-toggle" checked>
                        <span class="slider round"></span>
                    </label>
                </div>

                <button id="btn-connect-wallet" type="button" class="btn-wallet-connect flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 hover:border-white/20 transition-colors bg-[#09090b]/80">
                    <span id="wallet-status-dot" class="live-dot bg-[#24a107]"></span>
                    <span id="wallet-account" class="text-xs font-mono">Mock Mode Active</span>
                </button>

                <div class="network-badge text-xs font-semibold px-2.5 py-1 rounded bg-[#ff761c]/10 text-[#ff761c] border border-[#ff761c]/20">
                    PHRS ATLANTIC
                </div>
            </div>
        </div>
    </header>

    <!-- Sub-header Metadata Bar -->
    <div class="subheader-bar border-b border-white/5 bg-[#0e0e0e]/50 py-3 mt-16">
        <div class="max-w-[1240px] mx-auto px-5 w-full flex items-center justify-between text-xs font-mono">
            <div class="flex items-center gap-2">
                <span class="live-dot animate-pulse bg-[#24a107]" id="network-pulsing-dot"></span>
                <span class="text-[#a1a1aa]">Pharos Atlantic Testnet</span>
            </div>
            <div class="flex items-center gap-4 text-xs">
                <span>Block <span class="text-[#f4f4f5] font-semibold" id="live-block-height">#188,432</span></span>
                <span class="text-white/10">•</span>
                <span>Regime <span class="text-[#24a107] font-semibold" id="live-regime-status">NORMAL</span></span>
                <span class="text-white/10">•</span>
                <span>Wallet Balance <span class="text-[#ff761c] font-semibold" id="live-wallet-balance">0.00855 PHRS</span></span>
                <span class="text-white/10">•</span>
                <span>Engine <span class="text-[#a1a1aa]" id="engine-address-badge">0x8A3e...f8f4</span></span>
            </div>
        </div>
    </div>

    <!-- Main Content Area -->
    <main class="max-w-[1240px] mx-auto px-5 py-8 space-y-8">
        
        <!-- SECTION 1: Metrics -->
        <section id="overview" class="space-y-4">
            <div class="mb-6">
                <div class="text-[#ff761c] text-xs font-mono uppercase tracking-widest">Insights</div>
                <h1 class="text-2xl font-bold uppercase tracking-tight">live security oracle metrics</h1>
                <p class="text-sm text-[#a1a1aa]">Real-time parameters monitored on-chain by the Pharos Volatility Sentinel.</p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <!-- Card VIX -->
                <article class="insights-metric-card glass-panel p-5 rounded-xl border border-white/5 bg-[#09090b]/60 flex flex-col justify-between h-44" id="oracle-card-vix">
                    <span class="text-xs text-[#a1a1aa] uppercase font-semibold">Market Volatility (VIX)</span>
                    <span class="text-3xl font-mono font-bold text-[#ff761c]" id="oracle-vix-val">18.2</span>
                    <div class="sparkline-container h-12">
                        <svg class="sparkline-svg w-full h-full" id="svg-vix">
                            <path d="" stroke="#ff761c" stroke-width="2.2" fill="none"></path>
                        </svg>
                    </div>
                </article>

                <!-- Card Bridge -->
                <article class="insights-metric-card glass-panel p-5 rounded-xl border border-white/5 bg-[#09090b]/60 flex flex-col justify-between h-44" id="oracle-card-bridge">
                    <span class="text-xs text-[#a1a1aa] uppercase font-semibold">Bridge Net Flow</span>
                    <span class="text-3xl font-mono font-bold text-[#0ea5e9]" id="oracle-bridge-val">1.2M <span class="text-xs text-[#a1a1aa]">/ hr</span></span>
                    <div class="sparkline-container h-12">
                        <svg class="sparkline-svg w-full h-full" id="svg-bridge">
                            <path d="" stroke="#0ea5e9" stroke-width="2.2" fill="none"></path>
                        </svg>
                    </div>
                </article>

                <!-- Card Divergence -->
                <article class="insights-metric-card glass-panel p-5 rounded-xl border border-white/5 bg-[#09090b]/60 flex flex-col justify-between h-44" id="oracle-card-div">
                    <span class="text-xs text-[#a1a1aa] uppercase font-semibold">Oracle Price Divergence</span>
                    <span class="text-3xl font-mono font-bold text-[#24a107]" id="oracle-div-val">0.05%</span>
                    <div class="sparkline-container h-12">
                        <svg class="sparkline-svg w-full h-full" id="svg-div">
                            <path d="" stroke="#24a107" stroke-width="2.2" fill="none"></path>
                        </svg>
                    </div>
                </article>

                <!-- Controls Card -->
                <article class="insights-metric-card-controls glass-panel p-5 rounded-xl border border-white/5 bg-[#09090b]/60 flex flex-col justify-between h-44">
                    <div class="flex items-center justify-between">
                        <span class="text-xs text-[#a1a1aa] uppercase font-semibold">Auto-Keeper bot</span>
                        <div class="keeper-status-badge text-[10px] uppercase font-mono px-2 py-0.5 rounded border border-white/10 text-[#a1a1aa]" id="keeper-status-badge">
                            <i class="fas fa-robot"></i> Auto-Keeper Off
                        </div>
                    </div>
                    
                    <div class="flex items-center justify-between text-xs text-[#a1a1aa]">
                        <span>Auto-Regime Selector</span>
                        <label class="switch">
                            <input type="checkbox" id="keeper-toggle">
                            <span class="slider round"></span>
                        </label>
                    </div>

                    <div class="space-y-1">
                        <span class="text-[10px] text-[#52525b] uppercase font-mono">Risk Shock Injectors:</span>
                        <div class="grid grid-cols-3 gap-1.5">
                            <button class="btn-shock bg-white/5 border border-white/5 hover:border-white/10 hover:bg-white/10 text-[10px] py-1.5 font-bold uppercase rounded" id="btn-shock-dex">DEX Spike</button>
                            <button class="btn-shock bg-white/5 border border-white/5 hover:border-white/10 hover:bg-white/10 text-[10px] py-1.5 font-bold uppercase rounded" id="btn-shock-bridge">Bridge Outflow</button>
                            <button class="btn-shock bg-white/5 border border-white/5 hover:border-white/10 hover:bg-white/10 text-[10px] py-1.5 font-bold uppercase rounded" id="btn-shock-stabilize">Stabilize</button>
                        </div>
                    </div>
                </article>
            </div>
        </section>

        <!-- SECTION 2: Shield & Arena -->
        <section class="grid grid-cols-1 lg:grid-cols-12 gap-8" id="regime-gate">
            <!-- Left Side: Shield -->
            <article class="lg:col-span-5 glass-panel p-6 rounded-xl border border-white/5 bg-[#09090b]/60 flex flex-col justify-between min-h-[440px]">
                <div>
                    <div class="text-[#ff761c] text-xs font-mono uppercase tracking-widest">Shield Gate</div>
                    <h2 class="text-xl font-bold uppercase tracking-tight mb-4">Gate 7: Market Regime Shield</h2>
                </div>
                
                <div class="shield-sentinel-display flex-grow flex flex-col items-center justify-center relative my-4 border border-white/5 rounded-lg py-8 bg-black/40 overflow-hidden min-h-[200px]">
                    <div class="shield-radar-ring"></div>
                    <div class="sentinel-shield-core secure-pulse text-5xl mb-4" id="sentinel-shield-core">
                        <i class="fas fa-shield-halved"></i>
                    </div>
                    <div class="shield-status-label text-sm font-mono tracking-wider font-bold" id="sentinel-status-label">NORMAL MODE</div>
                </div>

                <div class="space-y-2">
                    <span class="text-xs text-[#a1a1aa] block">Manual override controls (Owner Only):</span>
                    <div class="grid grid-cols-3 gap-2">
                        <button class="btn py-2 border border-white/5 hover:border-white/10 hover:bg-white/10 text-xs font-bold rounded" id="regime-btn-0">Normal</button>
                        <button class="btn py-2 border border-white/5 hover:border-white/10 hover:bg-white/10 text-xs font-bold rounded" id="regime-btn-1">Volatile</button>
                        <button class="btn py-2 border border-white/5 hover:border-white/10 hover:bg-white/10 text-xs font-bold rounded" id="regime-btn-2">Panic</button>
                    </div>
                </div>
            </article>

            <!-- Right Side: Agent Arena -->
            <article class="lg:col-span-7 glass-panel p-6 rounded-xl border border-white/5 bg-[#09090b]/60 flex flex-col justify-between min-h-[440px]" id="agent-arena">
                <div class="flex items-center justify-between mb-4">
                    <div>
                        <div class="text-color-blue text-xs font-mono uppercase tracking-widest">Simulation</div>
                        <h2 class="text-xl font-bold uppercase tracking-tight">AI Agent Arena</h2>
                    </div>
                    <div class="flex items-center gap-2 text-xs">
                        <span class="text-[#a1a1aa]">Run Arena</span>
                        <label class="switch">
                            <input type="checkbox" id="arena-loop-toggle" checked>
                            <span class="slider round"></span>
                        </label>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 flex-grow">
                    <!-- Agent Card: Yield -->
                    <div class="agent-card glass-panel p-4 rounded-lg border border-white/5 bg-black/30 flex flex-col justify-between relative" id="agent-yield">
                        <div class="agent-status-indicator absolute top-3 right-3">
                            <span class="agent-status-dot active inline-block w-2.5 h-2.5 rounded-full bg-[#24a107]"></span>
                            <span class="agent-pulse-ring"></span>
                        </div>
                        <div class="space-y-3">
                            <div class="agent-header flex items-center gap-2 border-b border-white/5 pb-2">
                                <i class="fas fa-money-bill-trend-up text-[#ff761c]"></i>
                                <h3 class="text-sm font-bold">Yield Agent</h3>
                            </div>
                            <div class="agent-meta text-[10px] space-y-1 font-mono">
                                <div class="flex justify-between">
                                    <span class="text-[#a1a1aa]">CertiK:</span>
                                    <span class="text-[#24a107] font-semibold">Score 94 / 100</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-[#a1a1aa]">GoPlus:</span>
                                    <span class="text-[#24a107] font-semibold"><i class="fas fa-check-circle"></i> Clean</span>
                                </div>
                            </div>
                        </div>
                        <div class="agent-console mt-4 font-mono text-[9px] bg-black/60 p-2 rounded border border-white/5">
                            <div class="text-[#52525b] border-b border-white/5 pb-1 mb-1 font-semibold uppercase">Terminal Logs</div>
                            <div class="agent-console-lines text-sky-400 h-16 overflow-y-auto space-y-1" id="agent-yield-logs">
                                <div>[YieldAgent] Idle. Loop active.</div>
                            </div>
                        </div>
                    </div>

                    <!-- Agent Card: Arb -->
                    <div class="agent-card glass-panel p-4 rounded-lg border border-white/5 bg-black/30 flex flex-col justify-between relative" id="agent-arb">
                        <div class="agent-status-indicator absolute top-3 right-3">
                            <span class="agent-status-dot active inline-block w-2.5 h-2.5 rounded-full bg-[#24a107]"></span>
                            <span class="agent-pulse-ring"></span>
                        </div>
                        <div class="space-y-3">
                            <div class="agent-header flex items-center gap-2 border-b border-white/5 pb-2">
                                <i class="fas fa-scale-balanced text-[#0ea5e9]"></i>
                                <h3 class="text-sm font-bold">Arb Agent</h3>
                            </div>
                            <div class="agent-meta text-[10px] space-y-1 font-mono">
                                <div class="flex justify-between">
                                    <span class="text-[#a1a1aa]">CertiK:</span>
                                    <span class="text-orange-500 font-semibold">Score 0 / 100</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-[#a1a1aa]">GoPlus:</span>
                                    <span class="text-orange-500 font-semibold"><i class="fas fa-triangle-exclamation"></i> Unrated</span>
                                </div>
                            </div>
                        </div>
                        <div class="agent-console mt-4 font-mono text-[9px] bg-black/60 p-2 rounded border border-white/5">
                            <div class="text-[#52525b] border-b border-white/5 pb-1 mb-1 font-semibold uppercase">Terminal Logs</div>
                            <div class="agent-console-lines text-sky-400 h-16 overflow-y-auto space-y-1" id="agent-arb-logs">
                                <div>[ArbAgent] Idle. Loop active.</div>
                            </div>
                        </div>
                    </div>

                    <!-- Agent Card: Scam -->
                    <div class="agent-card glass-panel p-4 rounded-lg border border-white/5 bg-black/30 flex flex-col justify-between relative" id="agent-scam">
                        <div class="agent-status-indicator absolute top-3 right-3">
                            <span class="agent-status-dot blocked inline-block w-2.5 h-2.5 rounded-full bg-[#ef4444]"></span>
                            <span class="agent-pulse-ring"></span>
                        </div>
                        <div class="space-y-3">
                            <div class="agent-header flex items-center gap-2 border-b border-white/5 pb-2">
                                <i class="fas fa-skull-crossbones text-[#ef4444]"></i>
                                <h3 class="text-sm font-bold">Scam Agent</h3>
                            </div>
                            <div class="agent-meta text-[10px] space-y-1 font-mono">
                                <div class="flex justify-between">
                                    <span class="text-[#a1a1aa]">CertiK:</span>
                                    <span class="text-[#ef4444] font-semibold">Score 12 / 100</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-[#a1a1aa]">GoPlus:</span>
                                    <span class="text-[#ef4444] font-semibold"><i class="fas fa-circle-xmark"></i> Blocked</span>
                                </div>
                            </div>
                        </div>
                        <div class="agent-console mt-4 font-mono text-[9px] bg-black/60 p-2 rounded border border-white/5">
                            <div class="text-[#52525b] border-b border-white/5 pb-1 mb-1 font-semibold uppercase">Terminal Logs</div>
                            <div class="agent-console-lines text-red-500 h-16 overflow-y-auto space-y-1" id="agent-scam-logs">
                                <div>[ScamBot] Idle. Loop active.</div>
                            </div>
                        </div>
                    </div>
                </div>
            </article>
        </section>

        <!-- SECTION 3: Live Logs -->
        <section id="live-logs" class="glass-panel p-5 rounded-xl border border-white/5 bg-[#09090b]/60 space-y-4">
            <div class="flex items-center justify-between border-b border-white/5 pb-3">
                <div>
                    <div class="text-[#ff761c] text-xs font-mono uppercase tracking-widest">Event Feed</div>
                    <h2 class="text-xl font-bold uppercase tracking-tight">live security extrinsics</h2>
                </div>
                <button type="button" id="btn-clear-terminal" class="btn-clear text-xs px-3 py-1.5 rounded border border-white/5 hover:border-white/10 hover:bg-white/5 font-mono text-[#a1a1aa] transition-colors">Clear Logs</button>
            </div>
            
            <div class="insights-event-feed font-mono text-xs overflow-y-auto h-40 space-y-1.5 p-3 rounded bg-black/60 border border-white/5" id="terminal-output">
                <div class="terminal-line system-msg">[SYSTEM] Pharos Execution Security Gate Console active. Ready.</div>
            </div>
        </section>

    </main>

    <!-- Footer Component -->
    <footer class="border-t border-white/5 bg-[#09090b]/80 py-6 mt-12 text-xs text-[#a1a1aa]">
        <div class="max-w-[1240px] mx-auto px-5 w-full flex items-center justify-between">
            <p>&copy; 2026 Pharos Network. Volatility Shield Sentinel Middleware.</p>
            <div class="flex items-center gap-2 font-mono">
                <span class="live-dot bg-[#24a107]"></span>
                <span>Sentinel Active</span>
            </div>
        </div>
    </footer>
</body>
</html>
```

- [ ] **Step 2: Save the updated index.html**
Write the complete code block to `d:\dorahack\pharos-market-regime-gate\index.html`.

- [ ] **Step 3: Commit**
```bash
git add index.html
git commit -m "feat: upgrade index.html structure for premium glassmorphic dashboard"
```

---

### Task 2: Update css/style.css
**Files:**
- Modify: `d:\dorahack\pharos-market-regime-gate\css\style.css`

- [ ] **Step 1: Write the updated style.css overrides**
Replaces `css/style.css` with a high-fidelity glassmorphic stylesheet, containing custom colors, rotating radar sweeps, glows, pulsing core states, and dynamic ambient background orbs.

```css
/*
 * Pharos Volatility Sentinel & Market Regime Gate
 * Styling inspired by the Vara Network Agents Dashboard (Geist Aesthetic)
 */

:root {
    --bg-background: #030303;
    --card-bg: rgba(9, 9, 11, 0.65);
    --border-color: rgba(255, 255, 255, 0.05);
    --text-primary: #f4f4f5;
    --text-secondary: #a1a1aa;
    --text-muted: #52525b;
    
    --primary-accent: #ff761c; /* Pharos Orange */
    --primary: #ff761c;
    --color-green: #24a107; 
    --color-blue: #0ea5e9;  
    --color-red: #ef4444;   
    
    --font-sans: 'Geist', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    --font-mono: 'Geist Mono', "Fira Code", Monaco, Consolas, monospace;
    --glass-blur: blur(24px);
}

/* Ambient glow canvas */
.page-ambient {
    position: fixed;
    inset: 0;
    z-index: -10;
    pointer-events: none;
    overflow: hidden;
}

.page-ambient__glow {
    position: absolute;
    width: 600px;
    height: 600px;
    border-radius: 50%;
    opacity: 0.05;
    filter: blur(150px);
}

.page-ambient__glow--one {
    top: -100px;
    left: -100px;
    background: var(--primary-accent);
}

.page-ambient__glow--two {
    bottom: -150px;
    right: -100px;
    background: var(--color-blue);
}

/* Glass panel */
.glass-panel {
    background: var(--card-bg) !important;
    backdrop-filter: var(--glass-blur) !important;
    -webkit-backdrop-filter: var(--glass-blur) !important;
    border: 1px solid var(--border-color) !important;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.glass-panel:hover {
    border-color: rgba(255, 118, 28, 0.15) !important;
}

/* Sticky Header styling overrides */
.app-header {
    position: fixed;
    left: 0;
    right: 0;
    top: 0;
    z-index: 50;
    border-bottom: 1px solid var(--border-color);
    background: rgba(3, 3, 3, 0.8);
    backdrop-filter: var(--glass-blur);
    -webkit-backdrop-filter: var(--glass-blur);
}

.logo-container {
    position: relative;
    width: 34px;
    height: 34px;
    border: 1px solid rgba(255, 118, 28, 0.25);
    background: rgba(255, 118, 28, 0.06);
    border-radius: 8px;
    display: grid;
    place-items: center;
    transition: all 0.2s ease;
}

.logo-glow {
    position: absolute;
    inset: 0;
    border-radius: 8px;
    background: rgba(255, 118, 28, 0.1);
    filter: blur(4px);
}

.brand-link:hover .logo-container {
    border-color: rgba(255, 118, 28, 0.6);
    background: rgba(255, 118, 28, 0.1);
}

.brand-title {
    font-family: var(--font-mono);
    font-size: 15px;
    font-weight: 700;
    letter-spacing: -0.3px;
    line-height: 1;
}

.brand-subtitle {
    font-family: var(--font-mono);
    font-size: 9px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.2em;
    color: var(--text-secondary);
    margin-top: 3px;
    line-height: 1;
}

.nav-link {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    border-radius: 9999px;
    padding: 8px 14px;
    font-size: 13px;
    font-weight: 500;
    text-decoration: none;
    color: var(--text-secondary);
    transition: all 0.2s ease;
}

.nav-link:hover {
    color: var(--text-primary);
    background: rgba(255, 255, 255, 0.03);
}

.nav-link i {
    font-size: 14px;
    opacity: 0.6;
}

/* Toggle Switch styling */
.switch {
    position: relative;
    display: inline-block;
    width: 32px;
    height: 18px;
}

.switch input {
    opacity: 0;
    width: 0;
    height: 0;
}

.slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(255, 255, 255, 0.1);
    transition: .2s;
    border: 1px solid rgba(255, 255, 255, 0.05);
}

.slider:before {
    position: absolute;
    content: "";
    height: 12px;
    width: 12px;
    left: 2px;
    bottom: 2px;
    background-color: var(--text-primary);
    transition: .2s;
}

input:checked + .slider {
    background-color: var(--primary-accent);
}

input:checked + .slider:before {
    transform: translateX(14px);
    background-color: #030303;
}

.slider.round {
    border-radius: 34px;
}

.slider.round:before {
    border-radius: 50%;
}

/* Pulsing Status Dot */
.live-dot {
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    position: relative;
}

.live-dot.animate-pulse::after {
    content: '';
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
    border-radius: 50%;
    border: 1px solid inherit;
    animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
    opacity: 0.7;
}

@keyframes ping {
    75%, 100% {
        transform: scale(2.5);
        opacity: 0;
    }
}

/* Sparklines styling */
.sparkline-container {
    width: 100%;
    height: 48px;
    position: relative;
}

.sparkline-svg {
    filter: drop-shadow(0 2px 8px rgba(255, 118, 28, 0.2));
}

#svg-bridge {
    filter: drop-shadow(0 2px 8px rgba(14, 165, 233, 0.2));
}

#svg-div {
    filter: drop-shadow(0 2px 8px rgba(36, 161, 7, 0.2));
}

/* Radar & G7 Regime Shield */
.shield-sentinel-display {
    box-shadow: inset 0 0 25px rgba(0,0,0,0.8);
}

.shield-radar-ring {
    position: absolute;
    width: 160px;
    height: 160px;
    border-radius: 50%;
    border: 1px dashed rgba(255, 118, 28, 0.15);
    background: radial-gradient(circle, rgba(255,118,28,0.02) 0%, transparent 70%);
    animation: spin-radar 15s linear infinite;
}

@keyframes spin-radar {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

.sentinel-shield-core {
    color: var(--color-blue);
    text-shadow: 0 0 15px rgba(14, 165, 233, 0.4);
    z-index: 2;
    transition: all 0.3s ease;
}

.sentinel-shield-core.secure-pulse {
    color: var(--color-green);
    text-shadow: 0 0 25px rgba(36, 161, 7, 0.6);
    animation: pulse-secure 2s infinite ease-in-out;
}

.sentinel-shield-core.warning-pulse {
    color: var(--primary-accent);
    text-shadow: 0 0 25px rgba(255, 118, 28, 0.6);
    animation: pulse-warn 1.5s infinite ease-in-out;
}

.sentinel-shield-core.danger-pulse {
    color: var(--color-red);
    text-shadow: 0 0 30px rgba(239, 68, 68, 0.8);
    animation: pulse-danger 0.8s infinite ease-in-out;
}

@keyframes pulse-secure {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.06); }
}

@keyframes pulse-warn {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.09); }
}

@keyframes pulse-danger {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.14); }
}

.regime-buttons-grid .btn.btn-primary {
    background-color: var(--primary-accent) !important;
    color: #030303 !important;
    border-color: var(--primary-accent) !important;
    box-shadow: 0 0 12px rgba(255, 118, 28, 0.3) !important;
}

/* Agent Arena */
.agent-status-indicator {
    display: flex;
    align-items: center;
    justify-content: center;
}

.agent-pulse-ring {
    position: absolute;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    border: 1px solid var(--color-green);
    opacity: 0;
    animation: pulse-ring 2.5s infinite ease-out;
}

#agent-scam .agent-pulse-ring {
    border-color: var(--color-red);
}

@keyframes pulse-ring {
    0% { transform: scale(0.5); opacity: 0.8; }
    100% { transform: scale(1.8); opacity: 0; }
}

.agent-console-lines::-webkit-scrollbar {
    width: 3px;
}
.agent-console-lines::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.05);
}

.agent-console-lines .tx-success {
    color: #4dfa1d;
}

.agent-console-lines .tx-failed {
    color: #ff3344;
}

/* Custom Scrollbar for Event Feed */
#terminal-output::-webkit-scrollbar {
    width: 4px;
}
#terminal-output::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.08);
}
```

- [ ] **Step 2: Save the updated style.css**
Write the complete code block to `d:\dorahack\pharos-market-regime-gate\css\style.css`.

- [ ] **Step 3: Commit**
```bash
git add css/style.css
git commit -m "feat: upgrade style.css for high-fidelity glassmorphic visual cues"
```

---

### Task 3: Update js/app.js
**Files:**
- Modify: `d:\dorahack\pharos-market-regime-gate\js\app.js`

- [ ] **Step 1: Write the updated app.js logic**
Replaces `js/app.js` with the upgraded logic supporting dynamic blocks ticker, responsive SVG sparkline updates, auto-keeper algorithms, risk shocks, and simulated agent terminals.

```javascript
// Deployed Contract configurations on Pharos Atlantic Testnet
const REGISTRY_ADDRESS = '0xbe713906E4D5ac544C069Cd16B2233C979b8AB5a';
const ENGINE_ADDRESS = '0x8A3e25CbB9e07B122fFBD8718eAD597E0dCCF8f4';
const REGIME_GATE_ADDRESS = '0xECF86Cf42d27582FDcc60Eed65F0bB7567c789CF';

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
const liveBlockHeight = document.getElementById('live-block-height');
const liveRegimeStatus = document.getElementById('live-regime-status');
const liveWalletBalance = document.getElementById('live-wallet-balance');

// Sparkline elements
const svgVix = document.getElementById('svg-vix');
const svgBridge = document.getElementById('svg-bridge');
const svgDiv = document.getElementById('svg-div');

// Mock Block Number Ticker Loop (simulating active chain state)
let mockBlockNumber = 188432;
setInterval(() => {
    mockBlockNumber++;
    if (liveBlockHeight) {
        liveBlockHeight.textContent = `#${mockBlockNumber.toLocaleString()}`;
    }
}, 3000);

// Logs terminal helper - Styled like Live Extrinsics
function writeLog(message, type = 'system') {
    if (!terminalOutput) return;
    const div = document.createElement('div');
    div.className = `terminal-line ${type}-msg`;
    const time = new Date().toTimeString().split(' ')[0];
    
    let typeLabel = "SYS";
    if (type === 'error') typeLabel = "ERR";
    if (type === 'success') typeLabel = "OK ";
    if (type === 'info') typeLabel = "INF";
    
    div.innerHTML = `
        <span class="log-time" style="color: var(--text-muted); font-family: var(--font-mono); margin-right: 8px;">${time}</span>
        <span class="log-type" style="color: var(--primary-accent); font-family: var(--font-mono); margin-right: 12px; font-weight: 700;">[${typeLabel}]</span>
        <span class="log-msg">${message}</span>
    `;
    terminalOutput.appendChild(div);
    setTimeout(() => { terminalOutput.scrollTop = terminalOutput.scrollHeight; }, 20);
}

// Draw Sparklines dynamically
function drawSparkline(svgEl, dataPoints, minVal, maxVal) {
    if (!svgEl) return;
    const width = svgEl.clientWidth || 100;
    const height = svgEl.clientHeight || 48;
    
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
    document.getElementById('oracle-bridge-val').innerHTML = `${metrics.bridge.toFixed(1)}M <span class="text-xs text-[#a1a1aa]">/ hr</span>`;
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
    shieldCore.className = 'sentinel-shield-core text-5xl mb-4';
    const labels = ["NORMAL MODE", "VOLATILE MODE", "PANIC MODE"];
    const subheaderLabels = ["NORMAL", "VOLATILE", "PANIC"];
    
    shieldStatusLabel.textContent = labels[regime];
    if (liveRegimeStatus) {
        liveRegimeStatus.textContent = subheaderLabels[regime];
    }
    
    if (regime === 0) {
        shieldCore.classList.add('secure-pulse');
        shieldStatusLabel.style.color = 'var(--color-green)';
        if (liveRegimeStatus) liveRegimeStatus.style.color = 'var(--color-green)';
    } else if (regime === 1) {
        shieldCore.classList.add('warning-pulse');
        shieldStatusLabel.style.color = 'var(--primary-accent)';
        if (liveRegimeStatus) liveRegimeStatus.style.color = 'var(--primary-accent)';
    } else if (regime === 2) {
        shieldCore.classList.add('danger-pulse');
        shieldStatusLabel.style.color = 'var(--color-red)';
        if (liveRegimeStatus) liveRegimeStatus.style.color = 'var(--color-red)';
    }
    
    // Update override buttons selection state
    document.querySelectorAll('.regime-buttons-grid .btn').forEach((btn, idx) => {
        if (idx === regime) {
            btn.className = 'btn py-2 border border-[#ff761c] bg-[#ff761c]/10 text-[#ff761c] text-xs font-bold rounded';
        } else {
            btn.className = 'btn py-2 border border-white/5 hover:border-white/10 hover:bg-white/10 text-xs font-bold rounded text-[#a1a1aa]';
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
            
            // Update balance after transaction
            await queryWalletBalance();
        } catch (err) {
            writeLog(`❌ Web3 transaction failed: ${err.message}`, "error");
        }
    }
}

// Query Wallet Balance on Pharos chain
async function queryWalletBalance() {
    if (!provider || !account) return;
    try {
        const balance = await provider.getBalance(account);
        const formatted = parseFloat(ethers.formatEther(balance)).toFixed(5);
        if (liveWalletBalance) {
            liveWalletBalance.textContent = `${formatted} PHRS`;
        }
    } catch (e) {
        console.error("Error querying balance:", e);
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
        keeperStatusBadge.className = 'keeper-status-badge text-[10px] uppercase font-mono px-2 py-0.5 rounded border border-[#24a107]/30 bg-[#24a107]/10 text-[#24a107]';
        keeperStatusBadge.innerHTML = '<i class="fas fa-robot"></i> Auto-Keeper On';
        writeLog("Auto-Keeper Bot activated. Scanning security parameters...", 'info');
        evaluateAutoKeeper();
    } else {
        keeperStatusBadge.className = 'keeper-status-badge text-[10px] uppercase font-mono px-2 py-0.5 rounded border border-white/10 text-[#a1a1aa]';
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
    dotScam.className = 'agent-status-dot blocked inline-block w-2.5 h-2.5 rounded-full bg-[#ef4444]';
    writeAgentLog('scam', 'Sending swap approve payload...', false);
    writeAgentLog('scam', '❌ Registry check: Phishing blacklisted!', false);
    writeLog('🛡️ [GoPlus API] Scam Target Address intercepted. Blocked transaction.', 'error');

    // 2. DeFi Yield Agent (Uniswap, CertiK 94)
    if (currentRegime === 2) {
        dotYield.className = 'agent-status-dot blocked inline-block w-2.5 h-2.5 rounded-full bg-[#ef4444]';
        writeAgentLog('yield', 'Attempting Uniswap swap...', false);
        writeAgentLog('yield', '❌ Regime Gate: Market panic. Suspended.', false);
        writeLog('🛡️ [Market Regime Gate] DeFi Yield Agent blocked. PANIC REGIME ACTIVE.', 'error');
    } else {
        dotYield.className = 'agent-status-dot active inline-block w-2.5 h-2.5 rounded-full bg-[#24a107]';
        writeAgentLog('yield', 'Checking Slippage limits...');
        writeAgentLog('yield', '✅ Uniswap swap executed successfully. (CertiK: 94)');
        writeLog('🛡️ [ExecutionEngine] DeFi Yield Agent transaction executed successfully.', 'success');
    }

    // 3. Arbitrage Agent (Unrated Pool, CertiK 0)
    if (currentRegime === 2) {
        dotArb.className = 'agent-status-dot blocked inline-block w-2.5 h-2.5 rounded-full bg-[#ef4444]';
        writeAgentLog('arb', 'Attempting pool arbitrage swap...', false);
        writeAgentLog('arb', '❌ Regime Gate: Market panic. Suspended.', false);
        writeLog('🛡️ [Market Regime Gate] Arbitrage Agent blocked. PANIC REGIME ACTIVE.', 'error');
    } else if (currentRegime === 1) {
        dotArb.className = 'agent-status-dot blocked inline-block w-2.5 h-2.5 rounded-full bg-[#ef4444]';
        writeAgentLog('arb', 'Attempting pool arbitrage swap...', false);
        writeAgentLog('arb', '❌ Regime Gate: Volatile restricts unrated targets.', false);
        writeLog('🛡️ [Market Regime Gate] Arbitrage Agent blocked. Target CertiK rating below Volatile state limit (>80).', 'error');
        writeLog('💡 [Anvita Flow Fallback] Actionable RevertDiagnose: Redirecting flow to Uniswap V3.', 'info');
    } else {
        dotArb.className = 'agent-status-dot active inline-block w-2.5 h-2.5 rounded-full bg-[#24a107]';
        writeAgentLog('arb', 'Checking pool registry...');
        writeAgentLog('arb', '✅ Arb trade executed. Profit: 0.12 PHRS');
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

// Clear Terminal button listener
document.getElementById('btn-clear-terminal').addEventListener('click', () => {
    if (terminalOutput) {
        terminalOutput.innerHTML = '';
        writeLog("Security Gate Console cleared.", 'system');
    }
});

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
        
        // Sync balance
        await queryWalletBalance();
        
        mockModeToggle.checked = false;
        walletStatusDot.className = "live-dot bg-[#24a107]";
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
        walletStatusDot.className = "live-dot bg-[#24a107]";
        walletAccount.textContent = "Mock Mode Connected";
        if (liveWalletBalance) {
            liveWalletBalance.textContent = "0.00855 PHRS";
        }
        writeLog("Mock mode active. Sandboxed off-chain logic enabled.", "info");
        startSimulationLoop();
        arenaLoopToggle.checked = true;
    } else {
        if (account) {
            walletStatusDot.className = "live-dot bg-[#24a107]";
            walletAccount.textContent = `${account.slice(0, 6)}...${account.slice(-4)}`;
            queryWalletBalance();
        } else {
            walletStatusDot.className = "live-dot bg-[#52525b]";
            walletAccount.textContent = "Disconnected";
            if (liveWalletBalance) {
                liveWalletBalance.textContent = "0.00000 PHRS";
            }
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

- [ ] **Step 2: Save the updated js/app.js**
Write the complete code block to `d:\dorahack\pharos-market-regime-gate\js\app.js`.

- [ ] **Step 3: Commit**
```bash
git add js/app.js
git commit -m "feat: upgrade app.js logic to support premium dynamic metrics and indicators"
```

---

### Task 4: Verify UI functionality
**Files:**
- Test: Local Browser at `http://localhost:8080`

- [ ] **Step 1: Restart web server to ensure no cache**
Restart Task `task-873` or reload browser tab with Cache Disabled to verify the upgraded interface.

- [ ] **Step 2: Verify visual details**
Ensure background glows are active, glass panels are translucent, G7 Shield displays animated concentric sweep, sparklines render glowing gradients, and agents simulation ticks properly.

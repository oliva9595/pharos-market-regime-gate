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
    writeAgentLog('scam', 'Sending 1.5 PHRS approve swap...', false);
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

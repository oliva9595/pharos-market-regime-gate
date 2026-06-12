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

// Three.js Shield variables
let shieldScene, shieldCamera, shieldRenderer;
let particleSphere, outerRing, innerRing;
let currentShieldColor = 0x24a107; // Default green
let targetShieldColor = 0x24a107;
let baseSpeed = 0.005;
let rotationSpeedFactor = 1.0;

// Scam Agent dendritic tree variables
let dendriteGrowth = 0.1;

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
    document.getElementById('oracle-bridge-val').innerHTML = `${metrics.bridge.toFixed(1)}M <span class="unit-text">/ hr</span>`;
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
    
    // Clear classes safely without wiping static Tailwind/styling classes
    shieldCore.classList.remove('secure-pulse', 'warning-pulse', 'danger-pulse');
    const labels = ["NORMAL MODE", "VOLATILE MODE", "PANIC MODE"];
    const subheaderLabels = ["NORMAL", "VOLATILE", "PANIC"];
    
    shieldStatusLabel.textContent = labels[regime];
    if (liveRegimeStatus) {
        liveRegimeStatus.textContent = subheaderLabels[regime];
    }
    
    if (regime === 0) {
        targetShieldColor = 0x24a107; // green
        rotationSpeedFactor = 1.0;
        shieldCore.classList.add('secure-pulse');
        shieldStatusLabel.style.color = 'var(--color-green)';
        if (liveRegimeStatus) liveRegimeStatus.style.color = 'var(--color-green)';
    } else if (regime === 1) {
        targetShieldColor = 0xff761c; // orange
        rotationSpeedFactor = 2.5;
        shieldCore.classList.add('warning-pulse');
        shieldStatusLabel.style.color = 'var(--primary-accent)';
        if (liveRegimeStatus) liveRegimeStatus.style.color = 'var(--primary-accent)';
    } else if (regime === 2) {
        targetShieldColor = 0xef4444; // red
        rotationSpeedFactor = 6.0;
        shieldCore.classList.add('danger-pulse');
        shieldStatusLabel.style.color = 'var(--color-red)';
        if (liveRegimeStatus) liveRegimeStatus.style.color = 'var(--color-red)';
    }
    
    // Update override buttons selection state safely
    document.querySelectorAll('.regime-buttons-grid .btn').forEach((btn, idx) => {
        if (idx === regime) {
            btn.classList.add('btn-primary');
            btn.classList.remove('btn-secondary');
        } else {
            btn.classList.add('btn-secondary');
            btn.classList.remove('btn-primary');
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
        keeperStatusBadge.classList.add('keeper-active');
        keeperStatusBadge.innerHTML = '<i class="fas fa-robot"></i> Auto-Keeper On';
        writeLog("Auto-Keeper Bot activated. Scanning security parameters...", 'info');
        evaluateAutoKeeper();
    } else {
        keeperStatusBadge.classList.remove('keeper-active');
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

// Helper to safely set agent status dot classes without overwriting layout classes
function setAgentStatus(dotEl, status) {
    if (!dotEl) return;
    dotEl.classList.remove('active', 'blocked', 'warning', 'bg-[#24a107]', 'bg-[#ef4444]', 'bg-[#ff761c]');
    
    if (status === 'active') {
        dotEl.classList.add('active', 'bg-[#24a107]');
    } else if (status === 'blocked') {
        dotEl.classList.add('blocked', 'bg-[#ef4444]');
    } else if (status === 'warning') {
        dotEl.classList.add('warning', 'bg-[#ff761c]');
    }
}

function runAgentSimulationStep() {
    const regimeLabels = ["NORMAL", "VOLATILE", "PANIC"];
    const regime = regimeLabels[currentRegime];

    // Update Agent indicators
    const dotYield = document.querySelector('#agent-yield .agent-status-dot');
    const dotArb = document.querySelector('#agent-arb .agent-status-dot');
    const dotScam = document.querySelector('#agent-scam .agent-status-dot');

    // --- Scam Agent: Multi-gate pipeline ---
    setAgentStatus(dotScam, 'blocked');
    writeAgentLog('scam', `Gate 1: ProtocolRegistry.checkAddress(0x1111...)`, false);
    writeAgentLog('scam', `BLOCKED: Target is blacklisted. Execution halted.`, false);
    writeLog(`[Gate 1] ProtocolRegistry: 0x1111...1254 is BLACKLISTED. GoPlus: phishing_activities=1. Tx rejected.`, 'error');

    // --- Yield Agent: Multi-gate pipeline ---
    writeAgentLog('yield', `Gate 1: ProtocolRegistry.checkAddress(0x7a25...) -> Verified`);
    if (currentRegime === 2) {
        setAgentStatus(dotYield, 'blocked');
        writeAgentLog('yield', `Gate 7: MarketRegimeGate.verifyRegime() -> PANIC`, false);
        writeAgentLog('yield', `BLOCKED: Panic regime halts all executions.`, false);
        writeLog(`[Gate 7] MarketRegimeGate: Regime=${regime}. Yield Agent (CertiK:94) execution suspended.`, 'error');
    } else {
        setAgentStatus(dotYield, 'active');
        writeAgentLog('yield', `Gate 5: SlippageGuard.verifySlippage() -> 0.8% OK`);
        writeAgentLog('yield', `Gate 7: MarketRegimeGate.verifyRegime() -> ${regime} PASS`);
        writeAgentLog('yield', `executeTx() -> Uniswap V2 swap confirmed.`);
        writeLog(`[ExecutionEngine] Yield Agent pipeline: Registry OK -> Slippage 0.8% OK -> Regime ${regime} OK -> Executed.`, 'success');
    }

    // --- Arb Agent: Multi-gate pipeline ---
    writeAgentLog('arb', `Gate 1: ProtocolRegistry.checkAddress(0xUnrated) -> Not verified`);
    if (currentRegime === 2) {
        setAgentStatus(dotArb, 'blocked');
        writeAgentLog('arb', `Gate 7: MarketRegimeGate.verifyRegime() -> PANIC`, false);
        writeAgentLog('arb', `BLOCKED: Panic regime halts all executions.`, false);
        writeLog(`[Gate 7] MarketRegimeGate: Regime=${regime}. Arb Agent (CertiK:0) execution suspended.`, 'error');
    } else if (currentRegime === 1) {
        setAgentStatus(dotArb, 'blocked');
        writeAgentLog('arb', `Gate 7: MarketRegimeGate.verifyRegime() -> VOLATILE`, false);
        writeAgentLog('arb', `BLOCKED: Volatile restricts to verified protocols.`, false);
        writeLog(`[Gate 7] MarketRegimeGate: Regime=VOLATILE. Target CertiK=0 < required 80. Tx reverted.`, 'error');
        writeLog(`[RevertDiagnose] Actionable: Target unverified. Suggest redirect to Uniswap V3 (CertiK:96).`, 'info');
    } else {
        setAgentStatus(dotArb, 'active');
        writeAgentLog('arb', `Gate 5: SlippageGuard.verifySlippage() -> 1.2% OK`);
        writeAgentLog('arb', `Gate 7: MarketRegimeGate.verifyRegime() -> NORMAL PASS`);
        writeAgentLog('arb', `executeTx() -> Arb swap profit: 0.12 PHRS`);
        writeLog(`[ExecutionEngine] Arb Agent pipeline: Registry OK -> Slippage 1.2% OK -> Regime NORMAL OK -> Executed.`, 'success');
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
        walletStatusDot.style.backgroundColor = "var(--color-green)";
        walletStatusDot.style.boxShadow = "0 0 6px var(--color-green)";
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
        walletStatusDot.style.backgroundColor = "var(--color-green)";
        walletStatusDot.style.boxShadow = "0 0 6px var(--color-green)";
        walletAccount.textContent = "Mock Mode Connected";
        if (liveWalletBalance) {
            liveWalletBalance.textContent = "0.00855 PHRS";
        }
        writeLog("Mock mode active. Sandboxed off-chain logic enabled.", "info");
        startSimulationLoop();
        arenaLoopToggle.checked = true;
    } else {
        if (account) {
            walletStatusDot.style.backgroundColor = "var(--color-green)";
            walletStatusDot.style.boxShadow = "0 0 6px var(--color-green)";
            walletAccount.textContent = `${account.slice(0, 6)}...${account.slice(-4)}`;
            queryWalletBalance();
        } else {
            walletStatusDot.style.backgroundColor = "var(--text-muted)";
            walletStatusDot.style.boxShadow = "none";
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

// --- WebGL Shield Gate & Agent Visualizations ---

let shieldPointLight;

function initThreeShield() {
    const container = document.getElementById('shield-display-container');
    const canvas = document.getElementById('shield-3d-canvas');
    if (!container || !canvas) return;

    const width = container.clientWidth || 300;
    const height = container.clientHeight || 220;

    // Scene
    shieldScene = new THREE.Scene();

    // Camera
    shieldCamera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    shieldCamera.position.z = 120;

    // Renderer
    shieldRenderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    shieldRenderer.setSize(width, height);
    shieldRenderer.setPixelRatio(window.devicePixelRatio);

    // Particle Sphere Geometry
    const particleCount = 1000;
    const sphereGeom = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const radius = 25;

    for (let i = 0; i < particleCount; i++) {
        // Random points on sphere surface
        const u = Math.random();
        const v = Math.random();
        const theta = u * 2.0 * Math.PI;
        const phi = Math.acos(2.0 * v - 1.0);
        positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = radius * Math.cos(phi);
    }
    sphereGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // Particle Material
    const pMaterial = new THREE.PointsMaterial({
        color: currentShieldColor,
        size: 1.8,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
    });

    particleSphere = new THREE.Points(sphereGeom, pMaterial);
    shieldScene.add(particleSphere);

    // Flat Scanning Rings
    const innerRingGeom = new THREE.RingGeometry(29, 30, 64);
    const outerRingGeom = new THREE.RingGeometry(35, 36, 64);
    
    const ringMat = new THREE.MeshBasicMaterial({
        color: currentShieldColor,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.25,
        blending: THREE.AdditiveBlending
    });

    innerRing = new THREE.Mesh(innerRingGeom, ringMat);
    outerRing = new THREE.Mesh(outerRingGeom, ringMat);

    innerRing.rotation.x = Math.PI / 2;
    outerRing.rotation.x = Math.PI / 2;

    shieldScene.add(innerRing);
    shieldScene.add(outerRing);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    shieldScene.add(ambientLight);
    
    shieldPointLight = new THREE.PointLight(currentShieldColor, 2, 100);
    shieldPointLight.position.set(0, 0, 50);
    shieldScene.add(shieldPointLight);

    // Resize Handler
    window.addEventListener('resize', () => {
        const w = container.clientWidth || 300;
        const h = container.clientHeight || 220;
        shieldCamera.aspect = w / h;
        shieldCamera.updateProjectionMatrix();
        shieldRenderer.setSize(w, h);
    });

    animateShield();
}

function animateShield() {
    requestAnimationFrame(animateShield);

    // Interpolate colors smoothly
    const speed = 0.05;
    const cCurrent = new THREE.Color(currentShieldColor);
    const cTarget = new THREE.Color(targetShieldColor);
    cCurrent.lerp(cTarget, speed);
    currentShieldColor = cCurrent.getHex();

    // Update colors in materials
    if (particleSphere) particleSphere.material.color.setHex(currentShieldColor);
    if (innerRing) innerRing.material.color.setHex(currentShieldColor);
    if (outerRing) outerRing.material.color.setHex(currentShieldColor);
    if (shieldPointLight) shieldPointLight.color.setHex(currentShieldColor);

    // Rotations
    if (particleSphere) {
        particleSphere.rotation.y += baseSpeed * rotationSpeedFactor;
        particleSphere.rotation.x += baseSpeed * 0.4 * rotationSpeedFactor;
    }
    
    if (innerRing) {
        innerRing.rotation.z -= baseSpeed * 2.0 * rotationSpeedFactor;
    }
    if (outerRing) {
        outerRing.rotation.z += baseSpeed * 0.8 * rotationSpeedFactor;
        outerRing.rotation.y = Math.sin(Date.now() * 0.001) * 0.15;
    }

    if (shieldRenderer && shieldScene && shieldCamera) {
        shieldRenderer.render(shieldScene, shieldCamera);
    }
}

// Canvas metrics drawing hooks
function drawYieldRadar(regime) {
    const canvas = document.getElementById('yield-radar-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width = canvas.clientWidth || 200;
    const h = canvas.height = canvas.clientHeight || 90;
    
    ctx.clearRect(0, 0, w, h);
    const cx = w / 2;
    const cy = h / 2;
    const maxRadius = Math.min(cx, cy) - 10;
    
    // 5-axes: Safety, Yield, Liquidity, Gas, Speed
    const axesValues = [0.88, 0.94, 0.78, 0.85, 0.90];
    
    // Dynamic breathing scale factor
    const breathe = 1.0 + Math.sin(Date.now() * 0.002) * 0.04;
    
    // Draw radar net web (concentric circles/pentagons)
    ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
    ctx.lineWidth = 1;
    for (let j = 1; j <= 4; j++) {
        const radius = (maxRadius * (j / 4)) * breathe;
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const angle = i * (2 * Math.PI / 5) - Math.PI / 2;
            const x = cx + radius * Math.cos(angle);
            const y = cy + radius * Math.sin(angle);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
    }
    
    // Draw web axis lines
    for (let i = 0; i < 5; i++) {
        const angle = i * (2 * Math.PI / 5) - Math.PI / 2;
        const x = cx + maxRadius * Math.cos(angle) * breathe;
        const y = cy + maxRadius * Math.sin(angle) * breathe;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(x, y);
        ctx.stroke();
    }
    
    // Draw active filled value area
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
        const angle = i * (2 * Math.PI / 5) - Math.PI / 2;
        const val = axesValues[i] * (regime === 2 ? 0.2 : (regime === 1 ? 0.6 : 1.0)); // scale values on panic/volatile
        const radius = maxRadius * val * breathe;
        const x = cx + radius * Math.cos(angle);
        const y = cy + radius * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = "rgba(255, 118, 28, 0.15)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 118, 28, 0.8)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
}

function drawArbChart(regime) {
    const canvas = document.getElementById('arb-chart-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width = canvas.clientWidth || 200;
    const h = canvas.height = canvas.clientHeight || 90;
    
    ctx.clearRect(0, 0, w, h);
    
    const time = Date.now() * 0.003;
    const amp = regime === 2 ? 4.0 : (regime === 1 ? 16.0 : 8.0); // Spikes on volatile
    
    // Draw axes
    ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(10, h - 15);
    ctx.lineTo(w - 10, h - 15);
    ctx.stroke();
    
    const pointsA = [];
    const pointsB = [];
    
    for (let x = 10; x < w - 10; x++) {
        const yA = h / 2 + Math.sin(x * 0.03 + time) * amp;
        const yB = h / 2 + Math.cos(x * 0.045 + time * 0.8) * amp * 1.2;
        pointsA.push({ x, y: yA });
        pointsB.push({ x, y: yB });
    }
    
    // Draw intersection fill area (green profit band)
    ctx.fillStyle = "rgba(14, 165, 233, 0.08)";
    ctx.beginPath();
    ctx.moveTo(pointsA[0].x, pointsA[0].y);
    for (let i = 0; i < pointsA.length; i++) {
        ctx.lineTo(pointsA[i].x, pointsA[i].y);
    }
    for (let i = pointsB.length - 1; i >= 0; i--) {
        ctx.lineTo(pointsB[i].x, pointsB[i].y);
    }
    ctx.closePath();
    ctx.fill();
    
    // Draw DEX line
    ctx.strokeStyle = "#0ea5e9";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(pointsA[0].x, pointsA[0].y);
    for (let i = 1; i < pointsA.length; i++) {
        ctx.lineTo(pointsA[i].x, pointsA[i].y);
    }
    ctx.stroke();
    
    // Draw CEX line
    ctx.strokeStyle = "#ff761c";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(pointsB[0].x, pointsB[0].y);
    for (let i = 1; i < pointsB.length; i++) {
        ctx.lineTo(pointsB[i].x, pointsB[i].y);
    }
    ctx.stroke();
}

function drawScamDendrite(regime) {
    const canvas = document.getElementById('scam-dendrite-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width = canvas.clientWidth || 200;
    const h = canvas.height = canvas.clientHeight || 90;
    
    ctx.clearRect(0, 0, w, h);
    
    // Increment growth slowly to animate tree branching out
    dendriteGrowth += 0.005;
    if (dendriteGrowth > 1.0) dendriteGrowth = 0.1; // reset loop
    
    ctx.strokeStyle = "rgba(239, 68, 68, 0.6)";
    ctx.lineWidth = 1.2;
    
    const rootX = w / 2;
    const rootY = h - 5;
    
    function branch(x, y, len, angle, depth) {
        if (depth <= 0) return;
        
        const targetLen = len * dendriteGrowth;
        const x2 = x + targetLen * Math.cos(angle);
        const y2 = y + targetLen * Math.sin(angle);
        
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        
        // Spawn branches
        const subBranchCount = regime === 2 ? 3 : 2; // spreads faster in panic regime
        for (let i = 0; i < subBranchCount; i++) {
            const spread = regime === 2 ? 0.6 : 0.45;
            const newAngle = angle + (Math.random() - 0.5) * spread;
            branch(x2, y2, len * 0.75, newAngle, depth - 1);
        }
    }
    
    // Draw tree recursively
    branch(rootX, rootY, 28, -Math.PI / 2, 5);
}

// Live continuous rendering animation loop for agent cards
function animateAgentArena() {
    requestAnimationFrame(animateAgentArena);
    drawYieldRadar(currentRegime);
    drawArbChart(currentRegime);
    drawScamDendrite(currentRegime);
}

// Initialize
updateOracleDisplay();
updateShieldState(0);
initThreeShield();
animateAgentArena();
startSimulationLoop();

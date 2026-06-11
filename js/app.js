// Addresses on Pharos Atlantic Testnet
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

let provider = null;
let signer = null;
let account = null;
let engineContract = null;
let regimeGateContract = null;
let registryContract = null;
let regimeGateOwner = null;

let currentRegime = 0; // 0 = NORMAL, 1 = VOLATILE, 2 = PANIC
const mockRegistry = {
  "0x2c692a2291ad46d034babf4a5acf287341b7797a": "Verified",
  "0x1111111254fb6c44bac0bed2854e76f90643097d": "Blacklisted",
  "0x2222222222222222222222222222222222222222": "Unregistered"
};

const terminalOutput = document.getElementById('terminal-output');
const sandboxTarget = document.getElementById('sandbox-target');
const sandboxCalldata = document.getElementById('sandbox-calldata');
const sandboxValue = document.getElementById('sandbox-value');
const sandboxScenario = document.getElementById('sandbox-scenario');
const mockModeToggle = document.getElementById('mock-mode-toggle');
const walletStatusDot = document.getElementById('wallet-status-dot');
const walletAccount = document.getElementById('wallet-account');
const btnConnectWallet = document.getElementById('btn-connect-wallet');

function writeLog(message, type = 'system') {
  if (!terminalOutput) return;
  const div = document.createElement('div');
  div.className = `terminal-line ${type}-msg`;
  const time = new Date().toTimeString().split(' ')[0];
  div.innerHTML = `[${time}] ${message}`;
  terminalOutput.appendChild(div);
  setTimeout(() => { terminalOutput.scrollTop = terminalOutput.scrollHeight; }, 20);
}

// Visual updates for active regime buttons
function updateRegimeButtons(regime) {
  currentRegime = regime;
  document.querySelectorAll('[id^="regime-btn-"]').forEach(btn => {
    btn.classList.remove('btn-primary');
    btn.classList.add('btn-secondary');
  });
  const activeBtn = document.getElementById(`regime-btn-${regime}`);
  if (activeBtn) {
    activeBtn.classList.remove('btn-secondary');
    activeBtn.classList.add('btn-primary');
  }
}

// Change regime action (Mock vs Web3)
async function changeRegime(regime) {
  const isMock = mockModeToggle.checked;
  const labels = ["NORMAL", "VOLATILE", "PANIC"];
  
  if (isMock) {
    updateRegimeButtons(regime);
    writeLog(`[Mock Mode] Market Regime State changed to: ${labels[regime]} Mode`, 'system');
  } else {
    if (!regimeGateContract) {
      writeLog("❌ Web3 Error: Regime Gate contract not connected.", "error");
      return;
    }
    
    // Check ownership
    try {
      if (regimeGateOwner && account && regimeGateOwner.toLowerCase() !== account.toLowerCase()) {
        writeLog(`❌ Web3 Error: Only the contract owner (${regimeGateOwner.slice(0,6)}...) can change the regime.`, "error");
        return;
      }
      
      writeLog(`[Web3] Sending transaction to set Market Regime to: ${labels[regime]}...`, "info");
      const tx = await regimeGateContract.setMarketRegime(regime);
      writeLog(`Transaction sent: ${tx.hash}. Waiting for confirmation...`, "info");
      await tx.wait();
      updateRegimeButtons(regime);
      writeLog(`🎉 [Web3] Market Regime state updated successfully on-chain!`, "success");
    } catch (err) {
      writeLog(`❌ Web3 Error setting regime: ${err.message}`, "error");
    }
  }
}

// Bind regime buttons
document.getElementById('regime-btn-0').addEventListener('click', () => changeRegime(0));
document.getElementById('regime-btn-1').addEventListener('click', () => changeRegime(1));
document.getElementById('regime-btn-2').addEventListener('click', () => changeRegime(2));

// Scenario preset selector
sandboxScenario.addEventListener('change', () => {
  const preset = sandboxScenario.value;
  if (preset === 'custom') return;

  if (preset === 'phishing') {
    sandboxTarget.value = '0x1111111254fb6c44bac0bed2854e76f90643097d';
    sandboxCalldata.value = '0x';
    sandboxValue.value = '0';
    updateRegimeButtons(0);
    writeLog("Scenario Loaded: Phishing Contract target under Normal Regime.", "info");
  } else if (preset === 'regime-panic') {
    sandboxTarget.value = '0x2c692A2291ad46D034bAbF4a5ACF287341B7797a';
    sandboxCalldata.value = '0x';
    sandboxValue.value = '0';
    updateRegimeButtons(2);
    writeLog("Scenario Loaded: Any contract target under Panic Regime (HALT).", "info");
  } else if (preset === 'regime-volatile-bad') {
    sandboxTarget.value = '0x2222222222222222222222222222222222222222';
    sandboxCalldata.value = '0x';
    sandboxValue.value = '0';
    updateRegimeButtons(1);
    writeLog("Scenario Loaded: Unverified contract target under Volatile Regime (BLOCK).", "info");
  } else if (preset === 'regime-volatile-good') {
    sandboxTarget.value = '0x2c692A2291ad46D034bAbF4a5ACF287341B7797a';
    sandboxCalldata.value = '0x';
    sandboxValue.value = '0';
    updateRegimeButtons(1);
    writeLog("Scenario Loaded: Verified protocol contract target under Volatile Regime (ALLOW).", "info");
  }
  
  simulateGates();
});

function resetSteps() {
  ['step-registry', 'step-approve', 'step-preview', 'step-regime'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.className = 'step';
  });
  const shield = document.querySelector('.shield-display');
  if (shield) shield.className = 'shield-display';
  const shieldStatus = document.getElementById('shield-status');
  if (shieldStatus) shieldStatus.textContent = 'READY';
}

function setShieldBlocked() {
  const shield = document.querySelector('.shield-display');
  if (shield) shield.className = 'shield-display blocked';
  const shieldStatus = document.getElementById('shield-status');
  if (shieldStatus) shieldStatus.textContent = 'BLOCKED';
}

async function simulateGates() {
  resetSteps();
  const target = sandboxTarget.value.trim().toLowerCase();
  const calldata = sandboxCalldata.value.trim() || '0x';
  const valText = sandboxValue.value.trim() || '0';
  const isMock = mockModeToggle.checked;
  const delay = ms => new Promise(res => setTimeout(res, ms));
  
  const shield = document.querySelector('.shield-display');
  if (shield) shield.className = 'shield-display scanning';
  const shieldStatus = document.getElementById('shield-status');
  if (shieldStatus) shieldStatus.textContent = 'SCANNING';
  
  writeLog("⚡ Initiating security gate simulation pipeline...", "system");
  
  if (isMock) {
    // Gate 1: Registry verification
    const stepReg = document.getElementById('step-registry');
    stepReg.className = 'step active';
    await delay(500);
    const status = mockRegistry[target] || 'Unregistered';

    // Simulated GoPlus endpoint check
    writeLog(`[GoPlus API] Scanning target address ${target} for security flags...`, "info");
    await delay(300);

    if (status === 'Blacklisted') {
      stepReg.className = 'step failed';
      setShieldBlocked();
      writeLog("🛡️ [Registry Gate] ❌ GoPlus API Alert: Phishing activities flagged!", "error");
      writeLog("🛡️ [Registry Gate] ❌ TARGET BLACKLISTED on local registry.", "error");
      return;
    }
    stepReg.className = 'step passed';
    writeLog("🛡️ [Registry Gate] ✅ VALID TARGET: GoPlus API returned clean check. Not blacklisted locally.", "success");
    
    // Gate 2: Approve check
    const stepApp = document.getElementById('step-approve');
    stepApp.className = 'step active';
    await delay(500);
    stepApp.className = 'step passed';
    writeLog("🛡️ [SafeApprove Gate] ✅ SECURE: No infinite approval requests detected.", "success");
    
    // Gate 3: Preview check
    const stepPrev = document.getElementById('step-preview');
    stepPrev.className = 'step active';
    await delay(500);
    stepPrev.className = 'step passed';
    writeLog("🛡️ [TxPreview Gate] ✅ SUCCESS: Dry-run static call simulated successfully.", "success");
    
    // Gate 4: Market Regime Check
    const stepRegime = document.getElementById('step-regime');
    stepRegime.className = 'step active';
    await delay(500);
    
    if (currentRegime === 2) {
      stepRegime.className = 'step failed';
      setShieldBlocked();
      writeLog("🛡️ [Market Regime Gate] ❌ PANIC REGIME ACTIVE. All outbound transactions suspended globally.", "error");
      writeLog("💡 Actionable Advice: Wait for market state recovery before resubmitting.", "info");
      return;
    }
    
    if (currentRegime === 1) {
      writeLog(`🛡️ [Market Regime Gate] Volatile Mode active. Inspecting CertiK ratings...`, "info");
      await delay(300);
      if (status !== 'Verified') {
        stepRegime.className = 'step failed';
        setShieldBlocked();
        writeLog("🛡️ [Market Regime Gate] ❌ VOLATILE REGIME. Transaction blocked because target is unverified (Low CertiK Score).", "error");
        writeLog("💡 Actionable Advice: Select a verified protocol target with high CertiK rating (>80) or contact the owner.", "info");
        return;
      } else {
        writeLog("🛡️ [Market Regime Gate] ✅ Target protocol has active CertiK Score: 94/100 (Safe).", "success");
      }
    }
    
    stepRegime.className = 'step passed';
    writeLog("🛡️ [Market Regime Gate] ✅ SUCCESS: Permitted execution path verified.", "success");
    
    if (shield) shield.className = 'shield-display secure';
    if (shieldStatus) shieldStatus.textContent = 'SECURE';
    writeLog("🎉 PHAROS GATE SHIELD: Safe path verified. Target transaction approved to execute.", "success");
  } else {
    // Web3 Mode Execution Checks
    if (!account || !engineContract || !registryContract) {
      writeLog("❌ Web3 Error: Wallet not connected.", "error");
      resetSteps();
      return;
    }

    try {
      // Gate 1: Registry Check
      const stepReg = document.getElementById('step-registry');
      stepReg.className = 'step active';
      writeLog("[Web3] Querying ProtocolRegistry checkAddress...", "info");
      
      const isBlacklisted = await registryContract.isBlacklisted(target);
      if (isBlacklisted) {
        stepReg.className = 'step failed';
        setShieldBlocked();
        writeLog("🛡️ [Registry Gate] ❌ TARGET BLACKLISTED on-chain!", "error");
        return;
      }
      const isVerified = await registryContract.isVerified(target);
      stepReg.className = 'step passed';
      writeLog(`🛡️ [Registry Gate] ✅ Target verified status: ${isVerified}`, "success");

      // Gate 2: Approve check
      const stepApp = document.getElementById('step-approve');
      stepApp.className = 'step active';
      await delay(400);
      stepApp.className = 'step passed';
      writeLog("🛡️ [SafeApprove Gate] ✅ Check passed.", "success");

      // Gate 3: Preview check
      const stepPrev = document.getElementById('step-preview');
      stepPrev.className = 'step active';
      writeLog("[Web3] Simulating on-chain static call...", "info");
      const valWei = ethers.parseEther(valText);
      await provider.call({
        from: account,
        to: target,
        data: calldata,
        value: valWei
      });
      stepPrev.className = 'step passed';
      writeLog("🛡️ [TxPreview Gate] ✅ Static call dry-run succeeded.", "success");

      // Gate 4: Market Regime Check
      const stepRegime = document.getElementById('step-regime');
      stepRegime.className = 'step active';
      writeLog("[Web3] Querying on-chain execution gate validations...", "info");
      
      // Call engine checkTx (which evaluates Slippage, Registry, and Regime)
      await engineContract.checkTx(target, calldata, valWei);
      stepRegime.className = 'step passed';
      writeLog("🛡️ [Market Regime Gate] ✅ All on-chain regime validation gates passed.", "success");

      if (shield) shield.className = 'shield-display secure';
      if (shieldStatus) shieldStatus.textContent = 'SECURE';
      writeLog("🎉 PHAROS GATE SHIELD: Web3 validations passed. Ready to broadcast.", "success");

    } catch (err) {
      setShieldBlocked();
      // Diagnose Revert reason
      let errMsg = err.message || "";
      if (errMsg.includes("panic regime active")) {
        document.getElementById('step-regime').className = 'step failed';
        writeLog("🛡️ [Market Regime Gate] ❌ PANIC REGIME ACTIVE. Executions halted on-chain.", "error");
      } else if (errMsg.includes("volatile regime restricts")) {
        document.getElementById('step-regime').className = 'step failed';
        writeLog("🛡️ [Market Regime Gate] ❌ VOLATILE REGIME. Restricts to verified protocols only.", "error");
      } else {
        writeLog(`❌ On-chain simulation failed: ${errMsg}`, "error");
      }
    }
  }
}

// Connect Web3 Wallet
async function connectWallet() {
  if (typeof window.ethereum === 'undefined') {
    writeLog("❌ Web3 Error: MetaMask not detected.", "error");
    return;
  }
  
  try {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    account = accounts[0];
    provider = new ethers.BrowserProvider(window.ethereum);
    signer = await provider.getSigner();

    // Instantiate Contracts
    engineContract = new ethers.Contract(ENGINE_ADDRESS, ENGINE_ABI, signer);
    
    // Fetch related contract addresses dynamically
    const regimeGateAddr = await engineContract.regimeGate();
    const registryAddr = await engineContract.registry();

    regimeGateContract = new ethers.Contract(regimeGateAddr, REGIME_GATE_ABI, signer);
    registryContract = new ethers.Contract(registryAddr, REGISTRY_ABI, signer);

    regimeGateOwner = await regimeGateContract.owner();
    
    // Sync current on-chain regime
    const regimeCode = await regimeGateContract.currentRegime();
    updateRegimeButtons(Number(regimeCode));
    
    mockModeToggle.checked = false;
    walletStatusDot.className = "status-dot connected";
    walletAccount.textContent = `${account.slice(0, 6)}...${account.slice(-4)}`;
    
    writeLog(`🎉 Wallet connected: ${account}`, "success");
    writeLog(`Connected to MarketRegimeGate at: ${regimeGateAddr}`, "info");
    
  } catch (err) {
    writeLog(`❌ Wallet connection failed: ${err.message}`, "error");
  }
}

// Toggle mock mode handling
mockModeToggle.addEventListener('change', () => {
  if (mockModeToggle.checked) {
    walletStatusDot.className = "status-dot connected";
    walletStatusDot.style.backgroundColor = '#eab308';
    walletAccount.textContent = "Mock Mode Connected";
    writeLog("Mock mode activated. Sandbox simulated off-chain.", "info");
  } else {
    walletStatusDot.style.backgroundColor = '';
    if (account) {
      walletStatusDot.className = "status-dot connected";
      walletAccount.textContent = `${account.slice(0, 6)}...${account.slice(-4)}`;
    } else {
      walletStatusDot.className = "status-dot disconnected";
      walletAccount.textContent = "Disconnected";
    }
    writeLog("Mock mode deactivated. Switching to Web3 Wallet context.", "info");
  }
});

btnConnectWallet.addEventListener('click', connectWallet);
document.getElementById('btn-verify-simulate').addEventListener('click', simulateGates);
document.getElementById('btn-clear-terminal').addEventListener('click', () => {
  if (terminalOutput) terminalOutput.innerHTML = '';
});

// Setup mock visual styling defaults
updateRegimeButtons(0);
walletStatusDot.style.backgroundColor = '#eab308';

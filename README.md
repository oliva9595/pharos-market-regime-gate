# Pharos Market Regime Gate & Yield Decay Sentinel

> **Execution-readiness infrastructure for autonomous DeFi agents on Pharos Atlantic.**  
> Protect capital from dangerous markets, deteriorating yields, and malicious contracts — before a single transaction fires.

[![Tests](https://img.shields.io/badge/tests-65%20passed-brightgreen)](#local-verification)
[![Contracts](https://img.shields.io/badge/contracts-46%20passed-brightgreen)](#local-verification)
[![Network](https://img.shields.io/badge/network-Pharos%20Atlantic-orange)](https://atlantic.pharosscan.xyz)
[![License](https://img.shields.io/badge/license-MIT-blue)](#)

---

## Table of Contents

- [What This Is](#what-this-is)
- [The Problem It Solves](#the-problem-it-solves)
- [System Architecture](#system-architecture)
- [Decision Flow](#decision-flow)
- [Risk Signals & Scoring](#risk-signals--scoring)
- [Combined Policy Matrix](#combined-policy-matrix)
- [Third-Party Integrations](#third-party-integrations)
- [Smart Contracts (Pharos Atlantic)](#smart-contracts-pharos-atlantic)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [CLI — Full Command Reference](#cli--full-command-reference)
- [SDK — TypeScript/JavaScript](#sdk--typescriptjavascript)
- [MCP Server — AI Agent Integration](#mcp-server--ai-agent-integration)
- [REST API](#rest-api)
- [Dashboard](#dashboard)
- [Environment Variables](#environment-variables)
- [Local Verification](#local-verification)
- [Deployment](#deployment)
- [Limitations](#limitations)

---

## What This Is

**Pharos Market Regime Gate & Yield Decay Sentinel (V2)** is a risk middleware system that autonomous DeFi agents must consult before executing any capital action (deposit, swap, bridge, borrow, or repay).

It operates as a **three-layer safety net**:

| Layer | Question Answered | Example Block |
|---|---|---|
| **Market Regime Gate** | Is the macro environment safe for this class of action? | Panic: bridge outflow + stablecoin depeg → block all risk-increasing txs |
| **Yield Decay Sentinel** | Is this specific opportunity still sustainable? | Decaying: reward APY collapsing → block new deposits |
| **Execution Engine** | Do the calldata, size, slippage, and target pass policy? | Position > $250k in volatile regime → reduce size |

All three checks run **on-chain** in a single `checkAction()` call. Execution only proceeds after the combined policy returns `ALLOW`.

---

## The Problem It Solves

Autonomous DeFi agents operate without human oversight. Without risk middleware, they can:

- Continue depositing into collapsing yield farms long after the APY becomes unsustainable
- Execute swaps during extreme market volatility with wide slippage
- Interact with phishing contracts or blacklisted protocols
- Allocate oversized positions that amplify liquidation risk during panic markets

This system provides **a cryptographically-enforced, on-chain policy layer** that prevents these outcomes. It is not a prediction model — it is an **execution gate**.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         OFF-CHAIN LAYER                             │
│                                                                     │
│  ┌──────────────────┐        ┌──────────────────────────────────┐   │
│  │  Market Adapters │        │       Yield Adapters             │   │
│  │  • Volatility    │        │  • APY (base + incentive)        │   │
│  │  • DEX/CEX spread│        │  • TVL flow (net in/out)         │   │
│  │  • Bridge outflow│        │  • Reward token price decay      │   │
│  │  • Stablecoin    │        │  • Liquidity depth & exit cost   │   │
│  │    depeg score   │        │  • Protocol fee revenue          │   │
│  │  • Oracle conf.  │        │  • Data freshness & confidence   │   │
│  └────────┬─────────┘        └────────────┬─────────────────────┘   │
│           │                               │                         │
│           ▼                               ▼                         │
│  ┌──────────────────┐        ┌─────────────────────┐               │
│  │ Market Classifier│        │ Yield Decay Scorer  │               │
│  │ NORMAL/VOLATILE/ │        │ HEALTHY/WATCH/       │               │
│  │ PANIC            │        │ DECAYING/EXIT        │               │
│  └────────┬─────────┘        └────────────┬─────────┘               │
│           │                               │                         │
│           └─────────┬─────────────────────┘                         │
│                     ▼                                               │
│           ┌──────────────────┐   ┌──────────────────┐              │
│           │ Combined Policy  │──▶│ Sentinel Keeper  │              │
│           │ Engine           │   │ (signs & submits │              │
│           │ ALLOW/RESTRICT/  │   │  risk reports)   │              │
│           │ BLOCK/UNWIND     │   └─────────┬────────┘              │
│           └──────────────────┘             │                        │
│                                            │ signed RiskReport      │
└────────────────────────────────────────────┼────────────────────────┘
                                             │
┌────────────────────────────────────────────┼────────────────────────┐
│                         ON-CHAIN LAYER      │                        │
│                                            ▼                        │
│                              ┌─────────────────────────┐            │
│                              │   RiskReportRegistry    │            │
│                              │  (ECDSA-signed, seq-    │            │
│                              │   protected, timestamped)│            │
│                              └─────────┬───────────────┘            │
│                                        │ getLatestReport()          │
│                         ┌──────────────┼──────────────┐             │
│                         ▼              ▼              ▼             │
│              ┌─────────────────┐ ┌───────────────┐ ┌────────────┐  │
│              │MarketRegimeGateV2│ │YieldDecayGate │ │ProtocolReg.│  │
│              │• confidence ≥60%│ │• per-vault    │ │• whitelist │  │
│              │• regime policy  │ │  policy       │ │• blacklist │  │
│              └────────┬────────┘ └───────┬───────┘ └─────┬──────┘  │
│                       │                  │               │          │
│                       └──────────────────┼───────────────┘          │
│                                          ▼                          │
│                              ┌─────────────────────────┐            │
│                              │    ExecutionEngineV2    │            │
│                              │  checkAction() — view   │            │
│                              │  executeAction() — tx   │            │
│                              │  + SlippageGuard verify │            │
│                              └─────────────────────────┘            │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Decision Flow

The following sequence describes what happens when an agent calls `checkAction()` on `ExecutionEngineV2`:

```
Agent submits ActionContext
{target, actionType, positionUsd, slippageBps, opportunityId}
        │
        ▼
[1] ProtocolRegistry.checkAddress(target)
        │  blacklisted? ──────────────────────────────────► BLOCK
        │  verified / unverified (not blacklisted)
        ▼
[2] MarketRegimeGateV2.checkMarketPolicy()
        │  Reads: RiskReportRegistry.getLatestReport(bytes32(0))
        │  Validates: report not stale, confidence ≥ minConfidenceBps (60%)
        │
        ├─ PANIC   ──────────────────────────────────────► BLOCK
        │           (unless actionType == WITHDRAW or REPAY)
        │
        ├─ VOLATILE + unverified target ─────────────────► BLOCK
        │
        ├─ VOLATILE + verified target ───────────────────► RESTRICT
        │           (max position: $250k, max slippage: 0.5%)
        │
        └─ NORMAL ───────────────────────────────────────► continue
                    (max position: $1M, max slippage: 1%)
        ▼
[3] YieldDecayGate.checkYieldPolicy()
        │  Reads: RiskReportRegistry.getLatestReport(opportunityId)
        │  Skipped if opportunityId == bytes32(0)
        │
        ├─ EXIT     ─────────────────────────────────────► BLOCK
        │           (unless WITHDRAW/REPAY)
        │
        ├─ DECAYING ─────────────────────────────────────► BLOCK
        │           (new deposits only; WITHDRAW allowed)
        │
        ├─ WATCH    ─────────────────────────────────────► RESTRICT
        │           (combined with market: tightest limits apply)
        │
        └─ HEALTHY  ─────────────────────────────────────► continue
        ▼
[4] Position & Slippage Check
        │  positionUsd > maxPosUsd? ──────────────────────► BLOCK
        │  slippageBps > maxSlipBps? ─────────────────────► BLOCK
        ▼
[5] ALLOW — executeAction() fires target.call{value}(data)
        │  SlippageGuard.verifySlippage() validates calldata
        │  (supports: swapExactTokensForTokens,
        │             swapExactETHForTokens,
        │             swapExactTokensForETH)
        ▼
    ExecutionSuccess event emitted
```

---

## Risk Signals & Scoring

### Market Regime Classifier

| Signal | Metric | NORMAL | VOLATILE | PANIC |
|---|---|---|---|---|
| Realized Volatility | VIX-equivalent | < 25 | 25–60 | > 60 |
| DEX/CEX Price Spread | % divergence | < 0.3% | 0.3–2% | > 2% |
| Bridge Net Outflow | USD/hr | < $2M | $2M–$10M | > $10M |
| Stablecoin Depeg | max deviation | < 0.5% | 0.5–2% | > 2% |
| Oracle Confidence | % freshness | > 90% | 70–90% | < 70% |

Hysteresis rules prevent rapid state oscillation — a regime must persist for multiple evaluation cycles before upgrading or downgrading.

### Yield Decay Scorer

| Signal | Weight | Description |
|---|---|---|
| APY trend (7d) | 25% | Declining APY trend penalised |
| Base vs incentive split | 20% | High incentive ratio = unsustainable |
| TVL net flow | 20% | Outflows signal loss of confidence |
| Reward token price decay | 15% | Native reward token weakening |
| Exit slippage cost | 10% | High slippage = low liquidity |
| Protocol fee revenue | 10% | Revenue covers base yield or not |

**Score thresholds:** HEALTHY ≥ 70 · WATCH 40–69 · DECAYING 15–39 · EXIT < 15

---

## Combined Policy Matrix

| Market Regime | Yield State | Action | Result | Limits |
|---|---|---|---|---|
| NORMAL | HEALTHY | DEPOSIT | ✅ ALLOW | $1M / 1% slippage |
| NORMAL | WATCH | DEPOSIT | ⚠️ RESTRICT | $250k / 0.5% slippage |
| NORMAL | DECAYING | DEPOSIT | ❌ BLOCK | — |
| NORMAL | EXIT | WITHDRAW | ✅ ALLOW | — |
| VOLATILE | HEALTHY | DEPOSIT (verified) | ⚠️ RESTRICT | $250k / 0.5% slippage |
| VOLATILE | HEALTHY | DEPOSIT (unverified) | ❌ BLOCK | — |
| PANIC | ANY | DEPOSIT/SWAP/BORROW | ❌ BLOCK | — |
| PANIC | ANY | WITHDRAW/REPAY | ✅ ALLOW | safe unwind path |
| ANY | ANY | Blacklisted target | ❌ BLOCK | — |

---

## Third-Party Integrations

### GoPlus Security API

**Purpose:** Real-time address security scanning to intercept phishing contracts, cybercrime addresses, and known malicious actors before any on-chain interaction.

**Where it runs:** In the JavaScript SDK (`sdk.js`) inside `checkTargetSafety()`. The check runs **before** the on-chain validation layer.

**Flow:**
```
Agent provides target address
        │
        ▼
sdk.checkTargetSafety(target)
        │
        ├─[1] Local contract call: ExecutionEngine.checkTx(target, "0x", 0)
        │      Catches ProtocolRegistry blacklist revert
        │
        └─[2] GoPlus API call (5s timeout, silently skipped on failure):
               GET https://api.gopluslabs.io/api/v1/address_security/{target}?chain_id={chainId}
               │
               ├─ phishing_activities == "1"  ──► goPlusFlagged = true
               ├─ blacklisted == "1"          ──► goPlusFlagged = true
               └─ cybercrime == "1"           ──► goPlusFlagged = true

If isBlacklisted || goPlusFlagged ──► transaction blocked immediately
```

**Resilience:** GoPlus is a soft dependency. If the API is rate-limited, offline, or times out, execution falls back to the on-chain registry check only. The agent is never left unable to execute due to a third-party API outage.

### Pharos Atlantic Testnet

All V2 smart contracts are deployed on the **Pharos Atlantic Testnet** (Chain ID: `688689`).

- **RPC:** `https://atlantic.dplabs-internal.com`
- **Explorer:** `https://atlantic.pharosscan.xyz`
- **Faucet:** Available via the Pharos documentation portal

---

## Smart Contracts (Pharos Atlantic)

| Contract | Address | Role |
|---|---|---|
| `RiskReportRegistry` | `0x9d4454B023096f34B160D6B654540c56A1F81688` | Accepts keeper-signed risk reports |
| `MarketRegimeGateV2` | `0x5eb3Bc0a489C5A8288765d2336659EbCA68FCd00` | Enforces macro market policy |
| `YieldDecayGate` | `0x36C02dA8a0983159322a80FFE9F24b1acfF8B570` | Enforces per-opportunity yield policy |
| `ProtocolRegistryV2` | `0x809d550fca64d94Bd9F66E60752A544199cfAC3D` | Whitelist/blacklist of target contracts |
| `SlippageGuardV2` | `0x4c5859f0F772848b2D91F1D83E2Fe57935348029` | Validates swap calldata slippage |
| `ExecutionEngineV2` | `0x1291Be112d480055DaFd8a610b7d1e203891C274` | Combined policy gate + execution |

**V1 contracts** (`0xbe71...`, `0x8A3e...`, `0xECF8...`) remain deployed and immutable for backwards compatibility. V2 deploys to new addresses.

---

## Project Structure

```
pharos-market-regime-gate/
│
├── src/                          # Solidity smart contracts (V2)
│   ├── RiskReportRegistry.sol    # Signed report store (ECDSA + replay protection)
│   ├── MarketRegimeGateV2.sol    # Market regime enforcement
│   ├── YieldDecayGate.sol        # Yield decay enforcement
│   ├── ExecutionEngineV2.sol     # Combined policy + execution
│   ├── ProtocolRegistry.sol      # Target whitelist/blacklist
│   ├── SlippageGuard.sol         # Swap calldata slippage validation
│   ├── ExecutionEngine.sol       # V1 (kept for compatibility)
│   └── MarketRegimeGate.sol      # V1 (kept for compatibility)
│
├── packages/
│   ├── risk-core/                # Canonical schemas, classifiers, scorer, policy
│   │   └── src/
│   │       ├── schemas.ts        # Zod types: RiskReport, MarketSnapshot, YieldSnapshot
│   │       ├── market-classifier.ts
│   │       ├── yield-decay.ts
│   │       └── policy.ts
│   ├── data-adapters/            # Normalized market/yield snapshot adapters
│   │   └── src/
│   │       ├── market.ts
│   │       └── yield.ts
│   └── sdk/                      # TypeScript SDK (SentinelSdk class)
│       └── src/
│           ├── client.ts         # SentinelSdk class
│           ├── reads.ts          # getLatestReport via RiskReportRegistry
│           ├── writes.ts         # checkAction, executeAction via ExecutionEngineV2
│           └── diagnostics.ts    # Policy failure → actionable advice
│
├── services/
│   ├── keeper/                   # Automated report evaluator and publisher
│   │   └── src/keeper.ts
│   └── api/                      # REST API (Fastify) + SQLite analytics
│       └── src/server.ts
│
├── bin/
│   ├── cli.js                    # pharos-cli command-line tool
│   └── mcp-server.js             # pharos-mcp Model Context Protocol server
│
├── web/                          # Sentinel Command Center dashboard
│   └── index.html
│
├── index.html                    # Main dashboard (root)
├── js/app.js                     # Dashboard frontend logic
├── sdk.js                        # JavaScript SDK (V1 compatible, GoPlus integration)
│
├── test/                         # Foundry tests (Solidity)
│   ├── ExecutionEngineV2.t.sol
│   ├── ExecutionPolicyMatrix.t.sol
│   ├── MarketRegimeGateV2.t.sol
│   ├── YieldDecayGate.t.sol
│   ├── RiskReportRegistry.t.sol
│   ├── SlippageGuard.t.sol
│   ├── SentinelInvariant.t.sol   # Fuzz invariant tests
│   └── integration/SentinelFlow.t.sol
│
├── docs/
│   ├── architecture.md
│   ├── api.md
│   ├── demo-script.md
│   ├── migration-v2.md
│   ├── master-plan.md
│   ├── limitations.md
│   └── security/
│       ├── threat-model.md
│       └── incident-response.md
│
├── deployments/
│   └── atlantic-v2.json          # Deployed contract addresses
├── foundry.toml
├── package.json
└── .env.example
```

---

## Quick Start

### Prerequisites

- Node.js ≥ 18
- [Foundry](https://book.getfoundry.sh/getting-started/installation) (for contract tests)

### Install

```powershell
git clone https://github.com/oliva9595/pharos-market-regime-gate.git
cd pharos-market-regime-gate
npm install
```

### Configure

```powershell
Copy-Item .env.example .env
# Edit .env and fill in your wallet keys and contract addresses
```

Minimum required variables for CLI/SDK/MCP:

```env
PHAROS_RPC_URL=https://atlantic.dplabs-internal.com
ENGINE_ADDRESS=0x1291Be112d480055DaFd8a610b7d1e203891C274
REGISTRY_ADDRESS=0x9d4454B023096f34B160D6B654540c56A1F81688
```

---

## CLI — Full Command Reference

The `pharos-cli` tool provides direct access to all system functions from the terminal.

### Install globally (optional)

```powershell
npm install -g .
# or run directly:
node bin/cli.js <command>
```

---

### `market` — Get current market regime

Fetches the latest signed risk report for the global market and shows the current regime classification.

```powershell
pharos-cli market
```

**Output:**
```
Current Market Regime: NORMAL (Confidence: 9500 BPS)
```

---

### `yield <opportunityId>` — Get yield decay state

Fetches the yield state for a specific vault or opportunity address.

```powershell
pharos-cli yield 0x36C02dA8a0983159322a80FFE9F24b1acfF8B570
```

**Output:**
```
Yield State: HEALTHY (Sequence: 42)
```

---

### `check <target> <actionType> <positionUsd> <slippageBps> [opportunityId]` — Simulate action

Runs an on-chain simulation of a proposed action against the full policy stack (market + yield + position limits + slippage). **No transaction is sent.**

| Parameter | Type | Description | Example |
|---|---|---|---|
| `target` | address | Target contract to call | `0x809d...` |
| `actionType` | string | Action category | `DEPOSIT`, `WITHDRAW`, `SWAP`, `BORROW`, `REPAY` |
| `positionUsd` | number | Position size in USD | `50000` |
| `slippageBps` | number | Slippage tolerance in basis points | `50` (= 0.5%) |
| `opportunityId` | address | Vault/opportunity address (optional) | `0x36C0...` |

```powershell
# Check a $50k deposit to a verified vault (normal regime)
pharos-cli check 0x809d550fca64d94Bd9F66E60752A544199cfAC3D DEPOSIT 50000 50

# Check with yield opportunity
pharos-cli check 0x809d550fca64d94Bd9F66E60752A544199cfAC3D DEPOSIT 50000 50 0x36C02dA8a0983159322a80FFE9F24b1acfF8B570

# Check a withdrawal (safe unwind path, always allowed in panic)
pharos-cli check 0x809d550fca64d94Bd9F66E60752A544199cfAC3D WITHDRAW 10000 100
```

**Allowed output:**
```
✅ Action is ALLOWED under current risk policy.
```

**Blocked output:**
```
❌ Action is BLOCKED: YieldGate: blocked by policy
💡 Recommendation: Opportunity is decaying. Deposits are blocked. Unwind/withdraw to preserve capital.
```

---

### `execute <target> <data> <value> <actionType> <positionUsd> <slippageBps> [opportunityId]` — Execute transaction

Runs the full policy check and, if allowed, sends the transaction through `ExecutionEngineV2.executeAction()`.

Requires `PHAROS_KEEPER_PRIVATE_KEY` or `PHAROS_DEPLOYER_PRIVATE_KEY` in `.env`.

| Parameter | Type | Description | Example |
|---|---|---|---|
| `target` | address | Target contract | `0x809d...` |
| `data` | hex | ABI-encoded calldata | `0x` |
| `value` | string | ETH value in wei | `0` |
| `actionType` | string | Action category | `DEPOSIT` |
| `positionUsd` | number | Position size in USD | `50000` |
| `slippageBps` | number | Slippage in BPS | `50` |
| `opportunityId` | address | Vault address (optional) | `0x36C0...` |

```powershell
pharos-cli execute 0x809d550fca64d94Bd9F66E60752A544199cfAC3D 0x 0 DEPOSIT 50000 50
```

**Success output:**
```
✅ Tx executed successfully! Hash: 0xabc123...
```

---

### `explain <reason>` — Diagnose a policy failure

Translates a raw revert reason or policy failure string into actionable human-readable advice.

```powershell
pharos-cli explain "YieldGate: blocked by policy"
pharos-cli explain "ExecutionEngine: position size exceeds policy limit"
pharos-cli explain "MarketGate: blocked by policy"
```

**Output:**
```
Failure Reason: YieldGate: blocked by policy
Actionable Advice: Opportunity is decaying. Deposits are blocked. Unwind/withdraw to preserve capital.
```

---

### `mcp-start` — Launch MCP server

Starts the Model Context Protocol server (same as `pharos-mcp`).

```powershell
pharos-cli mcp-start
```

---

## SDK — TypeScript/JavaScript

### Install

```powershell
npm install
npm run build
```

The SDK is located in `packages/sdk/`. Import via:

```typescript
import { SentinelSdk } from './packages/sdk/dist/index.js';
// or from Node.js (CommonJS):
const { SentinelSdk } = require('./packages/sdk/dist/index.js');
```

### Initialize

```typescript
const sdk = new SentinelSdk({
  rpcUrl: 'https://atlantic.dplabs-internal.com',
  engineAddress: '0x1291Be112d480055DaFd8a610b7d1e203891C274',
  registryAddress: '0x9d4454B023096f34B160D6B654540c56A1F81688'
});
```

---

### `sdk.getExecutionReadiness(opportunityId)` — Read latest risk report

Fetches the most recent signed report from `RiskReportRegistry`.

- Pass `'0x0000000000000000000000000000000000000000'` for the global market report.
- Pass a vault/opportunity address for yield-specific reports.

```typescript
// Global market report
const market = await sdk.getExecutionReadiness('0x0000000000000000000000000000000000000000');
console.log(market.marketRegime);   // "NORMAL" | "VOLATILE" | "PANIC"
console.log(market.confidenceBps);  // e.g. 9500 (= 95% confidence)

// Yield report for a specific vault
const yield_ = await sdk.getExecutionReadiness('0x36C02dA8a0983159322a80FFE9F24b1acfF8B570');
console.log(yield_.yieldState);     // "HEALTHY" | "WATCH" | "DECAYING" | "EXIT"
console.log(yield_.sequenceNumber); // monotonically increasing
```

**Return type:**
```typescript
{
  reportId: string;
  opportunityId: string;
  marketRegime: "NORMAL" | "VOLATILE" | "PANIC";
  yieldState: "HEALTHY" | "WATCH" | "DECAYING" | "EXIT";
  confidenceBps: number;   // 0–10000 (basis points)
  observedAt: number;      // Unix timestamp
  validUntil: number;      // Unix timestamp (report expiry)
  sequenceNumber: number;
}
```

---

### `sdk.checkAction(ctx)` — Simulate action (read-only)

Calls `ExecutionEngineV2.checkAction()` as a view function. **No gas consumed, no transaction sent.**

```typescript
const result = await sdk.checkAction({
  target: '0x809d550fca64d94Bd9F66E60752A544199cfAC3D',
  actionType: 'DEPOSIT',
  positionUsd: 50000,
  requestedSlippageBps: 50,
  opportunityId: '0x36C02dA8a0983159322a80FFE9F24b1acfF8B570',
  data: '0x',    // optional, defaults to '0x'
  value: 0       // optional, ETH value in wei
});

if (result.allowed) {
  console.log('Proceed with execution');
} else {
  console.log('Blocked:', result.reason);
  console.log('Advice:', result.diagnostics?.recommendation);
}
```

**Return type:**
```typescript
{
  allowed: boolean;
  reason: string;
  diagnostics?: {
    allowed: boolean;
    reason: string;
    recommendation: string;  // human-readable action to take
  }
}
```

---

### `sdk.safeExecuteAction(ctx, walletPrivateKey)` — Execute transaction safely

Runs `checkAction()` first, and only submits the transaction if the policy allows it.

```typescript
const result = await sdk.safeExecuteAction(
  {
    target: '0x809d550fca64d94Bd9F66E60752A544199cfAC3D',
    actionType: 'DEPOSIT',
    positionUsd: 50000,
    requestedSlippageBps: 50,
    opportunityId: '0x36C02dA8a0983159322a80FFE9F24b1acfF8B570',
    data: '0x',
    value: 0
  },
  process.env.PHAROS_KEEPER_PRIVATE_KEY
);

if (result.success) {
  console.log('Transaction hash:', result.txHash);
} else {
  console.log('Blocked:', result.error);
  console.log('Advice:', result.diagnostics?.recommendation);
}
```

**Return type:**
```typescript
{
  success: boolean;
  txHash?: string;
  error?: string;
  diagnostics?: DiagnosticResult;
}
```

---

### `sdk.explainDecision(reason)` — Diagnose a policy failure

Translates a raw revert string into structured advice.

```typescript
const diag = sdk.explainDecision('ExecutionEngine: position size exceeds policy limit');
console.log(diag.recommendation);
// "Requested amount exceeds limits ($250k in volatile/watch, $1M in normal). Reduce transaction size."
```

---

### JavaScript SDK (V1 + GoPlus)

For Node.js scripts using the V1-compatible SDK with built-in GoPlus address scanning:

```javascript
const ExecutionEngineSDK = require('./sdk.js');

const sdk = new ExecutionEngineSDK(
  'https://atlantic.dplabs-internal.com',
  process.env.PHAROS_KEEPER_PRIVATE_KEY,
  '0x1291Be112d480055DaFd8a610b7d1e203891C274'
);

// Check if target address is safe (GoPlus + on-chain registry)
const safety = await sdk.checkTargetSafety('0xTargetAddress');
console.log(safety.isBlacklisted);  // true if GoPlus flags phishing/cybercrime
console.log(safety.goPlusFlagged);  // true if flagged by GoPlus specifically

// Full safe execution pipeline
const receipt = await sdk.safeExecute('0xTargetAddress', '0x', 0n);
```

---

## MCP Server — AI Agent Integration

The `pharos-mcp` server implements the [Model Context Protocol](https://modelcontextprotocol.io/) so AI agents (Claude, GPT-based agents, etc.) can query and act through this risk system as native tools.

### Start the MCP server

```powershell
# Via CLI
pharos-cli mcp-start

# Or directly
node bin/mcp-server.js

# Or via npm binary
npx pharos-mcp
```

The server communicates over **stdio** (standard MCP transport).

### Configure in Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "pharos-sentinel": {
      "command": "node",
      "args": ["path/to/pharos-market-regime-gate/bin/mcp-server.js"],
      "env": {
        "PHAROS_RPC_URL": "https://atlantic.dplabs-internal.com",
        "ENGINE_ADDRESS": "0x1291Be112d480055DaFd8a610b7d1e203891C274",
        "REGISTRY_ADDRESS": "0x9d4454B023096f34B160D6B654540c56A1F81688",
        "PHAROS_KEEPER_PRIVATE_KEY": "your_private_key"
      }
    }
  }
}
```

### Available MCP Tools

#### `get_market_regime`

Fetches the current global market risk state.

```json
// Input: (no parameters)
{}

// Output:
{
  "marketRegime": "NORMAL",
  "confidenceBps": 9500,
  "validUntil": 1718368800,
  "sequenceNumber": 142
}
```

---

#### `get_yield_state`

Fetches yield decay state for a specific opportunity.

```json
// Input:
{ "opportunityId": "0x36C02dA8a0983159322a80FFE9F24b1acfF8B570" }

// Output:
{
  "yieldState": "WATCH",
  "confidenceBps": 8000,
  "sequenceNumber": 87
}
```

---

#### `check_action`

Simulates whether a proposed action would be allowed by the combined policy.

```json
// Input:
{
  "target": "0x809d550fca64d94Bd9F66E60752A544199cfAC3D",
  "actionType": "DEPOSIT",
  "positionUsd": 50000,
  "requestedSlippageBps": 50,
  "opportunityId": "0x36C02dA8a0983159322a80FFE9F24b1acfF8B570"
}

// Output (allowed):
{ "allowed": true, "reason": "" }

// Output (blocked):
{
  "allowed": false,
  "reason": "YieldGate: blocked by policy",
  "diagnostics": {
    "recommendation": "Opportunity is decaying. Deposits are blocked. Unwind/withdraw to preserve capital."
  }
}
```

---

#### `execute_action`

Executes a transaction through `ExecutionEngineV2` after policy validation. Requires keeper private key in environment.

```json
// Input:
{
  "target": "0x809d550fca64d94Bd9F66E60752A544199cfAC3D",
  "actionType": "DEPOSIT",
  "positionUsd": 50000,
  "requestedSlippageBps": 50,
  "data": "0x",
  "value": "0",
  "opportunityId": "0x36C02dA8a0983159322a80FFE9F24b1acfF8B570"
}

// Output:
{ "success": true, "txHash": "0xabc123..." }
```

---

#### `explain_decision`

Converts a revert reason into actionable human-readable advice.

```json
// Input:
{ "reason": "ExecutionEngine: requested slippage exceeds policy limit" }

// Output:
{
  "recommendation": "Slippage parameter is too loose (max 0.5% in volatile/watch, 1% in normal). Tighten slippage."
}
```

---

## REST API

Start the analytics API server:

```powershell
node services/api/dist/server.js
# or in development
npx tsx services/api/src/server.ts
```

Default base URL: `http://localhost:3000`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | API health check |
| `GET` | `/api/market/status` | Current + historical market regime |
| `GET` | `/api/yield/status?opportunityId=0x...` | Yield state + factor scores |
| `GET` | `/api/decisions/history` | Decision receipt log |
| `POST` | `/api/decisions` | Persist a decision receipt |

---

## Dashboard

The **Sentinel Command Center** is a browser dashboard that visualises risk state in real time and provides an Execution Proof Arena for demonstrating all five policy scenarios.

```powershell
npm run demo-web
```

Open `http://localhost:8080/` in your browser.

**Modes:**
- **Mock Mode** (default): Deterministic scenarios with predictable outcomes — safe for demos and presentations.
- **Web3 Mode**: Connect a Pharos Atlantic MetaMask wallet. `checkAction()` reads live on-chain state; `executeAction()` requires explicit wallet confirmation before any transaction is submitted.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `PHAROS_RPC_URL` | ✅ | Pharos Atlantic RPC URL |
| `ENGINE_ADDRESS` | ✅ | `ExecutionEngineV2` contract address |
| `REGISTRY_ADDRESS` | ✅ | `RiskReportRegistry` contract address |
| `PHAROS_KEEPER_PRIVATE_KEY` | For execution | Keeper/reporter wallet private key |
| `PHAROS_DEPLOYER_PRIVATE_KEY` | For deployment | Deployer wallet private key |
| `PORT` | Optional | API server port (default: 3000) |
| `DATABASE_URL` | Optional | SQLite path (default: `file:./db.sqlite`) |

---

## Local Verification

```powershell
# Install dependencies
npm install

# Run TypeScript/JavaScript tests (65 tests)
npm test

# Run Solidity smart contract tests (46 tests, includes fuzz invariants)
npm run test:contracts

# Build TypeScript
npm run build

# Type checking
npm run typecheck

# Secret hygiene check (no private keys committed)
npm run check:secrets

# Verify V2 Atlantic deployment status
npm run check:atlantic
```

**Expected results:**
```
Test Files  15 passed (15)
Tests       65 passed (65)

Ran 11 test suites: 46 tests passed, 0 failed, 0 skipped
```

---

## Deployment

To deploy V2 contracts to a fresh Pharos Atlantic environment:

```powershell
# 1. Configure environment
Copy-Item .env.example .env
# Fill in PHAROS_DEPLOYER_PRIVATE_KEY and PHAROS_KEEPER_PRIVATE_KEY

# 2. Run all checks first
npm test
npm run test:contracts
npm run build
npm run check:secrets

# 3. Deploy V2 contracts
forge script scripts/DeployV2.s.sol:DeployV2 --rpc-url $env:PHAROS_RPC_URL --broadcast

# 4. Configure contract roles and limits
forge script scripts/ConfigureV2.s.sol:ConfigureV2 --rpc-url $env:PHAROS_RPC_URL --broadcast

# 5. Verify deployment
forge script scripts/CheckV2.s.sol:CheckV2 --rpc-url $env:PHAROS_RPC_URL

# 6. Update deployments/atlantic-v2.json and verify
npm run check:atlantic
```

See [`docs/atlantic-v2-deployment.md`](docs/atlantic-v2-deployment.md) for full deployment instructions.

---

## Limitations

- **Testnet only.** Deployed on Pharos Atlantic testnet. Not audited for mainnet use.
- **Oracle dependency.** Keeper must remain operational for reports to stay fresh. Stale reports (past `validUntil`) cause all policy checks to revert, which blocks execution — this is intentional fail-safe behaviour.
- **Mock data in dashboard.** Mock mode uses deterministic scripted scenarios. Yield/market scores are illustrative, not live-fetched.
- **GoPlus is a soft dependency.** If the GoPlus API is unavailable, the system falls back to on-chain registry checks only.
- **Not financial advice.** This is testnet safety middleware. Risk thresholds are illustrative. Do not use for real capital allocation decisions.

---

*Built for the Pharos Atlantic Hackathon. V1 contracts remain live at their original addresses for backwards compatibility.*

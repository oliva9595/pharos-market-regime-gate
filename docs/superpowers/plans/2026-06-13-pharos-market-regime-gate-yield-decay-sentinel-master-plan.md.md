# Pharos Market Regime Gate And Yield Decay Sentinel Master Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the existing Pharos Market Regime Gate project into a complete execution-readiness system that protects autonomous agents from dangerous market regimes and deteriorating yield opportunities, proves policy enforcement on-chain, and provides a detailed interactive dashboard.

**Architecture:** Build two independent risk engines that consume normalized, timestamped, confidence-scored data. The Market Regime Engine classifies systemic conditions as `NORMAL`, `VOLATILE`, or `PANIC`; the Yield Decay Engine classifies each yield opportunity as `HEALTHY`, `WATCH`, `DECAYING`, or `EXIT`. A Combined Policy Engine converts both classifications into `ALLOW`, `RESTRICT`, `BLOCK`, or `UNWIND`, publishes signed risk reports through a keeper, and enforces the resulting policy through upgraded Pharos Atlantic smart contracts.

**Tech Stack:** Solidity 0.8.20, Foundry, OpenZeppelin, Node.js, TypeScript, Ethers.js v6, Zod, Vitest, Fastify, SQLite, HTML5, CSS3, Vanilla JavaScript, MetaMask, Pharos Atlantic Testnet

---

## 1. Product Definition

### Market Regime Gate

Protects agents before they swap, bridge, lend, borrow, or allocate capital during unstable market conditions.

Inputs:

- realized and implied volatility;
- DEX/CEX price divergence;
- bridge net outflow;
- stablecoin depeg;
- market liquidity depth;
- oracle confidence and freshness.

Output:

- `NORMAL`: normal execution policy;
- `VOLATILE`: reduced position size, tighter target allowlist, reduced leverage, and higher safety requirements;
- `PANIC`: block risk-increasing actions and allow only explicitly approved unwind actions.

### Yield Decay Sentinel

Detects yield opportunities whose headline APY is becoming unsustainable because rewards, fees, liquidity, or TVL quality are deteriorating.

Inputs:

- current and historical APY;
- base yield and incentive/reward yield;
- protocol fees and revenue;
- TVL and net liquidity flow;
- liquidity depth and exit slippage;
- reward-token concentration and price decay;
- data freshness and confidence.

Output:

- `HEALTHY`: yield remains supported by durable sources;
- `WATCH`: early deterioration; allow smaller allocation;
- `DECAYING`: block new allocation and recommend reduction;
- `EXIT`: allow only withdrawal/unwind.

### Combined Decision

```text
Market Regime + Yield Quality + Action Type + Target Security
                              |
                              v
              ALLOW / RESTRICT / BLOCK / UNWIND
```

The system must distinguish:

- **market risk**: whether the environment is safe for a class of actions;
- **yield quality risk**: whether a specific opportunity is sustainable;
- **protocol security risk**: whether the target is verified or blacklisted;
- **execution risk**: whether calldata, slippage, size, and route satisfy policy.

## 2. User And Agent Workflows

### Workflow A: Safe Yield Allocation

1. Yield agent requests allocation to a verified vault.
2. System loads fresh market and yield snapshots.
3. Regime is `NORMAL`; yield quality is `HEALTHY`.
4. Combined policy returns `ALLOW`.
5. `ExecutionEngine.executeTx()` performs the allocation.
6. Dashboard displays the decision receipt and transaction link.

### Workflow B: Yield Decay Warning

1. Reward subsidy drops while TVL outflow and reward-token weakness increase.
2. Yield Decay Sentinel changes from `WATCH` to `DECAYING`.
3. New deposits are blocked.
4. Existing position receives a reduce/exit recommendation.
5. Dashboard explains every contributing signal and score.

### Workflow C: Volatile Market Restriction

1. Price divergence or volatility crosses the entry threshold.
2. Regime changes to `VOLATILE` after hysteresis confirmation.
3. Verified targets remain usable under smaller size and tighter slippage.
4. Unverified targets and high-risk actions are blocked.

### Workflow D: Panic And Safe Unwind

1. Bridge outflow, stablecoin depeg, or systemic risk triggers `PANIC`.
2. New swaps, bridges, borrows, and deposits are blocked.
3. Approved withdrawal and debt-repayment actions remain permitted.
4. Recovery to `VOLATILE` or `NORMAL` requires cooldown and exit thresholds.

## 3. Target Architecture

```text
Market Data Adapters          Yield Data Adapters
        |                            |
        v                            v
Market Snapshot Normalizer    Yield Snapshot Normalizer
        |                            |
        v                            v
Market Regime Classifier      Yield Decay Scorer
        |                            |
        +-------------+--------------+
                      v
              Combined Policy Engine
                      |
          +-----------+-----------+
          |                       |
          v                       v
 Signed Risk Report          Decision Explanation
          |                       |
          v                       v
 Keeper / Reporter       API + Dashboard + Agent SDK
          |
          v
 Pharos Atlantic Contracts
 ├── RiskReportRegistry
 ├── MarketRegimeGateV2
 ├── YieldDecayGate
 ├── ProtocolRegistry
 ├── SlippageGuard
 └── ExecutionEngineV2
```

## 4. Canonical Data Models

### Market Snapshot

```ts
interface MarketSnapshot {
  observedAt: number;
  validUntil: number;
  volatilityBps: number;
  priceDivergenceBps: number;
  bridgeNetOutflowUsd: bigint;
  stablecoinDepegBps: number;
  liquidityDepthUsd: bigint;
  confidenceBps: number;
  sourceHash: `0x${string}`;
}
```

### Yield Snapshot

```ts
interface YieldSnapshot {
  opportunityId: `0x${string}`;
  observedAt: number;
  validUntil: number;
  totalApyBps: number;
  baseApyBps: number;
  rewardApyBps: number;
  tvlUsd: bigint;
  netFlowUsd24h: bigint;
  feesUsd24h: bigint;
  liquidityDepthUsd: bigint;
  exitSlippageBps: number;
  rewardTokenChangeBps7d: number;
  confidenceBps: number;
  sourceHash: `0x${string}`;
}
```

### Risk Decision

```ts
type MarketRegime = "NORMAL" | "VOLATILE" | "PANIC";
type YieldState = "HEALTHY" | "WATCH" | "DECAYING" | "EXIT";
type PolicyDecision = "ALLOW" | "RESTRICT" | "BLOCK" | "UNWIND";

interface DecisionReceipt {
  reportId: `0x${string}`;
  opportunityId: `0x${string}`;
  actionType: string;
  marketRegime: MarketRegime;
  yieldState: YieldState;
  decision: PolicyDecision;
  maxPositionUsd: bigint;
  maxSlippageBps: number;
  reasonsHash: `0x${string}`;
  validUntil: number;
}
```

## 5. Classification Rules

### Market Regime Entry Rules

| Signal | Volatile entry | Panic entry |
|---|---:|---:|
| Volatility | `>= 3000 bps` | `>= 4500 bps` |
| Price divergence | `>= 100 bps` | `>= 300 bps` |
| Bridge net outflow | `>= $5M / hour` | `>= $10M / hour` |
| Stablecoin depeg | `>= 50 bps` | `>= 200 bps` |
| Confidence | `< 8000 bps` | `< 6000 bps` or stale |

Rules:

- any panic signal may trigger `PANIC`;
- two volatile signals trigger `VOLATILE`;
- entry requires two consecutive observations except stale-data panic;
- recovery requires three consecutive observations below separate exit thresholds;
- minimum cooldown prevents repeated state flapping.

### Yield Decay Score

Normalize each factor to `0..100` risk:

```text
decayScore =
  25% APY slope risk
  20% subsidy dependency
  20% TVL/net-flow deterioration
  15% fee sustainability risk
  10% exit-liquidity risk
  10% reward-token risk
```

Classifications:

| Score | State | Policy |
|---:|---|---|
| `0-29` | `HEALTHY` | normal allocation |
| `30-49` | `WATCH` | reduce maximum allocation |
| `50-74` | `DECAYING` | block new deposits, recommend reduction |
| `75-100` | `EXIT` | permit only withdrawal/unwind |

Hard overrides:

- stale or low-confidence data cannot produce `HEALTHY`;
- exit slippage above configured maximum forces at least `DECAYING`;
- severe TVL outflow plus subsidy dependency forces `EXIT`;
- yield state recovery also uses hysteresis and cooldown.

## 6. Action Policy Matrix

| Market / Yield | Deposit | Withdraw | Swap | Bridge Out | Borrow | Repay |
|---|---|---|---|---|---|---|
| Normal + Healthy | Allow | Allow | Allow | Allow | Allow | Allow |
| Normal + Watch | Restrict | Allow | Restrict | Restrict | Restrict | Allow |
| Any + Decaying | Block | Allow | Unwind only | Block | Block | Allow |
| Any + Exit | Block | Unwind | Unwind only | Block | Block | Allow |
| Volatile + Healthy | Restrict | Allow | Restrict | Restrict | Restrict | Allow |
| Panic + Any | Block | Unwind | Block except unwind | Block | Block | Allow |

Target security remains an independent gate:

- blacklisted target: always block;
- unverified target: block in `VOLATILE` and `PANIC`;
- verified target: still subject to market, yield, size, and slippage policy.

## 7. Repository Changes

Existing project root:

```text
D:\dorahack\pharos-market-regime-gate
```

Target structure:

```text
src/
├── ProtocolRegistry.sol
├── SlippageGuard.sol
├── RiskReportRegistry.sol
├── MarketRegimeGateV2.sol
├── YieldDecayGate.sol
└── ExecutionEngineV2.sol

packages/
├── risk-core/
├── data-adapters/
└── sdk/

services/
├── keeper/
└── api/

web/
├── index.html
├── css/
└── js/

test/
scripts/
deployments/
docs/
```

The existing `index.html`, `css/style.css`, and `js/app.js` may remain as a legacy demo until the new `web/` application reaches feature parity.

---

### Task 0: Freeze Baseline And Define Migration

**Files:**
- Create: `docs/baseline-audit.md`
- Create: `docs/migration-v2.md`
- Review: `src/*.sol`
- Review: `test/*.t.sol`
- Review: `js/app.js`

- [ ] Record current contract addresses, commit, tests, supported methods, and known limitations.
- [ ] Explicitly document that current Web3 mode only reads/writes regime and does not prove `checkTx`/`executeTx` enforcement.
- [ ] Document the migration rule: existing contracts remain immutable; V2 contracts deploy to new addresses.
- [ ] Run `forge build`, `forge test`, and `npm run demo-web`.
- [ ] Commit with `docs: freeze market regime gate v1 baseline`.

**Acceptance:** V1 behavior and every V2 change are traceable.

### Task 1: Establish TypeScript Workspace And Quality Gates

**Files:**
- Modify: `package.json`
- Create: `tsconfig.base.json`
- Create: `vitest.workspace.ts`
- Create: `.env.example`
- Modify: `.gitignore`

- [ ] Add workspaces for `packages/*` and `services/*`.
- [ ] Add scripts: `build`, `test`, `test:contracts`, `typecheck`, `check:secrets`, and `check:atlantic`.
- [ ] Ensure `.env`, private keys, keeper state, and generated deployment secrets are ignored.
- [ ] Configure strict TypeScript and Vitest.
- [ ] Run clean install, empty workspace build, and secret check.
- [ ] Commit with `chore: establish sentinel v2 workspace`.

**Acceptance:** Solidity and TypeScript tests run from one root command.

### Task 2: Implement Canonical Risk Types And Schemas

**Files:**
- Create: `packages/risk-core/package.json`
- Create: `packages/risk-core/src/types.ts`
- Create: `packages/risk-core/src/schemas.ts`
- Create: `packages/risk-core/src/hashes.ts`
- Create: `packages/risk-core/src/index.ts`
- Test: `packages/risk-core/test/schemas.test.ts`
- Test: `packages/risk-core/test/hashes.test.ts`

- [ ] Write failing tests for every Market Snapshot, Yield Snapshot, and Decision Receipt field.
- [ ] Reject stale timestamps, invalid confidence, impossible APY splits, negative unsigned values, and unknown properties.
- [ ] Implement deterministic hashes for snapshots, reports, reasons, and decision receipts.
- [ ] Add shared enums for market regime, yield state, action type, and policy decision.
- [ ] Run package tests and build.
- [ ] Commit with `feat: add canonical sentinel risk models`.

**Acceptance:** Identical inputs always produce identical validated models and hashes.

### Task 3: Implement Market Data Adapters And Normalization

**Files:**
- Create: `packages/data-adapters/src/market/types.ts`
- Create: `packages/data-adapters/src/market/mock.ts`
- Create: `packages/data-adapters/src/market/http.ts`
- Create: `packages/data-adapters/src/market/normalize.ts`
- Test: `packages/data-adapters/test/market.test.ts`

- [ ] Implement deterministic mock data for demo scenarios.
- [ ] Implement configurable HTTP adapters without hard-coding API secrets.
- [ ] Normalize units to BPS, USD integers, and Unix timestamps.
- [ ] Calculate source freshness and aggregate confidence.
- [ ] Reject insufficient, stale, malformed, and contradictory inputs.
- [ ] Commit with `feat: add normalized market data pipeline`.

**Acceptance:** Classifier receives one canonical Market Snapshot regardless of source.

### Task 4: Implement Yield Data Adapters And Historical Store

**Files:**
- Create: `packages/data-adapters/src/yield/types.ts`
- Create: `packages/data-adapters/src/yield/mock.ts`
- Create: `packages/data-adapters/src/yield/http.ts`
- Create: `packages/data-adapters/src/yield/normalize.ts`
- Create: `packages/data-adapters/src/yield/history.ts`
- Test: `packages/data-adapters/test/yield.test.ts`

- [ ] Normalize APY decomposition, TVL, fees, flow, liquidity, exit slippage, and reward-token change.
- [ ] Store bounded historical observations per opportunity.
- [ ] Calculate APY slope over 1-day, 7-day, and 30-day windows.
- [ ] Detect missing history and reduce confidence instead of inventing data.
- [ ] Provide deterministic scenarios: healthy, subsidy collapse, mercenary TVL, fee collapse, and liquidity exit.
- [ ] Commit with `feat: add yield quality data pipeline`.

**Acceptance:** Yield scoring can explain current values and historical trends.

### Task 5: Implement Market Regime Classifier

**Files:**
- Create: `packages/risk-core/src/market/classifier.ts`
- Create: `packages/risk-core/src/market/hysteresis.ts`
- Create: `packages/risk-core/src/market/reasons.ts`
- Test: `packages/risk-core/test/market-classifier.test.ts`

- [ ] Test all entry thresholds, boundaries, multi-signal rules, stale-data panic, recovery thresholds, and cooldown.
- [ ] Implement pure deterministic classification.
- [ ] Return contributing signals, severity, confidence, and next eligible transition time.
- [ ] Ensure random UI fluctuations cannot cause rapid regime switching.
- [ ] Commit with `feat: add explainable market regime classifier`.

**Acceptance:** Every regime transition is reproducible and includes machine-readable reasons.

### Task 6: Implement Yield Decay Scorer

**Files:**
- Create: `packages/risk-core/src/yield/scorer.ts`
- Create: `packages/risk-core/src/yield/factors.ts`
- Create: `packages/risk-core/src/yield/hysteresis.ts`
- Create: `packages/risk-core/src/yield/reasons.ts`
- Test: `packages/risk-core/test/yield-decay.test.ts`

- [ ] Test each weighted factor independently.
- [ ] Test hard overrides, confidence downgrade, classification boundaries, and recovery cooldown.
- [ ] Implement base-yield versus reward-subsidy decomposition.
- [ ] Return score, state, factors, confidence, trend, and recommended action.
- [ ] Commit with `feat: add explainable yield decay sentinel`.

**Acceptance:** A user can see exactly why a yield opportunity is healthy, decaying, or exit-only.

### Task 7: Implement Combined Policy Engine

**Files:**
- Create: `packages/risk-core/src/policy/matrix.ts`
- Create: `packages/risk-core/src/policy/evaluate.ts`
- Create: `packages/risk-core/src/policy/limits.ts`
- Test: `packages/risk-core/test/policy.test.ts`

- [ ] Encode the complete action policy matrix.
- [ ] Apply independent blacklist/verification rules.
- [ ] Calculate restrictions including maximum position size and maximum slippage.
- [ ] Preserve safe unwind and repay actions during panic.
- [ ] Return structured decision reasons and a deterministic Decision Receipt.
- [ ] Commit with `feat: add combined execution readiness policy`.

**Acceptance:** Every supported action has a deterministic outcome for every regime/yield/security combination.

### Task 8: Implement On-Chain Risk Report Registry

**Files:**
- Create: `src/RiskReportRegistry.sol`
- Test: `test/RiskReportRegistry.t.sol`

- [ ] Define report struct containing hashes, classifications, confidence, validity, reporter, and sequence number.
- [ ] Add authorized reporter roles and reporter rotation.
- [ ] Reject stale, expired, replayed, wrong-sequence, and malformed reports.
- [ ] Emit complete indexed report events.
- [ ] Add emergency pause for report ingestion without changing historical reports.
- [ ] Commit with `feat: add signed risk report registry`.

**Acceptance:** On-chain gates consume only fresh reports from authorized reporters.

### Task 9: Implement MarketRegimeGateV2 And YieldDecayGate

**Files:**
- Create: `src/MarketRegimeGateV2.sol`
- Create: `src/YieldDecayGate.sol`
- Test: `test/MarketRegimeGateV2.t.sol`
- Test: `test/YieldDecayGate.t.sol`

- [ ] Make both gates read fresh reports from RiskReportRegistry.
- [ ] Market gate must distinguish risk-increasing actions from unwind actions.
- [ ] Yield gate must evaluate a specific `opportunityId`.
- [ ] Reject unknown action types, stale reports, low-confidence reports, blocked actions, and excessive limits.
- [ ] Return policy limits for allowed/restricted execution.
- [ ] Commit with `feat: add on-chain market and yield gates`.

**Acceptance:** Neither gate relies on a manually selected local UI state.

### Task 10: Implement ExecutionEngineV2

**Files:**
- Create: `src/ExecutionEngineV2.sol`
- Test: `test/ExecutionEngineV2.t.sol`
- Test: `test/ExecutionPolicyMatrix.t.sol`

- [ ] Define action context: target, calldata, value, action type, opportunity ID, position USD, and requested slippage.
- [ ] Run ProtocolRegistry, SlippageGuard, MarketRegimeGateV2, and YieldDecayGate before execution.
- [ ] Add `checkAction()` for simulation and `executeAction()` for authorized execution.
- [ ] Emit decision/report IDs and execution outcome.
- [ ] Prove blacklisted, volatile, panic, decaying, exit-only, and safe-unwind cases.
- [ ] Commit with `feat: enforce combined risk policy on chain`.

**Acceptance:** Live Web3 demo can prove both allowed and reverted transactions on Atlantic.

### Task 11: Harden Existing ProtocolRegistry And SlippageGuard

**Files:**
- Modify: `src/ProtocolRegistry.sol`
- Modify: `src/SlippageGuard.sol`
- Test: `test/ProtocolRegistry.t.sol`
- Test: `test/SlippageGuard.t.sol`

- [ ] Add zero-address checks, explicit events, target metadata hash, and controlled status transitions.
- [ ] Replace fragile selector/data decoding with explicit supported-route validation.
- [ ] Reject malformed calldata and zero minimum output.
- [ ] Apply policy-provided maximum slippage rather than one global value.
- [ ] Commit with `fix: harden registry and slippage enforcement`.

**Acceptance:** Malformed or unsupported calls fail safely before target execution.

### Task 12: Implement Keeper And Reporter Service

**Files:**
- Create: `services/keeper/src/config.ts`
- Create: `services/keeper/src/collector.ts`
- Create: `services/keeper/src/evaluator.ts`
- Create: `services/keeper/src/reporter.ts`
- Create: `services/keeper/src/queue.ts`
- Create: `services/keeper/src/index.ts`
- Test: `services/keeper/test/*.test.ts`

- [ ] Load private key only from local environment and never expose it.
- [ ] Collect normalized snapshots, classify risks, evaluate policy metadata, and publish reports.
- [ ] Add nonce-safe transaction queue, simulation, retry, backoff, and idempotency.
- [ ] Enforce cooldown, freshness, minimum confidence, and report sequence.
- [ ] Add dry-run mode and deterministic mock scenarios.
- [ ] Commit with `feat: add automated sentinel keeper`.

**Acceptance:** Keeper updates on-chain reports without MetaMask interaction or rapid state flapping.

### Task 13: Implement Read API And Historical Analytics

**Files:**
- Create: `services/api/src/server.ts`
- Create: `services/api/src/routes/market.ts`
- Create: `services/api/src/routes/yield.ts`
- Create: `services/api/src/routes/decisions.ts`
- Create: `services/api/src/store.ts`
- Test: `services/api/test/*.test.ts`

- [ ] Persist bounded market snapshots, yield snapshots, classifications, reports, and decisions.
- [ ] Expose current and historical market/yield state.
- [ ] Expose factor explanations, confidence, freshness, and explorer links.
- [ ] Add CORS allowlist, request limits, health endpoint, and structured safe errors.
- [ ] Commit with `feat: add sentinel analytics api`.

**Acceptance:** Dashboard can render all explanations without reconstructing them from random local state.

### Task 14: Implement Agent SDK And MCP/CLI Integration

**Files:**
- Create: `packages/sdk/src/client.ts`
- Create: `packages/sdk/src/reads.ts`
- Create: `packages/sdk/src/writes.ts`
- Create: `packages/sdk/src/diagnostics.ts`
- Modify: `bin/cli.js`
- Modify: `bin/mcp-server.js`
- Modify: `SKILL.md`
- Test: `packages/sdk/test/*.test.ts`

- [ ] Add `getExecutionReadiness`, `checkAction`, `safeExecuteAction`, and `explainDecision`.
- [ ] Decode gate reverts into actionable agent responses.
- [ ] Return alternatives: reduce size, tighten slippage, use verified target, wait, or unwind.
- [ ] Update CLI/MCP commands for market, yield, report, check, execute, and explain.
- [ ] Commit with `feat: expose market and yield guard sdk`.

**Acceptance:** An AI agent can make safe decisions without reading dashboard-specific logic.

### Task 15: Redesign Dashboard Information Architecture

**Files:**
- Create: `web/index.html`
- Create: `web/css/styles.css`
- Create: `web/js/config.js`
- Create: `web/js/api.js`
- Create: `web/js/wallet.js`
- Create: `web/js/state.js`

- [ ] Build separate sections for Market Regime and Yield Decay instead of presenting one generic yield agent.
- [ ] Add global readiness banner showing combined decision.
- [ ] Add freshness, confidence, report ID, block, network, and contract status.
- [ ] Add accessible responsive layout, keyboard focus states, loading, empty, stale, and error states.
- [ ] Never use unsanitized `innerHTML` for provider/API messages.
- [ ] Commit with `feat: build sentinel command center shell`.

**Acceptance:** Users can immediately distinguish market risk, yield quality, protocol security, and final execution policy.

### Task 16: Build Market Regime Dashboard

**Files:**
- Create: `web/js/market.js`
- Create: `web/js/charts/market.js`
- Modify: `web/index.html`
- Modify: `web/css/styles.css`

- [ ] Display every market signal, threshold, trend, confidence, and freshness.
- [ ] Visualize entry thresholds, exit thresholds, hysteresis progress, and cooldown.
- [ ] Add deterministic shock scenarios: volatility, divergence, bridge panic, depeg, stale oracle, and recovery.
- [ ] Show on-chain report and current gate state.
- [ ] Commit with `feat: add explainable market regime dashboard`.

**Acceptance:** A viewer can explain why the regime changed and why it has or has not recovered.

### Task 17: Build Yield Decay Dashboard

**Files:**
- Create: `web/js/yield.js`
- Create: `web/js/charts/yield.js`
- Modify: `web/index.html`
- Modify: `web/css/styles.css`

- [ ] Display total/base/reward APY decomposition and historical APY.
- [ ] Display subsidy dependency, TVL flow, fees, liquidity, exit slippage, and reward-token trend.
- [ ] Show weighted factor contributions to decay score.
- [ ] Add opportunity comparison and deterministic decay scenarios.
- [ ] Show recommended action and policy consequence.
- [ ] Commit with `feat: add yield decay sentinel dashboard`.

**Acceptance:** Yield Decay Sentinel is a first-class product capability, not merely an agent card.

### Task 18: Build Real Execution Proof Arena

**Files:**
- Create: `web/js/execution.js`
- Create: `web/js/scenarios.js`
- Modify: `web/index.html`
- Modify: `web/css/styles.css`

- [ ] Keep mock scenarios for repeatable presentation.
- [ ] In Web3 mode, call `checkAction()` and optionally `executeAction()` instead of disabling the arena.
- [ ] Show action context, combined policy, reason codes, report ID, simulation result, transaction hash, and explorer link.
- [ ] Demonstrate safe allocation, volatile restriction, decay block, panic block, and safe unwind.
- [ ] Require explicit MetaMask confirmation for client transactions.
- [ ] Commit with `feat: prove sentinel enforcement on chain`.

**Acceptance:** Web3 mode visibly proves that the contracts allow or revert each scenario.

### Task 19: Add Automated Frontend And Integration Tests

**Files:**
- Create: `web/test/market.test.js`
- Create: `web/test/yield.test.js`
- Create: `web/test/policy.test.js`
- Create: `web/test/security.test.js`
- Create: `test/integration/SentinelFlow.t.sol`

- [ ] Test classification rendering, stale data, wrong network, unavailable API, and wallet rejection.
- [ ] Test log rendering against HTML injection.
- [ ] Test action enablement against policy prerequisites.
- [ ] Test full contract flow from report publication through check and execute/revert.
- [ ] Commit with `test: cover sentinel dashboard and enforcement`.

**Acceptance:** Core safety behavior no longer depends on manual browser inspection.

### Task 20: Add Atlantic V2 Deployment Tooling

**Files:**
- Create: `scripts/DeployV2.s.sol`
- Create: `scripts/ConfigureV2.s.sol`
- Create: `scripts/CheckV2.s.sol`
- Create: `deployments/atlantic-v2.json`
- Create: `.env.example`
- Create: `docs/atlantic-v2-deployment.md`

- [ ] Use a new V2 deployer/reporter wallet and never commit its key.
- [ ] Deploy RiskReportRegistry, both gates, hardened supporting contracts, and ExecutionEngineV2.
- [ ] Configure reporter authorization, target verification, action selectors, and execution authorization.
- [ ] Write a sanitized public deployment manifest.
- [ ] Verify chain ID, bytecode, ownership, configuration, and reporter balance.
- [ ] Commit with `feat: add Atlantic sentinel v2 deployment`.

**Acceptance:** V2 deployment is reproducible and does not silently reuse obsolete V1 addresses.

### Task 21: Deploy And Execute Atlantic Acceptance Scenarios

**Public Pharos Atlantic configuration:**

```text
Network: Pharos Atlantic
Chain ID: 688689
Native token: PHRS
RPC: https://atlantic.dplabs-internal.com
Explorer: https://atlantic.pharosscan.xyz
```

**Files:**
- Create: `docs/atlantic-v2-runbook.md`
- Create: `docs/atlantic-v2-acceptance.md`

- [ ] Fund new deployer/reporter and demo client wallets with test PHRS.
- [ ] Deploy and verify V2 contracts.
- [ ] Run keeper in deterministic demo mode and publish reports.
- [ ] Execute five real scenarios: safe yield, volatile restriction, yield decay block, panic block, and safe unwind.
- [ ] Record report IDs, decisions, transaction hashes, reverts, block numbers, and explorer links.
- [ ] Reconcile on-chain state with API and dashboard display.
- [ ] Commit with `feat: deploy and verify sentinel v2 on Atlantic`.

**Acceptance:** Every core product claim is supported by a real Atlantic transaction or deterministic on-chain revert.

### Task 22: Security Hardening And Operations

**Files:**
- Create: `docs/security/threat-model.md`
- Create: `docs/security/keeper-key-management.md`
- Create: `docs/security/incident-response.md`
- Create: `docs/operations/runbook.md`
- Create: `test/SentinelInvariant.t.sol`

- [ ] Threat-model malicious reporter, stale data, compromised source, policy bypass, malformed calldata, replay, and frontend injection.
- [ ] Fuzz report sequence, expiry, classifications, action types, size limits, and slippage limits.
- [ ] Add alerts for stale reports, low confidence, reporter balance, transaction failure, and rapid state changes.
- [ ] Add emergency pause procedures that preserve safe unwind where possible.
- [ ] Move owner/reporter roles to separated wallets or multisig before public beta.
- [ ] Commit with `test: harden sentinel v2 operations`.

**Acceptance:** No known path allows a stale, unauthorized, or malformed report to authorize unsafe execution.

### Task 23: Final Documentation And Demo Package

**Files:**
- Modify: `README.md`
- Modify: `SKILL.md`
- Create: `docs/architecture.md`
- Create: `docs/demo-script.md`
- Create: `docs/api.md`
- Create: `docs/limitations.md`

- [ ] Explain the difference between Market Regime Gate, Yield Decay Sentinel, Protocol Registry, and Execution Engine.
- [ ] Document every metric, threshold, score, decision, and recovery rule.
- [ ] Document mock versus live data clearly.
- [ ] Add a concise demo script covering five Atlantic scenarios.
- [ ] Publish current limitations and explicitly avoid claiming production-grade financial advice.
- [ ] Commit with `docs: complete sentinel v2 demo package`.

**Acceptance:** A reviewer can understand, run, verify, and explain the complete system without hidden assumptions.

## 8. Required Test Matrix

| Layer | Required coverage |
|---|---|
| Market classifier | thresholds, boundaries, multi-signal rules, stale data, hysteresis, cooldown |
| Yield scorer | all factors, weights, hard overrides, missing history, recovery |
| Policy engine | every action across all market/yield/security combinations |
| Smart contracts | authorization, freshness, replay, malformed reports, policy enforcement |
| Keeper | nonce queue, retry, idempotency, low balance, failed RPC |
| API | validation, history, rate limit, CORS, safe errors |
| SDK | reads, checks, execution, diagnostics, alternative actions |
| Dashboard | stale/error states, wallet/network, safe rendering, responsive layout |
| Atlantic | allow, restrict, decay block, panic block, safe unwind |

## 9. Definition Of Done

The project is complete only when:

- Market Regime Gate and Yield Decay Sentinel are independently implemented and visibly separated;
- classifications use normalized, fresh, confidence-scored data;
- hysteresis and cooldown prevent regime/state flapping;
- combined policy distinguishes allow, restrict, block, and unwind;
- Web3 mode calls real `checkAction()` and `executeAction()` paths;
- Atlantic transactions prove both successful execution and expected reverts;
- dashboard explains every decision and displays report/transaction provenance;
- automated tests cover classifiers, policy, contracts, services, SDK, and frontend;
- no secret is tracked or exposed to the browser;
- security review finds no unresolved critical or high-severity issue.

## 10. Recommended Execution Order

Execute in this order:

1. Tasks 0-2: freeze V1 and establish canonical V2 foundations.
2. Tasks 3-7: build both risk engines and the combined policy.
3. Tasks 8-11: implement on-chain enforcement and harden supporting gates.
4. Tasks 12-14: build keeper, API, SDK, CLI, and MCP integrations.
5. Tasks 15-19: build and automatically test the complete dashboard.
6. Tasks 20-21: deploy and prove V2 on Pharos Atlantic.
7. Tasks 22-23: complete security, operations, documentation, and demo readiness.

Do not begin Atlantic V2 deployment until all local tests pass and entirely new V2 deployer/reporter credentials are configured locally.

# Pharos Market Regime Gate And Yield Decay Sentinel

An execution-readiness system for autonomous agents on Pharos Atlantic. It combines systemic market risk, opportunity-specific yield quality, target security, and execution limits before capital moves.

## Decisions

- Market Regime Gate: `NORMAL`, `VOLATILE`, or `PANIC`
- Yield Decay Sentinel: `HEALTHY`, `WATCH`, `DECAYING`, or `EXIT`
- Combined policy: `ALLOW`, `RESTRICT`, `BLOCK`, or `UNWIND`

`ExecutionEngineV2` enforces target verification, market policy, yield policy, position limits, and slippage limits. Safe withdrawal and repay paths remain available during dangerous regimes where policy permits.

## Components

| Component | Responsibility |
|---|---|
| `packages/risk-core` | Canonical schemas, classifiers, scoring, policy |
| `packages/data-adapters` | Normalized market/yield snapshots and history |
| `services/keeper` | Automated report evaluation and publication |
| `services/api` | Read API and bounded analytics history |
| `packages/sdk` | Agent checks, safe execution, diagnostics |
| `src/RiskReportRegistry.sol` | Fresh signed report registry |
| `src/MarketRegimeGateV2.sol` | Systemic market enforcement |
| `src/YieldDecayGate.sol` | Opportunity-specific yield enforcement |
| `src/ExecutionEngineV2.sol` | Combined on-chain action enforcement |
| `web/` | Explainable command center and execution proof arena |

## Local Verification

```powershell
npm install
npm test
npm run build
npm run typecheck
npm run test:contracts
npm run check:secrets
```

Run the dashboard:

```powershell
npm run demo-web
```

Open `http://localhost:8080/web/`.

## Mock Versus Live

Mock mode uses deterministic scenarios for repeatable demonstrations. Web3 mode calls `ExecutionEngineV2.checkAction()` and, after explicit wallet confirmation, `executeAction()`.

The existing public addresses in `web/js/config.js` are V1 placeholders until a new V2 deployment is completed. `deployments/atlantic-v2.json` is authoritative for V2 deployment status.

## Documentation

- [Architecture](docs/architecture.md)
- [API](docs/api.md)
- [Demo script](docs/demo-script.md)
- [Atlantic deployment](docs/atlantic-v2-deployment.md)
- [Security threat model](docs/security/threat-model.md)
- [Limitations](docs/limitations.md)

This is testnet safety middleware and not production-grade financial advice.

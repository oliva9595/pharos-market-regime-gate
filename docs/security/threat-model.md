# Sentinel V2 Threat Model

## Assets And Trust Boundaries

Protected assets are agent funds, reporter authority, policy integrity, report history, and execution provenance. External data sources, browser wallets, RPC endpoints, API clients, and target contracts are untrusted.

## Primary Threats

| Threat | Control |
|---|---|
| Compromised reporter | Separate reporter wallet, rotation, pause, sequence monitoring |
| Stale or replayed report | Validity window, monotonic sequence, signature verification |
| Malformed classification | Enum and confidence bounds, gate validation |
| Blacklisted or unverified target | Independent ProtocolRegistry enforcement |
| Oversized/slippage-heavy action | ExecutionEngineV2 policy limits and SlippageGuard |
| Panic policy bypass | Contract-level market and yield gates; safe unwind only |
| Frontend injection | `textContent` rendering and structured action-context validation |
| RPC/API failure | Stale/error states; fail closed for live execution |

Residual risk includes compromised authorized owner keys, malicious verified targets, incorrect source data with high reported confidence, and unsupported calldata routes.

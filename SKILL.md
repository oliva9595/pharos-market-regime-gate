# Pharos Sentinel Agent Skill

Use the Sentinel before an agent deposits, withdraws, swaps, bridges, borrows, repays, or allocates capital.

## Required Flow

1. Call `getExecutionReadiness` for current market/yield status.
2. Build a complete action context: target, calldata, value, action type, opportunity ID, position USD, and requested slippage.
3. Call `checkAction`.
4. If allowed, call `safeExecuteAction`; otherwise use `explainDecision`.
5. Follow alternatives: reduce size, tighten slippage, use a verified target, wait for fresh reports, or safely unwind.

## Decision Handling

- `ALLOW`: execute within returned limits.
- `RESTRICT`: reduce size/slippage before executing.
- `BLOCK`: do not submit the risk-increasing action.
- `UNWIND`: only use approved withdrawal or repayment paths.

Never treat dashboard mock results as on-chain proof. Require a fresh report ID and transaction receipt for live claims.

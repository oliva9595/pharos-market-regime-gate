# Pharos Market Regime Gate V2 Migration Plan

This document outlines the migration rules and V2 upgrades for Pharos Market Regime Gate and Yield Decay Sentinel.

## Migration Principles

### Immutable V1 Contracts
- The original V1 contracts deployed on the Pharos Atlantic Testnet will remain untouched and immutable:
  - `ProtocolRegistry`: `0xbe713906E4D5ac544C069Cd16B2233C979b8AB5a`
  - `ExecutionEngine`: `0x8A3e25CbB9e07B122fFBD8718eAD597E0dCCF8f4`
  - `MarketRegimeGate`: `0xECF86Cf42d27582FDcc60Eed65F0bB7567c789CF`

### V2 Deployment Strategy
- All upgraded V2 smart contracts will be deployed to new addresses:
  - `RiskReportRegistry`
  - `MarketRegimeGateV2`
  - `YieldDecayGate`
  - `ExecutionEngineV2`
- Hardened supporting contracts (`ProtocolRegistry` and `SlippageGuard`) will also be redeployed for V2 integration.
- The new frontend dashboard and keeper services will be configured to point to these V2 addresses, preventing any disruption to existing V1 integrations.

## V2 Architectural Enhancements
1. **Cryptographic Proofs**: Instead of direct state variables set by owner transactions, the V2 gates query `RiskReportRegistry` which accepts keeper-signed snapshots.
2. **Yield Decay Engine**: Introduces the Yield Decay Gate checking opportunity sustainability on-chain.
3. **Execution Readiness**: `ExecutionEngineV2` checks action contextual parameters (size, slippage, target security) and runs simulations prior to execution.

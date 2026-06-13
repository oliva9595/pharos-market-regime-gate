# Architecture

```mermaid
flowchart TD
  M[Market adapters] --> MN[Market normalization]
  Y[Yield adapters] --> YN[Yield normalization and history]
  MN --> MC[Market regime classifier]
  YN --> YS[Yield decay scorer]
  MC --> P[Combined policy engine]
  YS --> P
  P --> K[Keeper / reporter]
  P --> API[Read API and SDK]
  K --> R[RiskReportRegistry]
  R --> MG[MarketRegimeGateV2]
  R --> YG[YieldDecayGate]
  MG --> E[ExecutionEngineV2]
  YG --> E
  PR[ProtocolRegistry] --> E
  SG[SlippageGuard] --> E
  API --> D[Dashboard and agents]
```

Market risk asks whether the environment is safe. Yield quality asks whether a specific opportunity is sustainable. Protocol security asks whether the target is trusted. Execution risk checks calldata, size, route, and slippage.

Reports are signed, time-bounded, confidence-scored, and sequence-protected. Contracts remain immutable; V2 deploys to new addresses.

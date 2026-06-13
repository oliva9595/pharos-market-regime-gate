export type MarketRegime = "NORMAL" | "VOLATILE" | "PANIC";
export type YieldState = "HEALTHY" | "WATCH" | "DECAYING" | "EXIT";
export type PolicyDecision = "ALLOW" | "RESTRICT" | "BLOCK" | "UNWIND";

export interface MarketSnapshot {
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

export interface YieldSnapshot {
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

export interface DecisionReceipt {
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

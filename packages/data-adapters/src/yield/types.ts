export interface RawYieldData {
  opportunityId: string;
  timestamp: number;
  totalApyRate: number; // e.g. 0.12 for 12%
  baseApyRate: number; // e.g. 0.08 for 8%
  rewardApyRate: number; // e.g. 0.04 for 4%
  tvlUsd: string | number;
  netFlowUsd24h: string | number;
  feesUsd24h: string | number;
  liquidityDepthUsd: string | number;
  exitSlippageRate: number; // e.g. 0.005 for 50 bps
  rewardTokenPriceChange7d: number; // e.g. -0.15 for -15%
  oracleConfidence: number; // e.g. 0.90 for 90%
  source: string;
}

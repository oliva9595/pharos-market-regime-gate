import { RawYieldData } from './types.js';

export function getMockYieldData(
  scenario: 'HEALTHY' | 'SUBSIDY_COLLAPSE' | 'MERCENARY_TVL' | 'FEE_COLLAPSE' | 'LIQUIDITY_EXIT',
  opportunityId = '0xbe713906E4D5ac544C069Cd16B2233C979b8AB5a'
): RawYieldData {
  const now = Math.floor(Date.now() / 1000);
  switch (scenario) {
    case 'HEALTHY':
      return {
        opportunityId,
        timestamp: now,
        totalApyRate: 0.12, // 12%
        baseApyRate: 0.10, // 10%
        rewardApyRate: 0.02, // 2%
        tvlUsd: "10000000", // 10M
        netFlowUsd24h: "50000", // positive
        feesUsd24h: "5000", // solid fees
        liquidityDepthUsd: "2000000",
        exitSlippageRate: 0.001, // 10 bps
        rewardTokenPriceChange7d: 0.02, // positive
        oracleConfidence: 0.95,
        source: "Pharos Vault Yield Oracle"
      };
    case 'SUBSIDY_COLLAPSE':
      return {
        opportunityId,
        timestamp: now,
        totalApyRate: 0.03, // 3%
        baseApyRate: 0.02, // 2%
        rewardApyRate: 0.01, // 1% (dropped significantly from 10% reward yield)
        tvlUsd: "8000000",
        netFlowUsd24h: "-1000000", // heavy outflow
        feesUsd24h: "1000",
        liquidityDepthUsd: "1500000",
        exitSlippageRate: 0.005,
        rewardTokenPriceChange7d: -0.45, // reward token down 45%
        oracleConfidence: 0.90,
        source: "Pharos Vault Yield Oracle"
      };
    case 'MERCENARY_TVL':
      return {
        opportunityId,
        timestamp: now,
        totalApyRate: 0.15,
        baseApyRate: 0.03,
        rewardApyRate: 0.12, // high subsidy
        tvlUsd: "5000000", // TVL halved
        netFlowUsd24h: "-2500000", // massive outflow (50% of TVL in 24h)
        feesUsd24h: "800",
        liquidityDepthUsd: "1000000",
        exitSlippageRate: 0.008,
        rewardTokenPriceChange7d: -0.30,
        oracleConfidence: 0.92,
        source: "Pharos Vault Yield Oracle"
      };
    case 'FEE_COLLAPSE':
      return {
        opportunityId,
        timestamp: now,
        totalApyRate: 0.05,
        baseApyRate: 0.04,
        rewardApyRate: 0.01,
        tvlUsd: "9000000",
        netFlowUsd24h: "-100000",
        feesUsd24h: "50", // fees collapsed to $50
        liquidityDepthUsd: "1800000",
        exitSlippageRate: 0.0015,
        rewardTokenPriceChange7d: -0.05,
        oracleConfidence: 0.95,
        source: "Pharos Vault Yield Oracle"
      };
    case 'LIQUIDITY_EXIT':
      return {
        opportunityId,
        timestamp: now,
        totalApyRate: 0.10,
        baseApyRate: 0.08,
        rewardApyRate: 0.02,
        tvlUsd: "7000000",
        netFlowUsd24h: "-1500000",
        feesUsd24h: "3000",
        liquidityDepthUsd: "200000", // liquidity depth collapsed
        exitSlippageRate: 0.065, // 6.5% exit slippage! (650 bps)
        rewardTokenPriceChange7d: -0.10,
        oracleConfidence: 0.90,
        source: "Pharos Vault Yield Oracle"
      };
  }
}

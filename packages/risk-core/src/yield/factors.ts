import { YieldSnapshot } from '../types.js';

export interface YieldFactorScores {
  apySlopeRisk: number;
  subsidyDependency: number;
  tvlNetFlow: number;
  feeSustainability: number;
  exitLiquidity: number;
  rewardToken: number;
}

export function calculateYieldFactorScores(
  snap: YieldSnapshot,
  apySlope: number | null
): YieldFactorScores {
  // 1. APY Slope Risk (25%)
  let apySlopeRisk = 0;
  if (apySlope === null) {
    apySlopeRisk = 50; // default to neutral/unknown
  } else if (apySlope < 0) {
    // scale: -50 bps/day is 100 risk
    apySlopeRisk = Math.min(100, Math.round(Math.abs(apySlope) * 2));
  }

  // 2. Subsidy Dependency Risk (20%)
  let subsidyDependency = 0;
  if (snap.totalApyBps > 0) {
    const subsidyRatio = snap.rewardApyBps / snap.totalApyBps;
    // scale: 80% or more is 100 risk
    subsidyDependency = Math.min(100, Math.round(subsidyRatio * 125));
  }

  // 3. TVL/Net-Flow Deterioration Risk (20%)
  let tvlNetFlow = 0;
  if (snap.tvlUsd > 0n && snap.netFlowUsd24h < 0n) {
    // Net outflow: netFlowUsd24h is negative
    const outflow = -snap.netFlowUsd24h;
    const outflowRatio = Number(outflow) / Number(snap.tvlUsd);
    // scale: 20% outflow in 24h is 100 risk
    tvlNetFlow = Math.min(100, Math.round(outflowRatio * 500));
  }

  // 4. Fee Sustainability Risk (15%)
  let feeSustainability = 100;
  if (snap.tvlUsd > 0n) {
    // Annualized fees ratio
    const annualizedFees = snap.feesUsd24h * 365n;
    const feesRatio = Number(annualizedFees) / Number(snap.tvlUsd);
    // >= 5% is 0 risk, <= 1% is 100 risk
    if (feesRatio >= 0.05) {
      feeSustainability = 0;
    } else if (feesRatio <= 0.01) {
      feeSustainability = 100;
    } else {
      feeSustainability = Math.max(0, Math.min(100, Math.round(((0.05 - feesRatio) / 0.04) * 100)));
    }
  }

  // 5. Exit Liquidity Risk (10%)
  let exitLiquidity = 0;
  // exitSlippageBps: <= 10 bps is 0 risk, >= 300 bps is 100 risk
  if (snap.exitSlippageBps <= 10) {
    exitLiquidity = 0;
  } else if (snap.exitSlippageBps >= 300) {
    exitLiquidity = 100;
  } else {
    exitLiquidity = Math.max(0, Math.min(100, Math.round(((snap.exitSlippageBps - 10) / 290) * 100)));
  }

  // 6. Reward Token Risk (10%)
  let rewardToken = 0;
  if (snap.rewardTokenChangeBps7d < 0) {
    // scale: -3000 bps (-30%) is 100 risk
    rewardToken = Math.min(100, Math.round(Math.abs(snap.rewardTokenChangeBps7d) / 3000 * 100));
  }

  return {
    apySlopeRisk,
    subsidyDependency,
    tvlNetFlow,
    feeSustainability,
    exitLiquidity,
    rewardToken
  };
}

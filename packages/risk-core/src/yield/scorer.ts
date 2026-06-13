import { YieldSnapshot, YieldState } from '../types.js';
import { YieldRiskReasons } from './reasons.js';
import { calculateYieldFactorScores, YieldFactorScores } from './factors.js';
import { getBaseYieldState } from './hysteresis.js';
import { hashReasons } from '../hashes.js';

export interface YieldScoringResult {
  opportunityId: `0x${string}`;
  decayScore: number;
  yieldState: YieldState;
  factors: YieldFactorScores;
  reasons: string[];
  reasonsHash: `0x${string}`;
  transitionEligibleAt: number;
}

export interface YieldScorerConfig {
  cooldownSeconds: number; // minimum time between state transitions
}

export function evaluateYieldDecay(
  snapshot: YieldSnapshot,
  apySlope: number | null,
  previousResult?: YieldScoringResult,
  config: YieldScorerConfig = { cooldownSeconds: 60 },
  currentTime: number = Math.floor(Date.now() / 1000)
): YieldScoringResult {
  const oppId = snapshot.opportunityId;
  const factors = calculateYieldFactorScores(snapshot, apySlope);

  // Calculate weighted decayScore
  // 25% APY slope, 20% subsidy, 20% TVL net flow, 15% fee sustainability, 10% exit liquidity, 10% reward token
  const rawScore = 
    0.25 * factors.apySlopeRisk +
    0.20 * factors.subsidyDependency +
    0.20 * factors.tvlNetFlow +
    0.15 * factors.feeSustainability +
    0.10 * factors.exitLiquidity +
    0.10 * factors.rewardToken;
  
  const decayScore = Math.round(rawScore);
  
  let baseState = getBaseYieldState(decayScore);
  const reasons: string[] = [];

  // Capture contributing factor reasons (risk score >= 50 is a trigger)
  if (factors.apySlopeRisk >= 50) reasons.push(YieldRiskReasons.APY_DECAYING);
  if (factors.subsidyDependency >= 50) reasons.push(YieldRiskReasons.HIGH_SUBSIDY_DEPENDENCY);
  if (factors.tvlNetFlow >= 50) reasons.push(YieldRiskReasons.HIGH_TVL_OUTFLOW);
  if (factors.feeSustainability >= 50) reasons.push(YieldRiskReasons.LOW_FEE_SUSTAINABILITY);
  if (factors.exitLiquidity >= 50) reasons.push(YieldRiskReasons.HIGH_EXIT_SLIPPAGE);
  if (factors.rewardToken >= 50) reasons.push(YieldRiskReasons.REWARD_TOKEN_DECAY);

  const prevRegime = previousResult?.yieldState ?? "HEALTHY";

  // Check if we are in cooldown
  let isCooldownActive = false;
  if (previousResult && currentTime < previousResult.transitionEligibleAt) {
    isCooldownActive = true;
  }

  // --- HARD OVERRIDES ---

  // 1. Stale data: forces EXIT, overrides cooldown
  if (currentTime > snapshot.validUntil) {
    const staleReasons = [YieldRiskReasons.YIELD_STALE];
    return {
      opportunityId: oppId,
      decayScore: 100,
      yieldState: "EXIT",
      factors,
      reasons: staleReasons,
      reasonsHash: hashReasons(staleReasons),
      transitionEligibleAt: currentTime + config.cooldownSeconds
    };
  }

  // 2. Severe TVL outflow (>=15%) + subsidy dependency (>=50%): forces EXIT, overrides cooldown
  let severeOutflowAndSubsidy = false;
  if (snapshot.tvlUsd > 0n && snapshot.netFlowUsd24h < 0n) {
    const outflowRatio = Number(-snapshot.netFlowUsd24h) / Number(snapshot.tvlUsd);
    const subsidyRatio = snapshot.totalApyBps > 0 ? snapshot.rewardApyBps / snapshot.totalApyBps : 0;
    if (outflowRatio >= 0.15 && subsidyRatio >= 0.50) {
      severeOutflowAndSubsidy = true;
      baseState = "EXIT";
      reasons.push(YieldRiskReasons.SUBSIDY_COLLAPSE_OUTFLOW);
    }
  }

  // 3. Exit slippage above maximum (>= 500 bps): forces at least DECAYING
  if (snapshot.exitSlippageBps >= 500) {
    if (baseState === "HEALTHY" || baseState === "WATCH") {
      baseState = "DECAYING";
    }
    reasons.push(YieldRiskReasons.HIGH_EXIT_SLIPPAGE);
  }

  // 4. Low-confidence data (< 7000 bps): cannot produce HEALTHY (forces at least WATCH)
  if (snapshot.confidenceBps < 7000) {
    if (baseState === "HEALTHY") {
      baseState = "WATCH";
    }
    reasons.push(YieldRiskReasons.LOW_CONFIDENCE);
  }

  // If in cooldown and the override didn't force a critical state, preserve the old state
  if (isCooldownActive && !severeOutflowAndSubsidy && baseState !== "EXIT") {
    // If previous state is EXIT, but raw is now WATCH, block the transition due to cooldown
    return {
      ...previousResult!,
      factors, // update factors in receipt
      decayScore
    };
  }

  // Determine transition eligibility time if the state actually changes
  const stateChanged = baseState !== prevRegime;
  const transitionEligibleAt = stateChanged
    ? currentTime + config.cooldownSeconds
    : (previousResult?.transitionEligibleAt ?? 0);

  return {
    opportunityId: oppId,
    decayScore,
    yieldState: baseState,
    factors,
    reasons,
    reasonsHash: hashReasons(reasons),
    transitionEligibleAt
  };
}

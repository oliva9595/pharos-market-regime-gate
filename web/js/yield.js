import { hashReasons } from './market.js';

export const YieldRiskReasons = {
  YIELD_STALE: "YIELD_STALE",
  LOW_CONFIDENCE: "LOW_CONFIDENCE",
  HIGH_EXIT_SLIPPAGE: "HIGH_EXIT_SLIPPAGE",
  SUBSIDY_COLLAPSE_OUTFLOW: "SUBSIDY_COLLAPSE_OUTFLOW",
  APY_DECAYING: "APY_DECAYING",
  HIGH_SUBSIDY_DEPENDENCY: "HIGH_SUBSIDY_DEPENDENCY",
  HIGH_TVL_OUTFLOW: "HIGH_TVL_OUTFLOW",
  LOW_FEE_SUSTAINABILITY: "LOW_FEE_SUSTAINABILITY",
  REWARD_TOKEN_DECAY: "REWARD_TOKEN_DECAY"
};

const ReasonDescriptions = {
  YIELD_STALE: "Yield Oracle Stale: Yield data feed is stale (invalid timestamp)",
  LOW_CONFIDENCE: "Oracle Alert: Yield confidence level < 70% (7000 bps)",
  HIGH_EXIT_SLIPPAGE: "High Exit Slippage: Slippage is >= 5.0% (500 bps)",
  SUBSIDY_COLLAPSE_OUTFLOW: "Subsidy Collapse: Outflow >= 15% with >= 50% reward dependency",
  APY_DECAYING: "APY Decay: Yield rate is declining rapidly",
  HIGH_SUBSIDY_DEPENDENCY: "Incentive Dependency: Yield is heavily dependent on reward subsidies (>80%)",
  HIGH_TVL_OUTFLOW: "TVL Capital Outflow: Heavy TVL outflow (>20% in 24h)",
  LOW_FEE_SUSTAINABILITY: "Revenue Risk: Organic fees are insufficient to sustain yield (<1% of TVL)",
  REWARD_TOKEN_DECAY: "Token Collapse: Reward token price is dropping (>30% in 7d)"
};

export function getHumanReadableYieldReason(reasonCode) {
  return ReasonDescriptions[reasonCode] || reasonCode;
}

export const YieldThresholds = {
  HEALTHY_MAX: 29,
  WATCH_MAX: 49,
  DECAYING_MAX: 74,
  EXIT_MAX: 100
};

export function getBaseYieldState(score) {
  if (score <= YieldThresholds.HEALTHY_MAX) return "HEALTHY";
  if (score <= YieldThresholds.WATCH_MAX) return "WATCH";
  if (score <= YieldThresholds.DECAYING_MAX) return "DECAYING";
  return "EXIT";
}

const parseBigInt = (val) => {
  if (val === undefined || val === null) return 0n;
  if (typeof val === 'bigint') return val;
  if (typeof val === 'string') {
    if (val.endsWith('n')) {
      return BigInt(val.slice(0, -1));
    }
    try {
      return BigInt(val);
    } catch {
      const num = Number(val);
      return isNaN(num) ? 0n : BigInt(Math.floor(num));
    }
  }
  if (typeof val === 'number') {
    return BigInt(Math.floor(val));
  }
  return 0n;
};

export function calculateYieldFactorScores(snap, apySlope) {
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
  const tvlN = parseBigInt(snap.tvlUsd);
  const flowN = parseBigInt(snap.netFlowUsd24h);
  if (tvlN > 0n && flowN < 0n) {
    const outflow = -flowN;
    const outflowRatio = Number(outflow) / Number(tvlN);
    // scale: 20% outflow in 24h is 100 risk
    tvlNetFlow = Math.min(100, Math.round(outflowRatio * 500));
  }

  // 4. Fee Sustainability Risk (15%)
  let feeSustainability = 100;
  const feesN = parseBigInt(snap.feesUsd24h);
  if (tvlN > 0n) {
    const annualizedFees = feesN * 365n;
    const feesRatio = Number(annualizedFees) / Number(tvlN);
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

export function calculateApySlope(history, windowSeconds) {
  if (!history || history.length < 2) return null;

  const latest = history[history.length - 1];
  const earliestAllowed = latest.observedAt - windowSeconds;

  // Find the snapshot closest to earliestAllowed
  let baseline = null;
  for (let i = history.length - 2; i >= 0; i--) {
    if (history[i].observedAt <= earliestAllowed) {
      baseline = history[i];
      break;
    }
  }

  // If we have no observation before the window, check if we have enough total span (at least 1 hour)
  if (!baseline) {
    baseline = history[0];
  }

  const timeDiff = latest.observedAt - baseline.observedAt;
  if (timeDiff < 3600) {
    // Less than 1 hour of total data span is insufficient
    return null;
  }

  const apyDiff = latest.totalApyBps - baseline.totalApyBps;
  const secondsInDay = 86400;
  
  return (apyDiff / timeDiff) * secondsInDay;
}

export function classifyYieldState(
  snapshots,
  previousResult,
  config = { cooldownSeconds: 60 },
  currentTime = Math.floor(Date.now() / 1000)
) {
  if (!snapshots || snapshots.length === 0) {
    return {
      opportunityId: '0x0000000000000000000000000000000000000000',
      decayScore: 0,
      yieldState: "HEALTHY",
      factors: {
        apySlopeRisk: 0,
        subsidyDependency: 0,
        tvlNetFlow: 0,
        feeSustainability: 100,
        exitLiquidity: 0,
        rewardToken: 0
      },
      reasons: [],
      reasonsHash: hashReasons([]),
      transitionEligibleAt: 0
    };
  }

  const latest = snapshots[snapshots.length - 1];
  const oppId = latest.opportunityId;
  const slope = calculateApySlope(snapshots, 86400);
  const factors = calculateYieldFactorScores(latest, slope);

  const rawScore = 
    0.25 * factors.apySlopeRisk +
    0.20 * factors.subsidyDependency +
    0.20 * factors.tvlNetFlow +
    0.15 * factors.feeSustainability +
    0.10 * factors.exitLiquidity +
    0.10 * factors.rewardToken;
  
  const decayScore = Math.round(rawScore);
  let baseState = getBaseYieldState(decayScore);
  const reasons = [];

  // Capture contributing factor reasons
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
  if (currentTime > latest.validUntil) {
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
  const tvlN = parseBigInt(latest.tvlUsd);
  const flowN = parseBigInt(latest.netFlowUsd24h);
  if (tvlN > 0n && flowN < 0n) {
    const outflowRatio = Number(-flowN) / Number(tvlN);
    const subsidyRatio = latest.totalApyBps > 0 ? latest.rewardApyBps / latest.totalApyBps : 0;
    if (outflowRatio >= 0.15 && subsidyRatio >= 0.50) {
      severeOutflowAndSubsidy = true;
      baseState = "EXIT";
      reasons.push(YieldRiskReasons.SUBSIDY_COLLAPSE_OUTFLOW);
    }
  }

  // 3. Exit slippage above maximum (>= 500 bps): forces at least DECAYING
  if (latest.exitSlippageBps >= 500) {
    if (baseState === "HEALTHY" || baseState === "WATCH") {
      baseState = "DECAYING";
    }
    reasons.push(YieldRiskReasons.HIGH_EXIT_SLIPPAGE);
  }

  // 4. Low-confidence data (< 7000 bps): cannot produce HEALTHY (forces at least WATCH)
  if (latest.confidenceBps < 7000) {
    if (baseState === "HEALTHY") {
      baseState = "WATCH";
    }
    reasons.push(YieldRiskReasons.LOW_CONFIDENCE);
  }

  // If in cooldown and the override didn't force a critical state, preserve the old state
  if (isCooldownActive && !severeOutflowAndSubsidy && baseState !== "EXIT") {
    return {
      ...previousResult,
      factors,
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
    reasons: [...new Set(reasons)], // de-duplicate
    reasonsHash: hashReasons(reasons),
    transitionEligibleAt
  };
}

export function computeYieldHysteresisState(history, currentState, transitionEligibleAt, currentTime) {
  if (!history || history.length === 0) {
    return { steps: "", message: "System initializing", inCooldown: false, cooldownRemaining: 0, cooldownProgress: 0 };
  }

  const latest = history[history.length - 1];
  const cooldownDuration = 60; // cooldown config matching backend

  const inCooldown = currentTime < transitionEligibleAt;
  const cooldownRemaining = inCooldown ? transitionEligibleAt - currentTime : 0;
  const cooldownProgress = inCooldown ? (cooldownRemaining / cooldownDuration) * 100 : 0;

  let steps = "IMMEDIATE";
  let message = "Yield decay monitoring active.";

  if (currentTime > latest.validUntil) {
    steps = "STALE DATA OVERRIDE";
    message = "Stale yield oracle data forced EXIT state.";
    return { inCooldown, cooldownRemaining, cooldownProgress, steps, message };
  }

  const slope = calculateApySlope(history, 86400);
  const factors = calculateYieldFactorScores(latest, slope);
  const rawScore = 
    0.25 * factors.apySlopeRisk +
    0.20 * factors.subsidyDependency +
    0.20 * factors.tvlNetFlow +
    0.15 * factors.feeSustainability +
    0.10 * factors.exitLiquidity +
    0.10 * factors.rewardToken;
  
  const score = Math.round(rawScore);
  const proposed = getBaseYieldState(score);

  if (currentState !== proposed) {
    steps = "Observation 1/1 for Transition";
    message = `State transition to ${proposed} eligible (decay score: ${score}).`;
  } else {
    message = `Yield metrics stable. Current decay score: ${score} / 100.`;
  }

  return {
    inCooldown,
    cooldownRemaining,
    cooldownProgress,
    steps,
    message
  };
}

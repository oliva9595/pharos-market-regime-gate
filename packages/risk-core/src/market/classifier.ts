import { MarketSnapshot, MarketRegime } from '../types.js';
import { MarketRiskReasons } from './reasons.js';
import { hashReasons } from '../hashes.js';

export interface MarketClassificationResult {
  regime: MarketRegime;
  reasons: string[];
  reasonsHash: `0x${string}`;
  transitionEligibleAt: number;
}

export interface ClassifierConfig {
  cooldownSeconds: number; // minimum time between state transitions
}

export function classifyMarketRegime(
  snapshots: MarketSnapshot[],
  previousResult?: MarketClassificationResult,
  config: ClassifierConfig = { cooldownSeconds: 60 },
  currentTime: number = Math.floor(Date.now() / 1000)
): MarketClassificationResult {
  if (snapshots.length === 0) {
    return {
      regime: "NORMAL",
      reasons: [],
      reasonsHash: hashReasons([]),
      transitionEligibleAt: 0
    };
  }

  const latest = snapshots[snapshots.length - 1];

  // 1. Stale-data Check: Immediately PANIC without waiting for 2 observations, overrides cooldown
  if (currentTime > latest.validUntil) {
    const reasons = [MarketRiskReasons.DATA_STALE];
    return {
      regime: "PANIC",
      reasons,
      reasonsHash: hashReasons(reasons),
      transitionEligibleAt: currentTime + config.cooldownSeconds
    };
  }

  const prevRegime = previousResult?.regime ?? "NORMAL";

  // Check if we are in cooldown
  if (previousResult && latest.observedAt < previousResult.transitionEligibleAt) {
    return {
      ...previousResult,
      // Update reasons hash just in case, but keep regime same
    };
  }

  // Helper: check if a snapshot has panic signals
  const checkPanicSignals = (snap: MarketSnapshot) => {
    const reasons: string[] = [];
    if (snap.volatilityBps >= 4500) reasons.push(MarketRiskReasons.VOLATILITY_PANIC);
    if (snap.priceDivergenceBps >= 300) reasons.push(MarketRiskReasons.DIVERGENCE_PANIC);
    if (snap.bridgeNetOutflowUsd >= 10_000_000n) reasons.push(MarketRiskReasons.OUTFLOW_PANIC);
    if (snap.stablecoinDepegBps >= 200) reasons.push(MarketRiskReasons.DEPEG_PANIC);
    if (snap.confidenceBps < 6000) reasons.push(MarketRiskReasons.CONFIDENCE_PANIC);
    return reasons;
  };

  // Helper: check if a snapshot has volatile signals
  const checkVolatileSignals = (snap: MarketSnapshot) => {
    const reasons: string[] = [];
    if (snap.volatilityBps >= 3000) reasons.push(MarketRiskReasons.VOLATILITY_VOLATILE);
    if (snap.priceDivergenceBps >= 100) reasons.push(MarketRiskReasons.DIVERGENCE_VOLATILE);
    if (snap.bridgeNetOutflowUsd >= 5_000_000n) reasons.push(MarketRiskReasons.OUTFLOW_VOLATILE);
    if (snap.stablecoinDepegBps >= 50) reasons.push(MarketRiskReasons.DEPEG_VOLATILE);
    if (snap.confidenceBps < 8000) reasons.push(MarketRiskReasons.CONFIDENCE_VOLATILE);
    return reasons;
  };

  // 2. Compute "proposed" regime for each snapshot in history
  const getProposedRegime = (snap: MarketSnapshot): { regime: MarketRegime; reasons: string[] } => {
    const panicReasons = checkPanicSignals(snap);
    if (panicReasons.length > 0) {
      return { regime: "PANIC", reasons: panicReasons };
    }
    const volatileReasons = checkVolatileSignals(snap);
    if (volatileReasons.length >= 2) {
      return { regime: "VOLATILE", reasons: volatileReasons };
    }
    return { regime: "NORMAL", reasons: [] };
  };

  const proposedLatest = getProposedRegime(latest);

  // If proposed is higher or equal to current, check for upgrade (requires 2 consecutive observations)
  if (proposedLatest.regime === "PANIC" && prevRegime !== "PANIC") {
    // Check if previous snapshot also proposed PANIC
    const prevSnap = snapshots.length >= 2 ? snapshots[snapshots.length - 2] : null;
    if (prevSnap && getProposedRegime(prevSnap).regime === "PANIC") {
      return {
        regime: "PANIC",
        reasons: proposedLatest.reasons,
        reasonsHash: hashReasons(proposedLatest.reasons),
        transitionEligibleAt: latest.observedAt + config.cooldownSeconds
      };
    }
  }

  if (proposedLatest.regime === "VOLATILE" && prevRegime === "NORMAL") {
    const prevSnap = snapshots.length >= 2 ? snapshots[snapshots.length - 2] : null;
    if (prevSnap && ["VOLATILE", "PANIC"].includes(getProposedRegime(prevSnap).regime)) {
      return {
        regime: "VOLATILE",
        reasons: proposedLatest.reasons,
        reasonsHash: hashReasons(proposedLatest.reasons),
        transitionEligibleAt: latest.observedAt + config.cooldownSeconds
      };
    }
  }

  // 3. Recovery / Downgrade Check (requires 3 consecutive observations satisfying separate exit thresholds)
  const satisfiesPanicExit = (snap: MarketSnapshot) => {
    return (
      snap.volatilityBps < 4000 &&
      snap.priceDivergenceBps < 250 &&
      snap.bridgeNetOutflowUsd < 8_000_000n &&
      snap.stablecoinDepegBps < 150 &&
      snap.confidenceBps >= 6500
    );
  };

  const satisfiesVolatileExit = (snap: MarketSnapshot) => {
    return (
      snap.volatilityBps < 2500 &&
      snap.priceDivergenceBps < 80 &&
      snap.bridgeNetOutflowUsd < 4_000_000n &&
      snap.stablecoinDepegBps < 40 &&
      snap.confidenceBps >= 8500
    );
  };

  if (prevRegime === "PANIC") {
    // Needs 3 consecutive snapshots satisfying satisfiesPanicExit
    if (snapshots.length >= 3) {
      const snap1 = snapshots[snapshots.length - 1];
      const snap2 = snapshots[snapshots.length - 2];
      const snap3 = snapshots[snapshots.length - 3];
      if (satisfiesPanicExit(snap1) && satisfiesPanicExit(snap2) && satisfiesPanicExit(snap3)) {
        // Recover to VOLATILE or NORMAL
        const nextRegime = satisfiesVolatileExit(snap1) && satisfiesVolatileExit(snap2) && satisfiesVolatileExit(snap3)
          ? "NORMAL"
          : "VOLATILE";
        
        const reasons = nextRegime === "VOLATILE" ? checkVolatileSignals(latest) : [];
        return {
          regime: nextRegime,
          reasons,
          reasonsHash: hashReasons(reasons),
          transitionEligibleAt: latest.observedAt + config.cooldownSeconds
        };
      }
    }
    // Stay in PANIC
    return {
      regime: "PANIC",
      reasons: proposedLatest.reasons.length > 0 ? proposedLatest.reasons : [MarketRiskReasons.VOLATILITY_PANIC], // fallback reason
      reasonsHash: hashReasons(proposedLatest.reasons.length > 0 ? proposedLatest.reasons : [MarketRiskReasons.VOLATILITY_PANIC]),
      transitionEligibleAt: previousResult?.transitionEligibleAt ?? 0
    };
  }

  if (prevRegime === "VOLATILE") {
    // Check if we satisfy volatile exit for 3 consecutive snapshots
    if (snapshots.length >= 3) {
      const snap1 = snapshots[snapshots.length - 1];
      const snap2 = snapshots[snapshots.length - 2];
      const snap3 = snapshots[snapshots.length - 3];
      if (satisfiesVolatileExit(snap1) && satisfiesVolatileExit(snap2) && satisfiesVolatileExit(snap3)) {
        return {
          regime: "NORMAL",
          reasons: [],
          reasonsHash: hashReasons([]),
          transitionEligibleAt: latest.observedAt + config.cooldownSeconds
        };
      }
    }
    // Stay in VOLATILE
    return {
      regime: "VOLATILE",
      reasons: proposedLatest.reasons.length > 0 ? proposedLatest.reasons : [MarketRiskReasons.VOLATILITY_VOLATILE],
      reasonsHash: hashReasons(proposedLatest.reasons.length > 0 ? proposedLatest.reasons : [MarketRiskReasons.VOLATILITY_VOLATILE]),
      transitionEligibleAt: previousResult?.transitionEligibleAt ?? 0
    };
  }

  // Default return current state
  return {
    regime: prevRegime,
    reasons: proposedLatest.reasons,
    reasonsHash: hashReasons(proposedLatest.reasons),
    transitionEligibleAt: previousResult?.transitionEligibleAt ?? 0
  };
}

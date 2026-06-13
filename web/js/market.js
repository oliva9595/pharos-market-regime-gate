// Market Regime Classification and Hysteresis Engine
// Replicates logic from packages/risk-core/src/market

export const MarketRiskReasons = {
  VOLATILITY_PANIC: "VOLATILITY_PANIC",
  VOLATILITY_VOLATILE: "VOLATILITY_VOLATILE",
  DIVERGENCE_PANIC: "DIVERGENCE_PANIC",
  DIVERGENCE_VOLATILE: "DIVERGENCE_VOLATILE",
  OUTFLOW_PANIC: "OUTFLOW_PANIC",
  OUTFLOW_VOLATILE: "OUTFLOW_VOLATILE",
  DEPEG_PANIC: "DEPEG_PANIC",
  DEPEG_VOLATILE: "DEPEG_VOLATILE",
  CONFIDENCE_PANIC: "CONFIDENCE_PANIC",
  CONFIDENCE_VOLATILE: "CONFIDENCE_VOLATILE",
  DATA_STALE: "DATA_STALE"
};

const ReasonDescriptions = {
  VOLATILITY_PANIC: "Volatility Shock: VIX >= 45.0% (4500 bps)",
  VOLATILITY_VOLATILE: "Volatility Spike: VIX >= 30.0% (3000 bps)",
  DIVERGENCE_PANIC: "Divergence Shock: DEX price divergence >= 3.0% (300 bps)",
  DIVERGENCE_VOLATILE: "Divergence Spike: DEX price divergence >= 1.0% (100 bps)",
  OUTFLOW_PANIC: "Bridge Panic Outflow: Outflow >= $10.0M / hr",
  OUTFLOW_VOLATILE: "Bridge Outflow Spike: Outflow >= $5.0M / hr",
  DEPEG_PANIC: "Stablecoin Depeg Shock: Depeg >= 2.0% (200 bps)",
  DEPEG_VOLATILE: "Stablecoin Depeg Warning: Depeg >= 0.5% (50 bps)",
  CONFIDENCE_PANIC: "Oracle Panic: Confidence level < 60% (6000 bps)",
  CONFIDENCE_VOLATILE: "Oracle Alert: Confidence level < 80% (8000 bps)",
  DATA_STALE: "Oracle Stale: Market data feed is stale (invalid timestamp)"
};

export function getHumanReadableReason(reasonCode) {
  return ReasonDescriptions[reasonCode] || reasonCode;
}

export function hashReasons(reasons) {
  if (!reasons || reasons.length === 0) {
    return '0x0000000000000000000000000000000000000000000000000000000000000000';
  }
  const sorted = [...reasons].sort();
  
  // Try to use window.ethers if available for Keccak256
  if (typeof window !== 'undefined' && window.ethers && typeof window.ethers.keccak256 === 'function') {
    try {
      const bytes = window.ethers.toUtf8Bytes(sorted.join(','));
      return window.ethers.keccak256(bytes);
    } catch (err) {
      console.error('Ethers keccak256 failed, falling back:', err);
    }
  }

  // Fallback to DJB2
  let hash = 0;
  const sortedStr = sorted.join(',');
  for (let i = 0; i < sortedStr.length; i++) {
    hash = (hash << 5) - hash + sortedStr.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  const part = Math.abs(hash).toString(16).padStart(8, '0');
  return '0x' + part.repeat(8);
}

// Module-scope verification helper functions (DRY)
export function checkPanicSignals(snap) {
  const reasons = [];
  if (!snap) return reasons;
  if (snap.volatilityBps >= 4500) reasons.push(MarketRiskReasons.VOLATILITY_PANIC);
  if (snap.priceDivergenceBps >= 300) reasons.push(MarketRiskReasons.DIVERGENCE_PANIC);
  if (snap.bridgeNetOutflowUsd !== undefined && BigInt(snap.bridgeNetOutflowUsd) >= 10000000n) {
    reasons.push(MarketRiskReasons.OUTFLOW_PANIC);
  }
  if (snap.stablecoinDepegBps >= 200) reasons.push(MarketRiskReasons.DEPEG_PANIC);
  if (snap.confidenceBps < 6000) reasons.push(MarketRiskReasons.CONFIDENCE_PANIC);
  return reasons;
}

export function checkVolatileSignals(snap) {
  const reasons = [];
  if (!snap) return reasons;
  if (snap.volatilityBps >= 3000) reasons.push(MarketRiskReasons.VOLATILITY_VOLATILE);
  if (snap.priceDivergenceBps >= 100) reasons.push(MarketRiskReasons.DIVERGENCE_VOLATILE);
  if (snap.bridgeNetOutflowUsd !== undefined && BigInt(snap.bridgeNetOutflowUsd) >= 5000000n) {
    reasons.push(MarketRiskReasons.OUTFLOW_VOLATILE);
  }
  if (snap.stablecoinDepegBps >= 50) reasons.push(MarketRiskReasons.DEPEG_VOLATILE);
  if (snap.confidenceBps < 8000) reasons.push(MarketRiskReasons.CONFIDENCE_VOLATILE);
  return reasons;
}

export function satisfiesPanicExit(snap) {
  if (!snap) return false;
  return (
    snap.volatilityBps < 4000 &&
    snap.priceDivergenceBps < 250 &&
    snap.bridgeNetOutflowUsd !== undefined && BigInt(snap.bridgeNetOutflowUsd) < 8000000n &&
    snap.stablecoinDepegBps < 150 &&
    snap.confidenceBps >= 6500
  );
}

export function satisfiesVolatileExit(snap) {
  if (!snap) return false;
  return (
    snap.volatilityBps < 2500 &&
    snap.priceDivergenceBps < 80 &&
    snap.bridgeNetOutflowUsd !== undefined && BigInt(snap.bridgeNetOutflowUsd) < 4000000n &&
    snap.stablecoinDepegBps < 40 &&
    snap.confidenceBps >= 8500
  );
}

export function getProposedRegime(snap) {
  const panicReasons = checkPanicSignals(snap);
  if (panicReasons.length > 0) {
    return { regime: "PANIC", reasons: panicReasons };
  }
  const volatileReasons = checkVolatileSignals(snap);
  if (volatileReasons.length >= 2) {
    return { regime: "VOLATILE", reasons: volatileReasons };
  }
  return { regime: "NORMAL", reasons: [] };
}

// Replicates classifyMarketRegime from packages/risk-core
export function classifyMarketRegime(
  snapshots,
  previousResult,
  config = { cooldownSeconds: 60 },
  currentTime = Math.floor(Date.now() / 1000)
) {
  if (!snapshots || snapshots.length === 0) {
    return {
      regime: "NORMAL",
      reasons: [],
      reasonsHash: hashReasons([]),
      transitionEligibleAt: 0
    };
  }

  const latest = snapshots[snapshots.length - 1];

  // 1. Stale-data Check: Overrides cooldown, immediately PANIC
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

  // Check if we are in cooldown (consistent calculation using currentTime)
  if (previousResult && currentTime < previousResult.transitionEligibleAt) {
    return {
      ...previousResult
    };
  }

  const proposedLatest = getProposedRegime(latest);

  // If proposed is higher or equal to current, check for upgrade (requires 2 consecutive observations)
  if (proposedLatest.regime === "PANIC" && prevRegime !== "PANIC") {
    const prevSnap = snapshots.length >= 2 ? snapshots[snapshots.length - 2] : null;
    if (prevSnap && getProposedRegime(prevSnap).regime === "PANIC") {
      return {
        regime: "PANIC",
        reasons: proposedLatest.reasons,
        reasonsHash: hashReasons(proposedLatest.reasons),
        transitionEligibleAt: currentTime + config.cooldownSeconds
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
        transitionEligibleAt: currentTime + config.cooldownSeconds
      };
    }
  }

  // 3. Recovery / Downgrade Check (requires 3 consecutive observations satisfying exit thresholds)
  if (prevRegime === "PANIC") {
    if (snapshots.length >= 3) {
      const snap1 = snapshots[snapshots.length - 1];
      const snap2 = snapshots[snapshots.length - 2];
      const snap3 = snapshots[snapshots.length - 3];
      if (satisfiesPanicExit(snap1) && satisfiesPanicExit(snap2) && satisfiesPanicExit(snap3)) {
        const nextRegime = satisfiesVolatileExit(snap1) && satisfiesVolatileExit(snap2) && satisfiesVolatileExit(snap3)
          ? "NORMAL"
          : "VOLATILE";
        
        const reasons = nextRegime === "VOLATILE" ? checkVolatileSignals(latest) : [];
        return {
          regime: nextRegime,
          reasons,
          reasonsHash: hashReasons(reasons),
          transitionEligibleAt: currentTime + config.cooldownSeconds
        };
      }
    }
    // Stay in PANIC
    const panicReasons = proposedLatest.reasons.length > 0 ? proposedLatest.reasons : [MarketRiskReasons.VOLATILITY_PANIC];
    return {
      regime: "PANIC",
      reasons: panicReasons,
      reasonsHash: hashReasons(panicReasons),
      transitionEligibleAt: previousResult?.transitionEligibleAt ?? 0
    };
  }

  if (prevRegime === "VOLATILE") {
    if (snapshots.length >= 3) {
      const snap1 = snapshots[snapshots.length - 1];
      const snap2 = snapshots[snapshots.length - 2];
      const snap3 = snapshots[snapshots.length - 3];
      if (satisfiesVolatileExit(snap1) && satisfiesVolatileExit(snap2) && satisfiesVolatileExit(snap3)) {
        return {
          regime: "NORMAL",
          reasons: [],
          reasonsHash: hashReasons([]),
          transitionEligibleAt: currentTime + config.cooldownSeconds
        };
      }
    }
    // Stay in VOLATILE
    const volatileReasons = proposedLatest.reasons.length > 0 ? proposedLatest.reasons : [MarketRiskReasons.VOLATILITY_VOLATILE];
    return {
      regime: "VOLATILE",
      reasons: volatileReasons,
      reasonsHash: hashReasons(volatileReasons),
      transitionEligibleAt: previousResult?.transitionEligibleAt ?? 0
    };
  }

  // Default return current
  return {
    regime: prevRegime,
    reasons: proposedLatest.reasons,
    reasonsHash: hashReasons(proposedLatest.reasons),
    transitionEligibleAt: previousResult?.transitionEligibleAt ?? 0
  };
}

export function computeHysteresisState(history, currentRegime, transitionEligibleAt, currentTime) {
  if (!history || history.length === 0) {
    return { steps: "", message: "System initializing", inCooldown: false, cooldownRemaining: 0, cooldownProgress: 0 };
  }

  const latest = history[history.length - 1];
  const cooldownDuration = 60; // cooldown config matching backend

  // Cooldown calculation (consistent calculation using currentTime)
  const inCooldown = currentTime < transitionEligibleAt;
  const cooldownRemaining = inCooldown ? transitionEligibleAt - currentTime : 0;
  const cooldownProgress = inCooldown ? (cooldownRemaining / cooldownDuration) * 100 : 0;

  let steps = "";
  let message = "System stable";

  if (currentTime > latest.validUntil) {
    steps = "STALE DATA OVERRIDE";
    message = "Stale oracle data forced PANIC regime.";
    return { inCooldown, cooldownRemaining, cooldownProgress, steps, message };
  }

  if (currentRegime === "NORMAL") {
    const proposed = getProposedRegime(latest).regime;
    if (proposed === "PANIC") {
      // Check if previous was panic
      const prevSnap = history.length >= 2 ? history[history.length - 2] : null;
      const prevProposed = prevSnap ? getProposedRegime(prevSnap).regime : null;
      if (prevProposed === "PANIC") {
        steps = "Transition eligible";
        message = "Panic conditions confirmed.";
      } else {
        steps = "Observation 1/2 for Panic Entry";
        message = "Panic entry condition triggered. Awaiting confirmation.";
      }
    } else if (proposed === "VOLATILE") {
      const prevSnap = history.length >= 2 ? history[history.length - 2] : null;
      const prevProposed = prevSnap ? getProposedRegime(prevSnap).regime : null;
      if (prevProposed === "VOLATILE" || prevProposed === "PANIC") {
        steps = "Transition eligible";
        message = "Volatile conditions confirmed.";
      } else {
        steps = "Observation 1/2 for Volatile Entry";
        message = "Volatile entry condition triggered. Awaiting confirmation.";
      }
    } else {
      message = "All market signals within normal parameters.";
    }
  } else if (currentRegime === "VOLATILE") {
    const proposed = getProposedRegime(latest).regime;
    if (proposed === "PANIC") {
      const prevSnap = history.length >= 2 ? history[history.length - 2] : null;
      const prevProposed = prevSnap ? getProposedRegime(prevSnap).regime : null;
      if (prevProposed === "PANIC") {
        steps = "Transition eligible";
        message = "Panic conditions confirmed.";
      } else {
        steps = "Observation 1/2 for Panic Entry";
        message = "Panic entry condition triggered. Awaiting confirmation.";
      }
    } else {
      // Evaluate recovery count
      let exitCount = 0;
      for (let i = history.length - 1; i >= 0; i--) {
        if (satisfiesVolatileExit(history[i])) {
          exitCount++;
          if (exitCount === 3) break;
        } else {
          break;
        }
      }
      if (exitCount > 0) {
        steps = `Observation ${exitCount}/3 for Normal Recovery`;
        message = `Recovery under observation. Need ${3 - exitCount} more stable readings.`;
      } else {
        message = "Volatile protection active. Monitoring signals.";
      }
    }
  } else if (currentRegime === "PANIC") {
    // Evaluate recovery from PANIC
    let exitCount = 0;
    for (let i = history.length - 1; i >= 0; i--) {
      if (satisfiesPanicExit(history[i])) {
        exitCount++;
        if (exitCount === 3) break;
      } else {
        break;
      }
    }
    if (exitCount > 0) {
      // Check if also volatile exit is satisfied
      let volatileExitCount = 0;
      for (let i = history.length - 1; i >= 0; i--) {
        if (satisfiesVolatileExit(history[i])) {
          volatileExitCount++;
          if (volatileExitCount === 3) break;
        } else {
          break;
        }
      }
      const target = volatileExitCount >= exitCount ? "Normal Recovery" : "Volatile Recovery";
      steps = `Observation ${exitCount}/3 for ${target}`;
      message = `Panic exit under observation. Need ${3 - exitCount} more stable readings.`;
    } else {
      message = "Panic protection active. All standard execution halted.";
    }
  }

  return {
    inCooldown,
    cooldownRemaining,
    cooldownProgress,
    steps,
    message
  };
}

export function generateMockReportDetails(regime, sequenceNumber) {
  // Deterministic values based on sequence number
  const reporterAddress = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
  const validationHash = hashReasons([regime, String(sequenceNumber), "validation"]);
  
  return {
    sequenceNumber: sequenceNumber || 10842,
    reporter: reporterAddress,
    validationHash: validationHash,
    signatureStatus: "VERIFIED",
    gateExecutionState: regime === "PANIC" ? "HALTED" : (regime === "VOLATILE" ? "RESTRICTED" : "ARMED")
  };
}

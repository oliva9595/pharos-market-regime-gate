import { MarketRegime, YieldState, PolicyDecision } from '../types.js';

export function getMatrixDecision(
  regime: MarketRegime,
  yieldState: YieldState,
  actionType: string
): PolicyDecision {
  const normAction = actionType.toUpperCase();

  // Repay is always allowed across all regimes/states
  if (normAction === "REPAY") {
    return "ALLOW";
  }

  // Panic + Any
  if (regime === "PANIC") {
    if (normAction === "WITHDRAW" || normAction === "SWAP") return "UNWIND";
    return "BLOCK";
  }

  // Any + Exit
  if (yieldState === "EXIT") {
    if (normAction === "WITHDRAW" || normAction === "SWAP") return "UNWIND";
    return "BLOCK";
  }

  // Any + Decaying
  if (yieldState === "DECAYING") {
    if (normAction === "WITHDRAW") return "ALLOW";
    if (normAction === "SWAP") return "UNWIND";
    return "BLOCK";
  }

  // Volatile + Healthy
  if (regime === "VOLATILE" && yieldState === "HEALTHY") {
    if (normAction === "WITHDRAW") return "ALLOW";
    return "RESTRICT";
  }

  // Normal + Watch
  if (regime === "NORMAL" && yieldState === "WATCH") {
    if (normAction === "WITHDRAW") return "ALLOW";
    return "RESTRICT";
  }

  // Volatile + Watch
  if (regime === "VOLATILE" && yieldState === "WATCH") {
    if (normAction === "WITHDRAW") return "ALLOW";
    return "RESTRICT";
  }

  // Normal + Healthy
  return "ALLOW";
}

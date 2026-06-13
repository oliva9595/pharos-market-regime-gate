import { MarketSnapshot } from '../types.js';

export const MarketThresholds = {
  VOLATILE_ENTRY: {
    volatilityBps: 3000,
    priceDivergenceBps: 100,
    bridgeNetOutflowUsd: 5_000_000n,
    stablecoinDepegBps: 50,
    confidenceBps: 8000
  },
  VOLATILE_EXIT: {
    volatilityBps: 2500,
    priceDivergenceBps: 80,
    bridgeNetOutflowUsd: 4_000_000n,
    stablecoinDepegBps: 40,
    confidenceBps: 8500
  },
  PANIC_ENTRY: {
    volatilityBps: 4500,
    priceDivergenceBps: 300,
    bridgeNetOutflowUsd: 10_000_000n,
    stablecoinDepegBps: 200,
    confidenceBps: 6000
  },
  PANIC_EXIT: {
    volatilityBps: 4000,
    priceDivergenceBps: 250,
    bridgeNetOutflowUsd: 8_000_000n,
    stablecoinDepegBps: 150,
    confidenceBps: 6500
  }
} as const;

export function isBelowPanicExitThresholds(snap: MarketSnapshot): boolean {
  return (
    snap.volatilityBps < MarketThresholds.PANIC_EXIT.volatilityBps &&
    snap.priceDivergenceBps < MarketThresholds.PANIC_EXIT.priceDivergenceBps &&
    snap.bridgeNetOutflowUsd < MarketThresholds.PANIC_EXIT.bridgeNetOutflowUsd &&
    snap.stablecoinDepegBps < MarketThresholds.PANIC_EXIT.stablecoinDepegBps &&
    snap.confidenceBps >= MarketThresholds.PANIC_EXIT.confidenceBps
  );
}

export function isBelowVolatileExitThresholds(snap: MarketSnapshot): boolean {
  return (
    snap.volatilityBps < MarketThresholds.VOLATILE_EXIT.volatilityBps &&
    snap.priceDivergenceBps < MarketThresholds.VOLATILE_EXIT.priceDivergenceBps &&
    snap.bridgeNetOutflowUsd < MarketThresholds.VOLATILE_EXIT.bridgeNetOutflowUsd &&
    snap.stablecoinDepegBps < MarketThresholds.VOLATILE_EXIT.stablecoinDepegBps &&
    snap.confidenceBps >= MarketThresholds.VOLATILE_EXIT.confidenceBps
  );
}

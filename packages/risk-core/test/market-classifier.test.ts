import { describe, it, expect } from 'vitest';
import { MarketSnapshot } from '../src/types.js';
import { classifyMarketRegime } from '../src/market/classifier.js';

describe('MarketRegimeClassifier', () => {
  const baseSnap: MarketSnapshot = {
    observedAt: 1700000000,
    validUntil: 1700000300,
    volatilityBps: 1500,
    priceDivergenceBps: 20,
    bridgeNetOutflowUsd: 100000n,
    stablecoinDepegBps: 10,
    liquidityDepthUsd: 10000000n,
    confidenceBps: 9000,
    sourceHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
  };

  it('keeps NORMAL state when signals are healthy', () => {
    const res = classifyMarketRegime([baseSnap], undefined, { cooldownSeconds: 60 }, 1700000100);
    expect(res.regime).toBe('NORMAL');
    expect(res.reasons).toEqual([]);
  });

  it('requires two consecutive observations to enter VOLATILE', () => {
    const volatileSnap1: MarketSnapshot = {
      ...baseSnap,
      observedAt: 1700000100,
      validUntil: 1700000400,
      volatilityBps: 3200, // volatile
      priceDivergenceBps: 120 // volatile
    };

    // 1 observation: should NOT trigger volatile yet
    const res1 = classifyMarketRegime([baseSnap, volatileSnap1], undefined, { cooldownSeconds: 60 }, 1700000150);
    expect(res1.regime).toBe('NORMAL');

    // 2 consecutive observations: should trigger volatile
    const volatileSnap2 = { ...volatileSnap1, observedAt: 1700000200, validUntil: 1700000500 };
    const res2 = classifyMarketRegime([baseSnap, volatileSnap1, volatileSnap2], undefined, { cooldownSeconds: 60 }, 1700000250);
    expect(res2.regime).toBe('VOLATILE');
    expect(res2.reasons).toContain('VOLATILITY_VOLATILE');
  });

  it('triggers PANIC immediately on stale data, overriding cooldown', () => {
    // Current time is after validUntil
    const res = classifyMarketRegime([baseSnap], undefined, { cooldownSeconds: 60 }, 1700000500);
    expect(res.regime).toBe('PANIC');
    expect(res.reasons).toContain('DATA_STALE');
  });

  it('requires two consecutive observations to enter PANIC', () => {
    const panicSnap1: MarketSnapshot = {
      ...baseSnap,
      observedAt: 1700000100,
      validUntil: 1700000400,
      volatilityBps: 5000 // panic
    };

    // 1 observation
    const res1 = classifyMarketRegime([baseSnap, panicSnap1], undefined, { cooldownSeconds: 60 }, 1700000150);
    expect(res1.regime).toBe('NORMAL');

    // 2 consecutive observations
    const panicSnap2 = { ...panicSnap1, observedAt: 1700000200, validUntil: 1700000500 };
    const res2 = classifyMarketRegime([baseSnap, panicSnap1, panicSnap2], undefined, { cooldownSeconds: 60 }, 1700000250);
    expect(res2.regime).toBe('PANIC');
    expect(res2.reasons).toContain('VOLATILITY_PANIC');
  });

  it('enforces cooldown preventing state transitions', () => {
    const volatileSnap1: MarketSnapshot = {
      ...baseSnap,
      observedAt: 1700000100,
      validUntil: 1700000400,
      volatilityBps: 3200,
      priceDivergenceBps: 120
    };
    const volatileSnap2 = { ...volatileSnap1, observedAt: 1700000200, validUntil: 1700000500 };

    // Trigger volatile
    const res1 = classifyMarketRegime([baseSnap, volatileSnap1, volatileSnap2], undefined, { cooldownSeconds: 60 }, 1700000250);
    expect(res1.regime).toBe('VOLATILE');
    expect(res1.transitionEligibleAt).toBe(1700000200 + 60); // 1700000260

    // Try to trigger panic with 2 consecutive panic observations within cooldown
    const panicSnap1 = { ...baseSnap, observedAt: 1700000210, validUntil: 1700000510, volatilityBps: 5000 };
    const panicSnap2 = { ...panicSnap1, observedAt: 1700000220, validUntil: 1700000520 };

    // observedAt of latest is 1700000220, which is < transitionEligibleAt (1700000260)
    const res2 = classifyMarketRegime([baseSnap, volatileSnap1, volatileSnap2, panicSnap1, panicSnap2], res1, { cooldownSeconds: 60 }, 1700000230);
    expect(res2.regime).toBe('VOLATILE'); // blocked by cooldown!
  });

  it('requires three consecutive healthy observations to recover from VOLATILE to NORMAL', () => {
    const volatileSnap1: MarketSnapshot = {
      ...baseSnap,
      observedAt: 1700000100,
      validUntil: 1700000400,
      volatilityBps: 3200,
      priceDivergenceBps: 120
    };
    const volatileSnap2 = { ...volatileSnap1, observedAt: 1700000200, validUntil: 1700000500 };

    const resVolatile = classifyMarketRegime([baseSnap, volatileSnap1, volatileSnap2], undefined, { cooldownSeconds: 60 }, 1700000250);

    const healthy1 = { ...baseSnap, observedAt: 1700000300, validUntil: 1700000600 };
    const healthy2 = { ...baseSnap, observedAt: 1700000400, validUntil: 1700000700 };
    const healthy3 = { ...baseSnap, observedAt: 1700000500, validUntil: 1700000800 };

    // 1 healthy
    const resRecover1 = classifyMarketRegime([baseSnap, volatileSnap1, volatileSnap2, healthy1], resVolatile, { cooldownSeconds: 60 }, 1700000350);
    expect(resRecover1.regime).toBe('VOLATILE');

    // 2 healthy
    const resRecover2 = classifyMarketRegime([baseSnap, volatileSnap1, volatileSnap2, healthy1, healthy2], resVolatile, { cooldownSeconds: 60 }, 1700000450);
    expect(resRecover2.regime).toBe('VOLATILE');

    // 3 healthy
    const resRecover3 = classifyMarketRegime([baseSnap, volatileSnap1, volatileSnap2, healthy1, healthy2, healthy3], resVolatile, { cooldownSeconds: 60 }, 1700000550);
    expect(resRecover3.regime).toBe('NORMAL');
  });
});

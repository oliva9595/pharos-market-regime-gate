import { describe, it, expect } from 'vitest';
import { YieldSnapshot } from '../src/types.js';
import { evaluateYieldDecay } from '../src/yield/scorer.js';

describe('YieldDecayScorer', () => {
  const baseSnap: YieldSnapshot = {
    opportunityId: '0xbe713906E4D5ac544C069Cd16B2233C979b8AB5a',
    observedAt: 1700000000,
    validUntil: 1700000300,
    totalApyBps: 1000,
    baseApyBps: 900,
    rewardApyBps: 100,
    tvlUsd: 10000000n,
    netFlowUsd24h: 0n,
    feesUsd24h: 2000n, // annualized is 730k, which is 7.3% of TVL (0 risk)
    liquidityDepthUsd: 3000000n,
    exitSlippageBps: 10,
    rewardTokenChangeBps7d: 0,
    confidenceBps: 9500,
    sourceHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
  };

  it('evaluates healthy yield as HEALTHY', () => {
    const res = evaluateYieldDecay(baseSnap, 0, undefined, { cooldownSeconds: 60 }, 1700000100);
    expect(res.yieldState).toBe('HEALTHY');
    expect(res.decayScore).toBeLessThan(30);
  });

  it('triggers WATCH or DECAYING when APY is decaying and subsidy dependency is high', () => {
    const decayingSnap: YieldSnapshot = {
      ...baseSnap,
      totalApyBps: 1000,
      baseApyBps: 200,
      rewardApyBps: 800, // 80% subsidy -> high risk
      rewardTokenChangeBps7d: -3000 // -30% reward token drop -> high risk
    };

    const res = evaluateYieldDecay(decayingSnap, -50, undefined, { cooldownSeconds: 60 }, 1700000100); // -50 bps/day slope -> high risk
    expect(res.yieldState).toBe('DECAYING');
    expect(res.decayScore).toBeGreaterThanOrEqual(50);
  });

  it('forces EXIT on stale yield snapshot', () => {
    // Current time is after validUntil (1700000300)
    const res = evaluateYieldDecay(baseSnap, 0, undefined, { cooldownSeconds: 60 }, 1700000400);
    expect(res.yieldState).toBe('EXIT');
    expect(res.reasons).toContain('YIELD_STALE');
  });

  it('forces WATCH on low confidence snapshot even if score is low', () => {
    const lowConfSnap = { ...baseSnap, confidenceBps: 6500 };
    const res = evaluateYieldDecay(lowConfSnap, 0, undefined, { cooldownSeconds: 60 }, 1700000100);
    expect(res.yieldState).toBe('WATCH');
    expect(res.reasons).toContain('LOW_CONFIDENCE');
  });

  it('forces DECAYING on exit slippage >= 500 bps', () => {
    const highSlippageSnap = { ...baseSnap, exitSlippageBps: 550 }; // 5.5% slippage
    const res = evaluateYieldDecay(highSlippageSnap, 0, undefined, { cooldownSeconds: 60 }, 1700000100);
    expect(res.yieldState).toBe('DECAYING');
    expect(res.reasons).toContain('HIGH_EXIT_SLIPPAGE');
  });

  it('forces EXIT on severe TVL outflow plus subsidy dependency', () => {
    const panicSnap: YieldSnapshot = {
      ...baseSnap,
      totalApyBps: 1000,
      baseApyBps: 400,
      rewardApyBps: 600, // 60% subsidy (>= 50%)
      tvlUsd: 10000000n,
      netFlowUsd24h: -1600000n // -16% net flow (>= 15% outflow)
    };
    const res = evaluateYieldDecay(panicSnap, 0, undefined, { cooldownSeconds: 60 }, 1700000100);
    expect(res.yieldState).toBe('EXIT');
    expect(res.reasons).toContain('SUBSIDY_COLLAPSE_OUTFLOW');
  });

  it('respects transition cooldown', () => {
    const decayingSnap: YieldSnapshot = {
      ...baseSnap,
      totalApyBps: 1000,
      baseApyBps: 200,
      rewardApyBps: 800,
      rewardTokenChangeBps7d: -3000
    };

    const resDecaying = evaluateYieldDecay(decayingSnap, -50, undefined, { cooldownSeconds: 60 }, 1700000100);
    expect(resDecaying.yieldState).toBe('DECAYING');
    expect(resDecaying.transitionEligibleAt).toBe(1700000100 + 60); // 1700000160

    // Try to transition back to HEALTHY immediately (within cooldown)
    const resHealthy = evaluateYieldDecay(baseSnap, 0, resDecaying, { cooldownSeconds: 60 }, 1700000130);
    expect(resHealthy.yieldState).toBe('DECAYING'); // remains DECAYING due to cooldown
  });
});

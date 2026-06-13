import { describe, expect, it } from 'vitest';
import { computeHysteresisState } from '../js/market.js';

describe('market dashboard classifier rendering inputs', () => {
  it('requires confirmation before escalating a volatile observation', () => {
    const result = computeHysteresisState([{
      observedAt: 1000,
      validUntil: 2000,
      volatilityBps: 3200,
      priceDivergenceBps: 120,
      bridgeNetOutflowUsd: '100000',
      stablecoinDepegBps: 10,
      liquidityDepthUsd: '25000000',
      confidenceBps: 9500
    }], 'NORMAL', 0, 1000);
    expect(result.steps).toBe('Observation 1/2 for Volatile Entry');
    expect(result.message).toContain('Awaiting confirmation');
  });
});

import { describe, it, expect } from 'vitest';
import { hashMarketSnapshot, hashYieldSnapshot, hashReasons, hashDecisionReceipt } from '../src/hashes.js';
import { MarketSnapshot, YieldSnapshot, DecisionReceipt } from '../src/types.js';

describe('hashes', () => {
  const marketSnap: MarketSnapshot = {
    observedAt: 1700000000,
    validUntil: 1700000100,
    volatilityBps: 1500,
    priceDivergenceBps: 20,
    bridgeNetOutflowUsd: 100000n,
    stablecoinDepegBps: 10,
    liquidityDepthUsd: 5000000n,
    confidenceBps: 9500,
    sourceHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
  };

  const yieldSnap: YieldSnapshot = {
    opportunityId: '0xbe713906E4D5ac544C069Cd16B2233C979b8AB5a',
    observedAt: 1700000000,
    validUntil: 1700000100,
    totalApyBps: 1200,
    baseApyBps: 800,
    rewardApyBps: 400,
    tvlUsd: 10000000n,
    netFlowUsd24h: -50000n,
    feesUsd24h: 2000n,
    liquidityDepthUsd: 2000000n,
    exitSlippageBps: 50,
    rewardTokenChangeBps7d: -300,
    confidenceBps: 9000,
    sourceHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
  };

  const receipt: DecisionReceipt = {
    reportId: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    opportunityId: '0xbe713906E4D5ac544C069Cd16B2233C979b8AB5a',
    actionType: 'DEPOSIT',
    marketRegime: 'NORMAL',
    yieldState: 'HEALTHY',
    decision: 'ALLOW',
    maxPositionUsd: 500000n,
    maxSlippageBps: 150,
    reasonsHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    validUntil: 1700000500
  };

  it('generates consistent market snapshot hashes', () => {
    const hash1 = hashMarketSnapshot(marketSnap);
    const hash2 = hashMarketSnapshot(marketSnap);
    expect(hash1).toBe(hash2);
    expect(hash1).toMatch(/^0x[a-fA-F0-9]{64}$/);
  });

  it('generates consistent yield snapshot hashes', () => {
    const hash1 = hashYieldSnapshot(yieldSnap);
    const hash2 = hashYieldSnapshot(yieldSnap);
    expect(hash1).toBe(hash2);
    expect(hash1).toMatch(/^0x[a-fA-F0-9]{64}$/);
  });

  it('generates deterministic reasons hash independent of order', () => {
    const hash1 = hashReasons(['A', 'B', 'C']);
    const hash2 = hashReasons(['C', 'B', 'A']);
    expect(hash1).toBe(hash2);
  });

  it('generates consistent decision receipt hashes', () => {
    const hash1 = hashDecisionReceipt(receipt);
    const hash2 = hashDecisionReceipt(receipt);
    expect(hash1).toBe(hash2);
    expect(hash1).toMatch(/^0x[a-fA-F0-9]{64}$/);
  });
});

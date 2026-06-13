import { describe, it, expect } from 'vitest';
import { MarketSnapshotSchema, YieldSnapshotSchema, DecisionReceiptSchema } from '../src/schemas.js';

describe('MarketSnapshotSchema', () => {
  const validSnapshot = {
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

  it('validates a correct snapshot', () => {
    const parsed = MarketSnapshotSchema.parse(validSnapshot);
    expect(parsed.observedAt).toBe(1700000000);
    expect(parsed.bridgeNetOutflowUsd).toBe(100000n);
  });

  it('rejects invalid confidence', () => {
    const invalid = { ...validSnapshot, confidenceBps: 10001 };
    expect(() => MarketSnapshotSchema.parse(invalid)).toThrow();
  });

  it('rejects stale timestamp (validUntil <= observedAt)', () => {
    const invalid = { ...validSnapshot, validUntil: 1700000000 };
    expect(() => MarketSnapshotSchema.parse(invalid)).toThrow();
  });

  it('rejects negative values', () => {
    const invalid = { ...validSnapshot, volatilityBps: -1 };
    expect(() => MarketSnapshotSchema.parse(invalid)).toThrow();
  });

  it('rejects unknown properties due to strict', () => {
    const invalid = { ...validSnapshot, unknownProp: true };
    expect(() => MarketSnapshotSchema.parse(invalid)).toThrow();
  });
});

describe('YieldSnapshotSchema', () => {
  const validYield = {
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

  it('validates a correct yield snapshot', () => {
    const parsed = YieldSnapshotSchema.parse(validYield);
    expect(parsed.totalApyBps).toBe(1200);
    expect(parsed.netFlowUsd24h).toBe(-50000n);
  });

  it('rejects invalid APY split', () => {
    const invalid = { ...validYield, rewardApyBps: 500 }; // 800 + 500 !== 1200
    expect(() => YieldSnapshotSchema.parse(invalid)).toThrow();
  });
});

describe('DecisionReceiptSchema', () => {
  const validReceipt = {
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

  it('validates a correct decision receipt', () => {
    const parsed = DecisionReceiptSchema.parse(validReceipt);
    expect(parsed.decision).toBe('ALLOW');
  });

  it('rejects invalid regime, state, or decision', () => {
    const invalid = { ...validReceipt, marketRegime: 'VERY_PANIC' };
    expect(() => DecisionReceiptSchema.parse(invalid)).toThrow();
  });
});

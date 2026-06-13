import { describe, it, expect, vi } from 'vitest';
import { getMockYieldData } from '../src/yield/mock.js';
import { normalizeYieldSnapshot } from '../src/yield/normalize.js';
import { YieldHistoryStore } from '../src/yield/history.js';
import { YieldHttpAdapter } from '../src/yield/http.js';

describe('Yield data adapters and history', () => {
  it('correctly normalizes mock HEALTHY yield data', () => {
    const raw = getMockYieldData('HEALTHY');
    const snap = normalizeYieldSnapshot(raw);

    expect(snap.totalApyBps).toBe(1200);
    expect(snap.baseApyBps).toBe(1000);
    expect(snap.rewardApyBps).toBe(200);
    expect(snap.tvlUsd).toBe(10000000n);
    expect(snap.netFlowUsd24h).toBe(50000n);
    expect(snap.feesUsd24h).toBe(5000n);
    expect(snap.exitSlippageBps).toBe(10);
    expect(snap.rewardTokenChangeBps7d).toBe(200);
    expect(snap.confidenceBps).toBe(9500);
  });

  it('correctly normalizes SUBSIDY_COLLAPSE', () => {
    const raw = getMockYieldData('SUBSIDY_COLLAPSE');
    const snap = normalizeYieldSnapshot(raw);
    expect(snap.rewardTokenChangeBps7d).toBe(-4500);
  });

  it('manages history store and calculates slope', () => {
    const store = new YieldHistoryStore(5);
    const opportunityId = '0xbe713906E4D5ac544C069Cd16B2233C979b8AB5a';

    const raw1 = getMockYieldData('HEALTHY', opportunityId);
    raw1.timestamp = 1700000000;
    raw1.totalApyRate = 0.10; // 10%
    raw1.baseApyRate = 0.08;
    raw1.rewardApyRate = 0.02;
    const snap1 = normalizeYieldSnapshot(raw1);

    const raw2 = { ...raw1, timestamp: 1700086400, totalApyRate: 0.12, baseApyRate: 0.10, rewardApyRate: 0.02 }; // +2% in 1 day
    const snap2 = normalizeYieldSnapshot(raw2);

    store.addSnapshot(snap1);
    // Insufficient data points (only 1)
    expect(store.calculateApySlope(opportunityId, 86400)).toBeNull();

    store.addSnapshot(snap2);

    // 2% is 200 bps. Over 1 day, slope should be 200 bps/day
    const slope = store.calculateApySlope(opportunityId, 86400);
    expect(slope).not.toBeNull();
    expect(Math.round(slope!)).toBe(200);
  });

  it('returns null slope when time diff is less than 1 hour', () => {
    const store = new YieldHistoryStore();
    const opportunityId = '0xbe713906E4D5ac544C069Cd16B2233C979b8AB5a';

    const raw1 = getMockYieldData('HEALTHY', opportunityId);
    raw1.timestamp = 1700000000;
    const snap1 = normalizeYieldSnapshot(raw1);

    const raw2 = { ...raw1, timestamp: 1700001800 }; // 30 mins later
    const snap2 = normalizeYieldSnapshot(raw2);

    store.addSnapshot(snap1);
    store.addSnapshot(snap2);

    expect(store.calculateApySlope(opportunityId, 3600)).toBeNull();
  });
});

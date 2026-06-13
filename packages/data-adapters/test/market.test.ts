import { describe, it, expect, vi } from 'vitest';
import { getMockMarketData } from '../src/market/mock.js';
import { normalizeMarketSnapshot } from '../src/market/normalize.js';
import { MarketHttpAdapter } from '../src/market/http.js';

describe('Market data adapters and normalization', () => {
  it('correctly retrieves and normalizes mock NORMAL market data', () => {
    const raw = getMockMarketData('NORMAL');
    const snap = normalizeMarketSnapshot(raw);

    expect(snap.volatilityBps).toBe(1800);
    expect(snap.priceDivergenceBps).toBe(10);
    expect(snap.bridgeNetOutflowUsd).toBe(1000000n);
    expect(snap.stablecoinDepegBps).toBe(10);
    expect(snap.confidenceBps).toBe(9500);
    expect(snap.liquidityDepthUsd).toBe(10000000n);
  });

  it('correctly normalizes VOLATILITY_SHOCK', () => {
    const raw = getMockMarketData('VOLATILITY_SHOCK');
    const snap = normalizeMarketSnapshot(raw);
    expect(snap.volatilityBps).toBe(3500);
  });

  it('correctly normalizes DEPEG_PANIC', () => {
    const raw = getMockMarketData('DEPEG_PANIC');
    const snap = normalizeMarketSnapshot(raw);
    expect(snap.stablecoinDepegBps).toBe(250);
  });

  it('correctly normalizes LOW_CONFIDENCE', () => {
    const raw = getMockMarketData('LOW_CONFIDENCE');
    const snap = normalizeMarketSnapshot(raw);
    expect(snap.confidenceBps).toBe(5500);
  });

  it('fetches market data via HTTP adapter', async () => {
    const mockResponse = {
      timestamp: 1700000000,
      volatilityRate: 0.2,
      cexPrice: 100,
      dexPrice: 101,
      bridgeOutflowPerHour: "5000000",
      stablecoinPrice: 0.99,
      oracleConfidence: 0.9,
      source: "API"
    };

    // Mock global fetch
    const globalFetch = global.fetch;
    global.fetch = vi.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })
    ) as any;

    const adapter = new MarketHttpAdapter({ apiUrl: 'https://test.api' });
    const raw = await adapter.fetchRawMarketData();

    expect(raw.volatilityRate).toBe(0.2);
    expect(raw.bridgeOutflowPerHour).toBe("5000000");

    // Restore fetch
    global.fetch = globalFetch;
  });
});

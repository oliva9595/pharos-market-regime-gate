"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const mock_js_1 = require("../src/market/mock.js");
const normalize_js_1 = require("../src/market/normalize.js");
const http_js_1 = require("../src/market/http.js");
(0, vitest_1.describe)('Market data adapters and normalization', () => {
    (0, vitest_1.it)('correctly retrieves and normalizes mock NORMAL market data', () => {
        const raw = (0, mock_js_1.getMockMarketData)('NORMAL');
        const snap = (0, normalize_js_1.normalizeMarketSnapshot)(raw);
        (0, vitest_1.expect)(snap.volatilityBps).toBe(1800);
        (0, vitest_1.expect)(snap.priceDivergenceBps).toBe(10);
        (0, vitest_1.expect)(snap.bridgeNetOutflowUsd).toBe(1000000n);
        (0, vitest_1.expect)(snap.stablecoinDepegBps).toBe(10);
        (0, vitest_1.expect)(snap.confidenceBps).toBe(9500);
        (0, vitest_1.expect)(snap.liquidityDepthUsd).toBe(10000000n);
    });
    (0, vitest_1.it)('correctly normalizes VOLATILITY_SHOCK', () => {
        const raw = (0, mock_js_1.getMockMarketData)('VOLATILITY_SHOCK');
        const snap = (0, normalize_js_1.normalizeMarketSnapshot)(raw);
        (0, vitest_1.expect)(snap.volatilityBps).toBe(3500);
    });
    (0, vitest_1.it)('correctly normalizes DEPEG_PANIC', () => {
        const raw = (0, mock_js_1.getMockMarketData)('DEPEG_PANIC');
        const snap = (0, normalize_js_1.normalizeMarketSnapshot)(raw);
        (0, vitest_1.expect)(snap.stablecoinDepegBps).toBe(250);
    });
    (0, vitest_1.it)('correctly normalizes LOW_CONFIDENCE', () => {
        const raw = (0, mock_js_1.getMockMarketData)('LOW_CONFIDENCE');
        const snap = (0, normalize_js_1.normalizeMarketSnapshot)(raw);
        (0, vitest_1.expect)(snap.confidenceBps).toBe(5500);
    });
    (0, vitest_1.it)('fetches market data via HTTP adapter', async () => {
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
        global.fetch = vitest_1.vi.fn().mockImplementation(() => Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockResponse),
        }));
        const adapter = new http_js_1.MarketHttpAdapter({ apiUrl: 'https://test.api' });
        const raw = await adapter.fetchRawMarketData();
        (0, vitest_1.expect)(raw.volatilityRate).toBe(0.2);
        (0, vitest_1.expect)(raw.bridgeOutflowPerHour).toBe("5000000");
        // Restore fetch
        global.fetch = globalFetch;
    });
});
//# sourceMappingURL=market.test.js.map
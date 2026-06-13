"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeMarketSnapshot = normalizeMarketSnapshot;
const ethers_1 = require("ethers");
const risk_core_1 = require("@pharos/risk-core");
function normalizeMarketSnapshot(raw, liquidityDepthUsd) {
    const volatilityBps = Math.round(raw.volatilityRate * 10000);
    const priceDivergenceBps = raw.cexPrice > 0
        ? Math.round((Math.abs(raw.cexPrice - raw.dexPrice) / raw.cexPrice) * 10000)
        : 0;
    const bridgeNetOutflowUsd = BigInt(raw.bridgeOutflowPerHour);
    const stablecoinDepegBps = Math.round(Math.abs(1.0 - raw.stablecoinPrice) * 10000);
    const confidenceBps = Math.round(raw.oracleConfidence * 10000);
    const sourceHash = (0, ethers_1.keccak256)((0, ethers_1.toUtf8Bytes)(raw.source));
    const snapshot = {
        observedAt: raw.timestamp,
        validUntil: raw.timestamp + 300, // 5 minutes validity
        volatilityBps,
        priceDivergenceBps,
        bridgeNetOutflowUsd,
        stablecoinDepegBps,
        liquidityDepthUsd: liquidityDepthUsd ?? 10000000n, // default 10M USD
        confidenceBps,
        sourceHash
    };
    // Validate using Zod schema to ensure completeness and strictness
    return risk_core_1.MarketSnapshotSchema.parse(snapshot);
}
//# sourceMappingURL=normalize.js.map
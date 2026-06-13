import { keccak256, toUtf8Bytes } from 'ethers';
import { MarketSnapshot, MarketSnapshotSchema } from '@pharos/risk-core';
import { RawMarketData } from './types.js';

export function normalizeMarketSnapshot(raw: RawMarketData, liquidityDepthUsd?: bigint): MarketSnapshot {
  const volatilityBps = Math.round(raw.volatilityRate * 10000);
  
  const priceDivergenceBps = raw.cexPrice > 0 
    ? Math.round((Math.abs(raw.cexPrice - raw.dexPrice) / raw.cexPrice) * 10000)
    : 0;

  const bridgeNetOutflowUsd = BigInt(raw.bridgeOutflowPerHour);
  
  const stablecoinDepegBps = Math.round(Math.abs(1.0 - raw.stablecoinPrice) * 10000);
  
  const confidenceBps = Math.round(raw.oracleConfidence * 10000);
  
  const sourceHash = keccak256(toUtf8Bytes(raw.source)) as `0x${string}`;

  const snapshot: MarketSnapshot = {
    observedAt: raw.timestamp,
    validUntil: raw.timestamp + 300, // 5 minutes validity
    volatilityBps,
    priceDivergenceBps,
    bridgeNetOutflowUsd,
    stablecoinDepegBps,
    liquidityDepthUsd: liquidityDepthUsd ?? 10_000_000n, // default 10M USD
    confidenceBps,
    sourceHash
  };

  // Validate using Zod schema to ensure completeness and strictness
  return MarketSnapshotSchema.parse(snapshot) as MarketSnapshot;
}

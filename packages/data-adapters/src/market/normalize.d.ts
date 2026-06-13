import { MarketSnapshot } from '@pharos/risk-core';
import { RawMarketData } from './types.js';
export declare function normalizeMarketSnapshot(raw: RawMarketData, liquidityDepthUsd?: bigint): MarketSnapshot;

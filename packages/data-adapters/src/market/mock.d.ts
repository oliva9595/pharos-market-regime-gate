import { RawMarketData } from './types.js';
export declare function getMockMarketData(scenario: 'NORMAL' | 'VOLATILITY_SHOCK' | 'DIVERGENCE_SHOCK' | 'OUTFLOW_PANIC' | 'DEPEG_PANIC' | 'LOW_CONFIDENCE'): RawMarketData;

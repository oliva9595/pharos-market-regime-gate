import { RawMarketData } from './types.js';
export interface MarketApiConfig {
    apiUrl: string;
    apiKey?: string;
    timeoutMs?: number;
}
export declare class MarketHttpAdapter {
    private config;
    constructor(config: MarketApiConfig);
    fetchRawMarketData(): Promise<RawMarketData>;
}

import { RawMarketData } from './types.js';

export interface MarketApiConfig {
  apiUrl: string;
  apiKey?: string;
  timeoutMs?: number;
}

export class MarketHttpAdapter {
  private config: MarketApiConfig;

  constructor(config: MarketApiConfig) {
    this.config = config;
  }

  async fetchRawMarketData(): Promise<RawMarketData> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs ?? 5000);

    try {
      const response = await fetch(this.config.apiUrl, {
        method: 'GET',
        headers,
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`Market HTTP Adapter failed: HTTP status ${response.status}`);
      }

      const body = await response.json() as any;
      
      // Parse response fields safely
      const rawData: RawMarketData = {
        timestamp: Number(body.timestamp ?? Math.floor(Date.now() / 1000)),
        volatilityRate: Number(body.volatilityRate ?? 0),
        cexPrice: Number(body.cexPrice ?? 0),
        dexPrice: Number(body.dexPrice ?? 0),
        bridgeOutflowPerHour: body.bridgeOutflowPerHour ? String(body.bridgeOutflowPerHour) : "0",
        stablecoinPrice: Number(body.stablecoinPrice ?? 1.0),
        oracleConfidence: Number(body.oracleConfidence ?? 1.0),
        source: String(body.source ?? this.config.apiUrl)
      };

      return rawData;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error('Market HTTP Adapter request timed out');
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }
}

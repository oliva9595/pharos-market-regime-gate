import { RawYieldData } from './types.js';

export interface YieldApiConfig {
  apiUrl: string;
  apiKey?: string;
  timeoutMs?: number;
}

export class YieldHttpAdapter {
  private config: YieldApiConfig;

  constructor(config: YieldApiConfig) {
    this.config = config;
  }

  async fetchRawYieldData(opportunityId: string): Promise<RawYieldData> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs ?? 5000);

    try {
      const url = `${this.config.apiUrl}?opportunityId=${opportunityId}`;
      const response = await fetch(url, {
        method: 'GET',
        headers,
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`Yield HTTP Adapter failed: HTTP status ${response.status}`);
      }

      const body = await response.json() as any;
      
      const rawData: RawYieldData = {
        opportunityId: String(body.opportunityId ?? opportunityId),
        timestamp: Number(body.timestamp ?? Math.floor(Date.now() / 1000)),
        totalApyRate: Number(body.totalApyRate ?? 0),
        baseApyRate: Number(body.baseApyRate ?? 0),
        rewardApyRate: Number(body.rewardApyRate ?? 0),
        tvlUsd: body.tvlUsd ? String(body.tvlUsd) : "0",
        netFlowUsd24h: body.netFlowUsd24h ? String(body.netFlowUsd24h) : "0",
        feesUsd24h: body.feesUsd24h ? String(body.feesUsd24h) : "0",
        liquidityDepthUsd: body.liquidityDepthUsd ? String(body.liquidityDepthUsd) : "0",
        exitSlippageRate: Number(body.exitSlippageRate ?? 0),
        rewardTokenPriceChange7d: Number(body.rewardTokenPriceChange7d ?? 0),
        oracleConfidence: Number(body.oracleConfidence ?? 1.0),
        source: String(body.source ?? this.config.apiUrl)
      };

      return rawData;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error('Yield HTTP Adapter request timed out');
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }
}

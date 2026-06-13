import { MarketSnapshot, YieldSnapshot } from '@pharos/risk-core';
import { getMockMarketData, normalizeMarketSnapshot, getMockYieldData, normalizeYieldSnapshot } from '@pharos/data-adapters';

export class DataCollector {
  private useMock: boolean;

  constructor(useMock = true) {
    this.useMock = useMock;
  }

  collectMarketSnapshot(): MarketSnapshot {
    if (this.useMock) {
      // Deterministic NORMAL scenario in collector
      const raw = getMockMarketData('NORMAL');
      return normalizeMarketSnapshot(raw);
    }
    throw new Error('DataCollector: HTTP collection not configured');
  }

  collectYieldSnapshot(opportunityId: string): YieldSnapshot {
    if (this.useMock) {
      const raw = getMockYieldData('HEALTHY', opportunityId);
      return normalizeYieldSnapshot(raw);
    }
    throw new Error('DataCollector: HTTP collection not configured');
  }
}

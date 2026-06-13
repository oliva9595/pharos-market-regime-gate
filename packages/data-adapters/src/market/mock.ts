import { RawMarketData } from './types.js';

export function getMockMarketData(scenario: 'NORMAL' | 'VOLATILITY_SHOCK' | 'DIVERGENCE_SHOCK' | 'OUTFLOW_PANIC' | 'DEPEG_PANIC' | 'LOW_CONFIDENCE'): RawMarketData {
  const now = Math.floor(Date.now() / 1000);
  switch (scenario) {
    case 'NORMAL':
      return {
        timestamp: now,
        volatilityRate: 0.18, // 18% (1800 bps)
        cexPrice: 1000,
        dexPrice: 1001, // 10 bps divergence
        bridgeOutflowPerHour: "1000000", // 1M
        stablecoinPrice: 0.999, // 10 bps depeg
        oracleConfidence: 0.95, // 95%
        source: "Chainlink/Pyth Multi-Oracle Aggregate"
      };
    case 'VOLATILITY_SHOCK':
      return {
        timestamp: now,
        volatilityRate: 0.35, // 35% (3500 bps) - triggers volatile
        cexPrice: 1000,
        dexPrice: 1005, // 50 bps divergence
        bridgeOutflowPerHour: "2000000",
        stablecoinPrice: 0.998,
        oracleConfidence: 0.90,
        source: "Chainlink/Pyth Multi-Oracle Aggregate"
      };
    case 'DIVERGENCE_SHOCK':
      return {
        timestamp: now,
        volatilityRate: 0.22,
        cexPrice: 1000,
        dexPrice: 1012, // 120 bps divergence - triggers volatile
        bridgeOutflowPerHour: "1500000",
        stablecoinPrice: 0.999,
        oracleConfidence: 0.92,
        source: "Chainlink/Pyth Multi-Oracle Aggregate"
      };
    case 'OUTFLOW_PANIC':
      return {
        timestamp: now,
        volatilityRate: 0.28,
        cexPrice: 1000,
        dexPrice: 1008,
        bridgeOutflowPerHour: "12000000", // 12M outflow per hour - triggers panic
        stablecoinPrice: 0.995,
        oracleConfidence: 0.88,
        source: "Chainlink/Pyth Multi-Oracle Aggregate"
      };
    case 'DEPEG_PANIC':
      return {
        timestamp: now,
        volatilityRate: 0.25,
        cexPrice: 1.0,
        dexPrice: 0.975, // 250 bps depeg - triggers panic
        bridgeOutflowPerHour: "4000000",
        stablecoinPrice: 0.975, // 250 bps depeg
        oracleConfidence: 0.90,
        source: "Chainlink/Pyth Multi-Oracle Aggregate"
      };
    case 'LOW_CONFIDENCE':
      return {
        timestamp: now,
        volatilityRate: 0.15,
        cexPrice: 1000,
        dexPrice: 1001,
        bridgeOutflowPerHour: "500000",
        stablecoinPrice: 0.999,
        oracleConfidence: 0.55, // 55% confidence - triggers panic
        source: "Chainlink/Pyth Multi-Oracle Aggregate"
      };
  }
}

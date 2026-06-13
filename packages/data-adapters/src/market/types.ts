export interface RawMarketData {
  timestamp: number;
  volatilityRate: number; // e.g. 0.35 for 35%
  cexPrice: number;
  dexPrice: number;
  bridgeOutflowPerHour: string | number; // e.g. "5000000" or 5000000
  stablecoinPrice: number; // e.g. 0.995 for 50bps depeg
  oracleConfidence: number; // e.g. 0.85 for 85%
  source: string;
}

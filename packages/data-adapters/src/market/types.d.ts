export interface RawMarketData {
    timestamp: number;
    volatilityRate: number;
    cexPrice: number;
    dexPrice: number;
    bridgeOutflowPerHour: string | number;
    stablecoinPrice: number;
    oracleConfidence: number;
    source: string;
}

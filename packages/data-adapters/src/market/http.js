"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketHttpAdapter = void 0;
class MarketHttpAdapter {
    config;
    constructor(config) {
        this.config = config;
    }
    async fetchRawMarketData() {
        const headers = {
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
            const body = await response.json();
            // Parse response fields safely
            const rawData = {
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
        }
        catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('Market HTTP Adapter request timed out');
            }
            throw error;
        }
        finally {
            clearTimeout(timeout);
        }
    }
}
exports.MarketHttpAdapter = MarketHttpAdapter;
//# sourceMappingURL=http.js.map
import { FastifyInstance } from 'fastify';
import { SentinelStore } from '../store.js';
import { classifyMarketRegime, MarketSnapshot } from '@pharos/risk-core';

export function registerMarketRoutes(fastify: FastifyInstance, store: SentinelStore) {
  fastify.get('/api/market/status', async (request, reply) => {
    const history = store.getMarketHistory(50);
    const latest = history[history.length - 1];
    
    if (!latest) {
      return { regime: 'NORMAL', reasons: [], history: [] };
    }

    const classification = classifyMarketRegime(history);
    
    // Convert bigint values to string in response JSON to prevent JSON serialization errors
    const serializedHistory = history.map((s: MarketSnapshot) => ({
      ...s,
      bridgeNetOutflowUsd: s.bridgeNetOutflowUsd.toString(),
      liquidityDepthUsd: s.liquidityDepthUsd.toString()
    }));

    return {
      regime: classification.regime,
      reasons: classification.reasons,
      reasonsHash: classification.reasonsHash,
      latest: {
        ...latest,
        bridgeNetOutflowUsd: latest.bridgeNetOutflowUsd.toString(),
        liquidityDepthUsd: latest.liquidityDepthUsd.toString()
      },
      history: serializedHistory
    };
  });
}

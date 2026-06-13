import { FastifyInstance } from 'fastify';
import { SentinelStore } from '../store.js';
import { evaluateYieldDecay, YieldSnapshot } from '@pharos/risk-core';
import { YieldHistoryStore } from '@pharos/data-adapters';

export function registerYieldRoutes(fastify: FastifyInstance, store: SentinelStore) {
  fastify.get('/api/yield/status', async (request, reply) => {
    const { opportunityId } = request.query as { opportunityId?: string };
    if (!opportunityId) {
      reply.status(400).send({ error: 'opportunityId query parameter is required' });
      return;
    }

    const history = store.getYieldHistory(opportunityId, 50);
    const latest = history[history.length - 1];

    if (!latest) {
      return { yieldState: 'HEALTHY', decayScore: 0, factors: {}, history: [] };
    }

    // Build temporary history store to compute APY slope
    const tempStore = new YieldHistoryStore();
    for (const snap of history) {
      tempStore.addSnapshot(snap);
    }
    const slope = tempStore.calculateApySlope(opportunityId, 86400);

    const result = evaluateYieldDecay(latest, slope);

    const serializedHistory = history.map((s: YieldSnapshot) => ({
      ...s,
      tvlUsd: s.tvlUsd.toString(),
      netFlowUsd24h: s.netFlowUsd24h.toString(),
      feesUsd24h: s.feesUsd24h.toString(),
      liquidityDepthUsd: s.liquidityDepthUsd.toString()
    }));

    return {
      opportunityId: result.opportunityId,
      decayScore: result.decayScore,
      yieldState: result.yieldState,
      factors: result.factors,
      reasons: result.reasons,
      reasonsHash: result.reasonsHash,
      latest: {
        ...latest,
        tvlUsd: latest.tvlUsd.toString(),
        netFlowUsd24h: latest.netFlowUsd24h.toString(),
        feesUsd24h: latest.feesUsd24h.toString(),
        liquidityDepthUsd: latest.liquidityDepthUsd.toString()
      },
      history: serializedHistory
    };
  });
}

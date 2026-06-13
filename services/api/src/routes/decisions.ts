import { FastifyInstance } from 'fastify';
import { SentinelStore } from '../store.js';

export function registerDecisionsRoutes(fastify: FastifyInstance, store: SentinelStore) {
  fastify.get('/api/decisions/history', async (request, reply) => {
    const history = store.getDecisionsHistory(50);
    
    const serializedHistory = history.map(d => ({
      ...d,
      maxPositionUsd: d.maxPositionUsd.toString()
    }));

    return {
      history: serializedHistory
    };
  });

  // Submit a decision receipt to the analytics store
  fastify.post('/api/decisions', async (request, reply) => {
    const body = request.body as any;
    if (!body || !body.reportId || !body.opportunityId || !body.decision) {
      reply.status(400).send({ error: 'Invalid decision receipt body' });
      return;
    }

    try {
      const receipt = {
        reportId: body.reportId,
        opportunityId: body.opportunityId,
        actionType: String(body.actionType),
        marketRegime: body.marketRegime,
        yieldState: body.yieldState,
        decision: body.decision,
        maxPositionUsd: BigInt(body.maxPositionUsd ?? 0),
        maxSlippageBps: Number(body.maxSlippageBps ?? 0),
        reasonsHash: body.reasonsHash,
        validUntil: Number(body.validUntil ?? 0)
      };

      store.addDecision(receipt);
      return { success: true };
    } catch (err: any) {
      reply.status(500).send({ error: err.message });
    }
  });
}

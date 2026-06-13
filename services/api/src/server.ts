import fastify from 'fastify';
import cors from '@fastify/cors';
import { SentinelStore } from './store.js';
import { registerMarketRoutes } from './routes/market.js';
import { registerYieldRoutes } from './routes/yield.js';
import { registerDecisionsRoutes } from './routes/decisions.js';

import { getMockMarketData, normalizeMarketSnapshot, getMockYieldData, normalizeYieldSnapshot } from '@pharos/data-adapters';

const server = fastify({ logger: true });

// Setup CORS
server.register(cors, {
  origin: '*', // allow dashboard access
  methods: ['GET', 'POST']
});

const store = new SentinelStore();

// Telemetry Generator Loop
const runTelemetryLoop = () => {
  const opportunityIds = (process.env.OPPORTUNITY_IDS ?? '0x809d550fca64d94Bd9F66E60752A544199cfAC3D,0x4c5859f0F772848b2D91F1D83E2Fe57935348029')
    .split(',')
    .filter(x => x.length > 0);

  // Pre-populate if empty
  if (store.getMarketHistory().length === 0) {
    console.log('Pre-populating historical telemetry...');
    const now = Math.floor(Date.now() / 1000);
    for (let i = 30; i > 0; i--) {
      const ts = now - i * 15;
      
      // Market snapshot
      const rawMarket = getMockMarketData('NORMAL');
      rawMarket.timestamp = ts;
      rawMarket.volatilityRate = 0.15 + (Math.random() * 0.05); // 15%-20%
      rawMarket.cexPrice = 1000;
      rawMarket.dexPrice = 1001;
      const marketSnap = normalizeMarketSnapshot(rawMarket);
      store.addMarketSnapshot(marketSnap);

      // Yield snapshots
      for (const oppId of opportunityIds) {
        const rawYield = getMockYieldData('HEALTHY', oppId);
        rawYield.timestamp = ts;
        rawYield.totalApyRate = 0.12;
        rawYield.baseApyRate = 0.10;
        rawYield.rewardApyRate = 0.02;
        rawYield.tvlUsd = "10000000";
        const yieldSnap = normalizeYieldSnapshot(rawYield);
        store.addYieldSnapshot(yieldSnap);
      }
    }
  }

  // Periodic updates
  setInterval(() => {
    try {
      const now = Math.floor(Date.now() / 1000);
      
      // Market snapshot
      const rawMarket = getMockMarketData('NORMAL');
      rawMarket.timestamp = now;
      rawMarket.volatilityRate = 0.15 + (Math.random() * 0.05);
      rawMarket.cexPrice = 1000;
      rawMarket.dexPrice = 1001;
      const marketSnap = normalizeMarketSnapshot(rawMarket);
      store.addMarketSnapshot(marketSnap);

      // Yield snapshots
      for (const oppId of opportunityIds) {
        const rawYield = getMockYieldData('HEALTHY', oppId);
        rawYield.timestamp = now;
        rawYield.totalApyRate = 0.10 + (Math.random() * 0.04);
        rawYield.baseApyRate = rawYield.totalApyRate - 0.02;
        rawYield.rewardApyRate = 0.02;
        rawYield.tvlUsd = "10000000";
        const yieldSnap = normalizeYieldSnapshot(rawYield);
        store.addYieldSnapshot(yieldSnap);
      }
    } catch (err) {
      console.error('Telemetry generator loop error:', err);
    }
  }, 5000);
};

// Health Check
server.get('/health', async () => {
  return { status: 'OK', timestamp: Math.floor(Date.now() / 1000) };
});

// Register routes
registerMarketRoutes(server, store);
registerYieldRoutes(server, store);
registerDecisionsRoutes(server, store);

const port = Number(process.env.PORT ?? 3000);

const start = async () => {
  try {
    runTelemetryLoop();
    await server.listen({ port, host: '0.0.0.0' });
    console.log(`Sentinel API Server listening on port ${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

// Start if executed directly
if (process.argv[1] && process.argv[1].endsWith('server.js')) {
  start();
}

export { server, store };

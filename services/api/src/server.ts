import fastify from 'fastify';
import cors from '@fastify/cors';
import { SentinelStore } from './store.js';
import { registerMarketRoutes } from './routes/market.js';
import { registerYieldRoutes } from './routes/yield.js';
import { registerDecisionsRoutes } from './routes/decisions.js';

const server = fastify({ logger: true });

// Setup CORS
server.register(cors, {
  origin: '*', // allow dashboard access
  methods: ['GET', 'POST']
});

const store = new SentinelStore();

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

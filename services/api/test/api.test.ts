import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { server, store } from '../src/server.js';
import fs from 'fs';

describe('Sentinel V2 Analytics API', () => {
  beforeAll(async () => {
    // Wait for fastify to be ready
    await server.ready();
  });

  afterAll(async () => {
    await server.close();
    // Clean up test database file
    if (fs.existsSync('./sentinel-db.json')) {
      fs.unlinkSync('./sentinel-db.json');
    }
  });

  it('responds to /health check', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/health'
    });
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.status).toBe('OK');
  });

  it('can ingest and query decisions history', async () => {
    const decisionReceipt = {
      reportId: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      opportunityId: '0xbe713906E4D5ac544C069Cd16B2233C979b8AB5a',
      actionType: 'DEPOSIT',
      marketRegime: 'NORMAL',
      yieldState: 'HEALTHY',
      decision: 'ALLOW',
      maxPositionUsd: '100000',
      maxSlippageBps: 100,
      reasonsHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      validUntil: 1700000500
    };

    const postResponse = await server.inject({
      method: 'POST',
      url: '/api/decisions',
      payload: decisionReceipt
    });
    expect(postResponse.statusCode).toBe(200);

    const getResponse = await server.inject({
      method: 'GET',
      url: '/api/decisions/history'
    });
    expect(getResponse.statusCode).toBe(200);
    const getBody = JSON.parse(getResponse.body);
    expect(getBody.history.length).toBeGreaterThan(0);
    expect(getBody.history[0].decision).toBe('ALLOW');
  });
});

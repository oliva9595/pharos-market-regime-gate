import { CONFIG } from './config.js';
import { stateStore } from './state.js';

export const apiClient = {
  async fetchMarketStatus() {
    const currentState = stateStore.getState();
    if (currentState.mode === 'mock') {
      return this.getMockMarketStatus();
    }
    const res = await fetch(`${CONFIG.API_BASE_URL}/api/market/status`);
    if (!res.ok) throw new Error(`API returned status ${res.status}`);
    return await res.json();
  },

  async fetchYieldStatus(opportunityId) {
    const currentState = stateStore.getState();
    if (currentState.mode === 'mock') {
      return this.getMockYieldStatus(opportunityId);
    }
    const res = await fetch(`${CONFIG.API_BASE_URL}/api/yield/status?opportunityId=${opportunityId}`);
    if (!res.ok) throw new Error(`API returned status ${res.status}`);
    return await res.json();
  },

  async fetchDecisionsHistory() {
    const currentState = stateStore.getState();
    if (currentState.mode === 'mock') {
      return this.getMockDecisionsHistory();
    }
    const res = await fetch(`${CONFIG.API_BASE_URL}/api/decisions/history`);
    if (!res.ok) throw new Error(`API returned status ${res.status}`);
    return await res.json();
  },

  async submitDecisionReceipt(receipt) {
    const currentState = stateStore.getState();
    if (currentState.mode === 'mock') {
      return { success: true };
    }
    try {
      const res = await fetch(`${CONFIG.API_BASE_URL}/api/decisions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(receipt)
      });
      return await res.json();
    } catch (err) {
      console.error('Failed to submit decision receipt:', err);
      return { success: false, error: err.message };
    }
  },

  getMockMarketStatus() {
    // Determine regime mock based on time/state or provide a standard normal response
    return {
      regime: 'NORMAL',
      reasons: ['Systemic parameters within acceptable ranges', 'Oracle confidence level optimal'],
      reasonsHash: '0x7b23cfefca623b32009ad16fbd97d2e85ab89d3110940562e8311029e84b8d7a',
      latest: {
        observedAt: Math.floor(Date.now() / 1000),
        validUntil: Math.floor(Date.now() / 1000) + 3600,
        volatilityBps: 1250, // 12.5%
        priceDivergenceBps: 15, // 0.15%
        bridgeNetOutflowUsd: '450000',
        stablecoinDepegBps: 8, // 0.08%
        liquidityDepthUsd: '25000000',
        confidenceBps: 9850 // 98.5%
      },
      history: []
    };
  },

  getMockYieldStatus(opportunityId) {
    return {
      opportunityId: opportunityId,
      decayScore: 18,
      yieldState: 'HEALTHY',
      factors: {
        apyDrop: 3,
        tvlOutflow: 5,
        feeDecline: 2,
        exitSlippage: 8
      },
      reasons: ['Base yield supports reward dilution', 'TVL net flow is positive'],
      reasonsHash: '0x8b32cfefca623b32009ad16fbd97d2e85ab89d3110940562e8311029e84b8d7a',
      latest: {
        opportunityId: opportunityId,
        observedAt: Math.floor(Date.now() / 1000),
        validUntil: Math.floor(Date.now() / 1000) + 3600,
        tvlUsd: '18500000',
        netFlowUsd24h: '120000',
        feesUsd24h: '9400',
        apyBps: 1450, // 14.5%
        baseApyBps: 600, // 6%
        rewardApyBps: 850, // 8.5%
        liquidityDepthUsd: '8000000',
        confidenceBps: 9780 // 97.8%
      },
      history: []
    };
  },

  getMockDecisionsHistory() {
    return {
      history: [
        {
          reportId: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          opportunityId: CONFIG.CONTRACTS.ProtocolRegistry,
          actionType: 'DEPOSIT',
          marketRegime: 'NORMAL',
          yieldState: 'HEALTHY',
          decision: 'ALLOW',
          maxPositionUsd: '100000',
          maxSlippageBps: 100,
          reasonsHash: '0x8b32cfefca623b32009ad16fbd97d2e85ab89d3110940562e8311029e84b8d7a',
          validUntil: Math.floor(Date.now() / 1000) + 1800
        }
      ]
    };
  }
};

import { CONFIG } from './config.js';
import { stateStore } from './state.js';
import { classifyMarketRegime, getHumanReadableReason } from './market.js';

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
    const state = stateStore.getState();
    const shock = state.shockScenario || 'none';
    const now = Math.floor(Date.now() / 1000);

    // Helper: Jitter value slightly
    const jitter = (val, range = 50) => val + Math.floor(Math.random() * range) - Math.floor(range / 2);

    let volatilityBps = 1800; // 18% base
    let priceDivergenceBps = 15; // 0.15% base
    let bridgeNetOutflowUsd = 450000n;
    let stablecoinDepegBps = 8;
    let confidenceBps = 9850;
    let validUntil = now + 30; // 30s validity

    if (shock === 'volatility') {
      volatilityBps = 3500; // Volatile entry threshold is >= 3000
    } else if (shock === 'volatility_spike') {
      volatilityBps = 4800; // Panic entry threshold is >= 4500
      priceDivergenceBps = 240; // Elevate price divergence to trigger VOLATILE conditions as well
    } else if (shock === 'divergence') {
      priceDivergenceBps = 120; // Volatile entry threshold is >= 100
      volatilityBps = 3100; // Need a second volatile signal to trigger VOLATILE regime (2 signals rule)
    } else if (shock === 'outflow') {
      bridgeNetOutflowUsd = 12000000n; // Panic entry threshold is >= 10M
    } else if (shock === 'depeg') {
      stablecoinDepegBps = 220; // Panic entry threshold is >= 200
    } else if (shock === 'stale') {
      confidenceBps = 5500; // Panic entry threshold is < 6000
      validUntil = now - 5; // Stale timestamp to trigger immediate stale panic check
    } else if (shock === 'recovery') {
      volatilityBps = 1800;
      priceDivergenceBps = 15;
      bridgeNetOutflowUsd = 450000n;
      stablecoinDepegBps = 8;
      confidenceBps = 9850;
    }

    // Apply jitter to active mock signals unless they are hard-coded shock values
    if (shock !== 'volatility' && shock !== 'volatility_spike') {
      volatilityBps = Math.max(1000, jitter(volatilityBps, 150));
    }
    if (shock !== 'divergence' && shock !== 'volatility_spike') {
      priceDivergenceBps = Math.max(5, jitter(priceDivergenceBps, 6));
    }
    if (shock !== 'outflow') {
      bridgeNetOutflowUsd = BigInt(Math.max(100000, Number(bridgeNetOutflowUsd) + Math.floor(Math.random() * 100000) - 50000));
    }
    if (shock !== 'depeg') {
      stablecoinDepegBps = Math.max(2, jitter(stablecoinDepegBps, 4));
    }
    if (shock !== 'stale') {
      confidenceBps = Math.max(9000, Math.min(10000, jitter(confidenceBps, 40)));
    }

    const newSnap = {
      observedAt: now,
      validUntil: validUntil,
      volatilityBps: volatilityBps,
      priceDivergenceBps: priceDivergenceBps,
      bridgeNetOutflowUsd: String(bridgeNetOutflowUsd),
      stablecoinDepegBps: stablecoinDepegBps,
      liquidityDepthUsd: '25000000',
      confidenceBps: confidenceBps
    };

    // Pre-populate history if it's empty
    let history = [...(state.marketStatus.history || [])];
    if (history.length === 0) {
      for (let i = 25; i > 0; i--) {
        const hTime = now - i * 3;
        history.push({
          observedAt: hTime,
          validUntil: hTime + 30,
          volatilityBps: Math.max(1000, jitter(1800, 150)),
          priceDivergenceBps: Math.max(5, jitter(15, 6)),
          bridgeNetOutflowUsd: String(BigInt(Math.max(100000, 450000 + Math.floor(Math.random() * 100000) - 50000))),
          stablecoinDepegBps: Math.max(2, jitter(8, 4)),
          liquidityDepthUsd: '25000000',
          confidenceBps: Math.max(9000, Math.min(10000, jitter(9850, 40)))
        });
      }
    }

    // Append new snapshot
    history.push(newSnap);
    if (history.length > 50) {
      history.shift();
    }

    const prevResult = {
      regime: state.marketStatus.regime,
      reasons: state.marketStatus.reasons || [],
      reasonsHash: state.marketStatus.reasonsHash || '0x0000000000000000000000000000000000000000000000000000000000000000',
      transitionEligibleAt: state.marketStatus.transitionEligibleAt || 0
    };

    const classification = classifyMarketRegime(history, prevResult, { cooldownSeconds: 60 }, now);

    // Map raw reasons to clean descriptions
    const formattedReasons = classification.reasons.map(r => getHumanReadableReason(r));

    return {
      regime: classification.regime,
      reasons: formattedReasons,
      reasonsHash: classification.reasonsHash,
      transitionEligibleAt: classification.transitionEligibleAt,
      latest: newSnap,
      history: history
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

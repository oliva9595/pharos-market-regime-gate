import { CONFIG } from './config.js';
import { stateStore } from './state.js';
import { classifyMarketRegime, getHumanReadableReason } from './market.js';
import { classifyYieldState, getHumanReadableYieldReason } from './yield.js';

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
    const state = stateStore.getState();
    const scenario = state.yieldScenario || 'healthy';
    const now = Math.floor(Date.now() / 1000);

    const jitter = (val, range = 50) => val + Math.floor(Math.random() * range) - Math.floor(range / 2);
    const jitterBigInt = (val, range = 50000n) => val + BigInt(Math.floor(Math.random() * Number(range)) - Math.floor(Number(range) / 2));

    let totalApyBps = 1200;
    let baseApyBps = 1000;
    let rewardApyBps = 200;
    let tvlUsd = 10000000n;
    let netFlowUsd24h = 50000n;
    let feesUsd24h = 5000n;
    let liquidityDepthUsd = 2000000n;
    let exitSlippageBps = 10;
    let rewardTokenChangeBps7d = 200;
    let confidenceBps = 9500;
    let validUntil = now + 300;

    if (scenario === 'subsidy_collapse') {
      totalApyBps = 300;
      baseApyBps = 200;
      rewardApyBps = 100;
      tvlUsd = 8000000n;
      netFlowUsd24h = -1000000n;
      feesUsd24h = 1000n;
      liquidityDepthUsd = 1500000n;
      exitSlippageBps = 50;
      rewardTokenChangeBps7d = -4500;
      confidenceBps = 9000;
    } else if (scenario === 'mercenary_tvl') {
      totalApyBps = 1500;
      baseApyBps = 300;
      rewardApyBps = 1200;
      tvlUsd = 5000000n;
      netFlowUsd24h = -2500000n;
      feesUsd24h = 800n;
      liquidityDepthUsd = 1000000n;
      exitSlippageBps = 80;
      rewardTokenChangeBps7d = -3000;
      confidenceBps = 9200;
    } else if (scenario === 'fee_collapse') {
      totalApyBps = 500;
      baseApyBps = 400;
      rewardApyBps = 100;
      tvlUsd = 9000000n;
      netFlowUsd24h = -100000n;
      feesUsd24h = 50n;
      liquidityDepthUsd = 1800000n;
      exitSlippageBps = 15;
      rewardTokenChangeBps7d = -500;
      confidenceBps = 9500;
    } else if (scenario === 'slippage_surge') {
      totalApyBps = 1000;
      baseApyBps = 800;
      rewardApyBps = 200;
      tvlUsd = 7000000n;
      netFlowUsd24h = -1500000n;
      feesUsd24h = 3000n;
      liquidityDepthUsd = 200000n;
      exitSlippageBps = 650;
      rewardTokenChangeBps7d = -1000;
      confidenceBps = 9000;
    }

    // Apply jitter to dynamic mock signals
    if (scenario === 'healthy') {
      totalApyBps = Math.max(500, jitter(totalApyBps, 80));
      baseApyBps = Math.max(300, jitter(baseApyBps, 60));
      rewardApyBps = totalApyBps - baseApyBps;
      tvlUsd = jitterBigInt(tvlUsd, 200000n);
      netFlowUsd24h = jitterBigInt(netFlowUsd24h, 10000n);
      feesUsd24h = jitterBigInt(feesUsd24h, 500n);
      liquidityDepthUsd = jitterBigInt(liquidityDepthUsd, 100000n);
      exitSlippageBps = Math.max(5, jitter(exitSlippageBps, 4));
      rewardTokenChangeBps7d = jitter(rewardTokenChangeBps7d, 100);
      confidenceBps = Math.max(9000, Math.min(10000, jitter(confidenceBps, 40)));
    } else {
      confidenceBps = Math.max(8000, Math.min(10000, jitter(confidenceBps, 50)));
      tvlUsd = jitterBigInt(tvlUsd, 50000n);
      netFlowUsd24h = jitterBigInt(netFlowUsd24h, 20000n);
    }

    const newSnap = {
      opportunityId,
      observedAt: now,
      validUntil,
      totalApyBps,
      baseApyBps,
      rewardApyBps,
      tvlUsd: String(tvlUsd),
      netFlowUsd24h: String(netFlowUsd24h),
      feesUsd24h: String(feesUsd24h),
      liquidityDepthUsd: String(liquidityDepthUsd),
      exitSlippageBps,
      rewardTokenChangeBps7d,
      confidenceBps,
      sourceHash: '0x8b32cfefca623b32009ad16fbd97d2e85ab89d3110940562e8311029e84b8d7a'
    };

    // Pre-populate history if it's empty
    let history = [...(state.yieldStatus.history || [])];
    if (history.length === 0) {
      for (let i = 25; i > 0; i--) {
        const hTime = now - i * 3600;
        const hTotalApy = Math.max(500, jitter(1200, 80));
        const hBaseApy = Math.max(300, jitter(1000, 60));
        history.push({
          opportunityId,
          observedAt: hTime,
          validUntil: hTime + 300,
          totalApyBps: hTotalApy,
          baseApyBps: hBaseApy,
          rewardApyBps: hTotalApy - hBaseApy,
          tvlUsd: String(jitterBigInt(10000000n, 200000n)),
          netFlowUsd24h: String(jitterBigInt(50000n, 10000n)),
          feesUsd24h: String(jitterBigInt(5000n, 500n)),
          liquidityDepthUsd: String(jitterBigInt(2000000n, 100000n)),
          exitSlippageBps: Math.max(5, jitter(10, 4)),
          rewardTokenChangeBps7d: jitter(200, 100),
          confidenceBps: Math.max(9000, Math.min(10000, jitter(9500, 40))),
          sourceHash: '0x8b32cfefca623b32009ad16fbd97d2e85ab89d3110940562e8311029e84b8d7a'
        });
      }
    }

    history.push(newSnap);
    if (history.length > 50) {
      history.shift();
    }

    const prevResult = {
      opportunityId,
      yieldState: state.yieldStatus.yieldState,
      decayScore: state.yieldStatus.decayScore,
      factors: state.yieldStatus.factors || {},
      reasons: state.yieldStatus.reasons || [],
      reasonsHash: state.yieldStatus.reasonsHash || '0x0000000000000000000000000000000000000000000000000000000000000000',
      transitionEligibleAt: state.yieldStatus.transitionEligibleAt || 0
    };

    const classification = classifyYieldState(history, prevResult, { cooldownSeconds: 60 }, now);
    const formattedReasons = classification.reasons.map(r => getHumanReadableYieldReason(r));

    return {
      opportunityId: classification.opportunityId,
      decayScore: classification.decayScore,
      yieldState: classification.yieldState,
      factors: classification.factors,
      reasons: formattedReasons,
      reasonsHash: classification.reasonsHash,
      transitionEligibleAt: classification.transitionEligibleAt,
      latest: newSnap,
      history
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

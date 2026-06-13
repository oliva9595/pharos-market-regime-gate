import { CONFIG } from './config.js';

class AppStateStore {
  constructor() {
    this.state = {
      mode: 'mock', // 'mock' or 'web3'
      marketStatus: {
        regime: 'NORMAL',
        reasons: [],
        reasonsHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
        latest: null,
        history: []
      },
      yieldStatus: {
        opportunityId: CONFIG.CONTRACTS.ProtocolRegistry,
        decayScore: 0,
        yieldState: 'HEALTHY',
        factors: {},
        reasons: [],
        reasonsHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
        latest: null,
        history: []
      },
      decisionsHistory: [],
      wallet: {
        connected: false,
        address: null,
        balance: '0',
        chainId: null
      },
      blockHeight: 188432,
      apiState: {
        loading: false,
        error: null,
        stale: false,
        lastUpdated: null
      }
    };
    this.listeners = [];
  }

  getState() {
    return this.state;
  }

  updateState(updater) {
    if (typeof updater === 'function') {
      this.state = updater(this.state);
    } else {
      this.state = { ...this.state, ...updater };
    }
    this.notify();
  }

  subscribe(listener) {
    this.listeners.push(listener);
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(l => {
      try {
        l(this.state);
      } catch (err) {
        console.error('State store listener error:', err);
      }
    });
  }
}

export const stateStore = new AppStateStore();

import { CONFIG } from './config.js';

const ZERO_DATA = '0x';

export const EXECUTION_SCENARIOS = {
  'safe-allocation': {
    id: 'safe-allocation',
    label: 'Safe Yield Allocation',
    description: 'Verified opportunity in a normal market with healthy yield.',
    marketRegime: 'NORMAL',
    yieldState: 'HEALTHY',
    decision: 'ALLOW',
    allowed: true,
    actionType: 'DEPOSIT',
    target: CONFIG.CONTRACTS.ProtocolRegistry,
    opportunityId: CONFIG.CONTRACTS.ProtocolRegistry,
    data: ZERO_DATA,
    value: 0,
    positionUsd: 100000,
    requestedSlippageBps: 40,
    maxPositionUsd: 1000000,
    maxSlippageBps: 100,
    reasonCodes: ['MARKET_NORMAL', 'YIELD_HEALTHY', 'TARGET_VERIFIED']
  },
  'volatile-restriction': {
    id: 'volatile-restriction',
    label: 'Volatile Restriction',
    description: 'A verified target remains usable under tighter market limits.',
    marketRegime: 'VOLATILE',
    yieldState: 'HEALTHY',
    decision: 'RESTRICT',
    allowed: true,
    actionType: 'DEPOSIT',
    target: CONFIG.CONTRACTS.ProtocolRegistry,
    opportunityId: CONFIG.CONTRACTS.ProtocolRegistry,
    data: ZERO_DATA,
    value: 0,
    positionUsd: 200000,
    requestedSlippageBps: 40,
    maxPositionUsd: 250000,
    maxSlippageBps: 50,
    reasonCodes: ['MARKET_VOLATILE', 'POSITION_LIMIT_ACTIVE', 'SLIPPAGE_LIMIT_ACTIVE']
  },
  'decay-block': {
    id: 'decay-block',
    label: 'Yield Decay Block',
    description: 'New capital allocation is blocked for a decaying opportunity.',
    marketRegime: 'NORMAL',
    yieldState: 'DECAYING',
    decision: 'BLOCK',
    allowed: false,
    actionType: 'DEPOSIT',
    target: CONFIG.CONTRACTS.ProtocolRegistry,
    opportunityId: CONFIG.CONTRACTS.ProtocolRegistry,
    data: ZERO_DATA,
    value: 0,
    positionUsd: 100000,
    requestedSlippageBps: 40,
    maxPositionUsd: 0,
    maxSlippageBps: 0,
    reasonCodes: ['YIELD_DECAYING', 'NEW_ALLOCATION_BLOCKED']
  },
  'panic-block': {
    id: 'panic-block',
    label: 'Panic Block',
    description: 'Risk-increasing actions halt during a panic market regime.',
    marketRegime: 'PANIC',
    yieldState: 'HEALTHY',
    decision: 'BLOCK',
    allowed: false,
    actionType: 'DEPOSIT',
    target: CONFIG.CONTRACTS.ProtocolRegistry,
    opportunityId: CONFIG.CONTRACTS.ProtocolRegistry,
    data: ZERO_DATA,
    value: 0,
    positionUsd: 100000,
    requestedSlippageBps: 40,
    maxPositionUsd: 0,
    maxSlippageBps: 0,
    reasonCodes: ['MARKET_PANIC', 'RISK_INCREASING_ACTION_BLOCKED']
  },
  'safe-unwind': {
    id: 'safe-unwind',
    label: 'Safe Unwind',
    description: 'Withdrawal remains available while panic and exit policies are active.',
    marketRegime: 'PANIC',
    yieldState: 'EXIT',
    decision: 'UNWIND',
    allowed: true,
    actionType: 'WITHDRAW',
    target: CONFIG.CONTRACTS.ProtocolRegistry,
    opportunityId: CONFIG.CONTRACTS.ProtocolRegistry,
    data: ZERO_DATA,
    value: 0,
    positionUsd: 100000,
    requestedSlippageBps: 40,
    maxPositionUsd: 250000,
    maxSlippageBps: 50,
    reasonCodes: ['MARKET_PANIC', 'YIELD_EXIT', 'SAFE_UNWIND']
  }
};

export function getExecutionScenario(id) {
  const scenario = EXECUTION_SCENARIOS[id];
  if (!scenario) {
    throw new Error(`Unknown execution scenario: ${id}`);
  }
  return scenario;
}

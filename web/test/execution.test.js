import { describe, expect, it, vi } from 'vitest';
import {
  buildActionContext,
  createEngineClient,
  evaluateMockExecution
} from '../js/execution.js';
import { EXECUTION_SCENARIOS, getExecutionScenario } from '../js/scenarios.js';

describe('execution proof scenarios', () => {
  it('defines the five required acceptance scenarios', () => {
    expect(Object.keys(EXECUTION_SCENARIOS)).toEqual([
      'safe-allocation',
      'volatile-restriction',
      'decay-block',
      'panic-block',
      'safe-unwind'
    ]);
  });

  it('builds a Solidity-compatible action context', () => {
    const context = buildActionContext(getExecutionScenario('safe-allocation'));

    expect(context.actionType).toBe('DEPOSIT');
    expect(context.opportunityId).toMatch(/^0x[0-9a-f]{64}$/);
    expect(context.positionUsd).toBe(100000n);
    expect(context.requestedSlippageBps).toBe(40n);
  });

  it('returns deterministic mock proof with policy limits and reason codes', () => {
    const proof = evaluateMockExecution(getExecutionScenario('volatile-restriction'));

    expect(proof.allowed).toBe(true);
    expect(proof.decision).toBe('RESTRICT');
    expect(proof.reasonCodes).toContain('MARKET_VOLATILE');
    expect(proof.maxPositionUsd).toBe(250000n);
    expect(proof.maxSlippageBps).toBe(50n);
  });

  it('keeps safe unwind available during panic', () => {
    const proof = evaluateMockExecution(getExecutionScenario('safe-unwind'));

    expect(proof.allowed).toBe(true);
    expect(proof.decision).toBe('UNWIND');
    expect(proof.reasonCodes).toContain('SAFE_UNWIND');
  });
});

describe('web3 engine client', () => {
  it('calls checkAction and executeAction with the same formatted context', async () => {
    const checkAction = vi.fn().mockResolvedValue([true, '']);
    const executeAction = vi.fn().mockResolvedValue({
      hash: '0xabc',
      wait: vi.fn().mockResolvedValue({ blockNumber: 123 })
    });
    const Contract = vi.fn(() => ({ checkAction, executeAction }));
    const client = createEngineClient({
      ethersApi: { Contract },
      engineAddress: '0x0000000000000000000000000000000000000001',
      provider: { name: 'provider' },
      signer: { name: 'signer' }
    });
    const scenario = getExecutionScenario('safe-allocation');

    const check = await client.check(scenario);
    const execution = await client.execute(scenario);

    expect(check).toEqual({ allowed: true, reason: '' });
    expect(checkAction).toHaveBeenCalledOnce();
    expect(executeAction).toHaveBeenCalledOnce();
    expect(execution).toEqual({ hash: '0xabc', blockNumber: 123 });
  });
});

import { describe, expect, it } from 'vitest';
import { evaluateMockExecution } from '../js/execution.js';
import { getExecutionScenario } from '../js/scenarios.js';

describe('dashboard action enablement', () => {
  it.each([
    ['safe-allocation', true, 'ALLOW'],
    ['volatile-restriction', true, 'RESTRICT'],
    ['decay-block', false, 'BLOCK'],
    ['panic-block', false, 'BLOCK'],
    ['safe-unwind', true, 'UNWIND']
  ])('evaluates %s consistently', (id, allowed, decision) => {
    const proof = evaluateMockExecution(getExecutionScenario(id));
    expect(proof.allowed).toBe(allowed);
    expect(proof.decision).toBe(decision);
  });
});

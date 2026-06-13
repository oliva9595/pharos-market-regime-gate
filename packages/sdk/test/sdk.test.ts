import { describe, it, expect } from 'vitest';
import { diagnosePolicyFailure } from '../src/diagnostics.js';
import { SentinelSdk } from '../src/client.js';

describe('Sentinel V2 SDK', () => {
  it('diagnoses policy failure correctly', () => {
    const resBlacklist = diagnosePolicyFailure('Registry: Target address is blacklisted');
    expect(resBlacklist.recommendation).toContain('blacklisted');

    const resVolatile = diagnosePolicyFailure('MarketGate: blocked by policy');
    expect(resVolatile.recommendation).toContain('Market regime is unstable');

    const resSize = diagnosePolicyFailure('ExecutionEngine: position size exceeds policy limit');
    expect(resSize.recommendation).toContain('amount exceeds limits');

    const resSlippage = diagnosePolicyFailure('ExecutionEngine: requested slippage exceeds policy limit');
    expect(resSlippage.recommendation).toContain('Slippage parameter is too loose');
  });

  it('can be instantiated', () => {
    const sdk = new SentinelSdk({
      rpcUrl: 'https://test.rpc',
      engineAddress: '0x0000000000000000000000000000000000000000',
      registryAddress: '0x0000000000000000000000000000000000000000'
    });
    expect(sdk).toBeDefined();
  });
});

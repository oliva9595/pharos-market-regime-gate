import { describe, expect, it } from 'vitest';
import { toBytes32 } from '../js/execution.js';

describe('frontend security boundaries', () => {
  it('rejects malformed opportunity identifiers before Web3 calls', () => {
    expect(() => toBytes32('<img src=x onerror=alert(1)>')).toThrow();
  });

  it('normalizes address opportunity identifiers without executing content', () => {
    expect(toBytes32('0x0000000000000000000000000000000000000001'))
      .toBe('0x0000000000000000000000000000000000000000000000000000000000000001');
  });
});

import { describe, expect, it } from 'vitest';
import { calculateApySlope, getBaseYieldState } from '../js/yield.js';

describe('yield dashboard calculations', () => {
  it('maps score boundaries to the displayed yield state', () => {
    expect(getBaseYieldState(29)).toBe('HEALTHY');
    expect(getBaseYieldState(30)).toBe('WATCH');
    expect(getBaseYieldState(50)).toBe('DECAYING');
    expect(getBaseYieldState(75)).toBe('EXIT');
  });

  it('returns null when history is too short to claim a trend', () => {
    expect(calculateApySlope([{ observedAt: 1, totalApyBps: 1000 }], 86400)).toBeNull();
  });
});

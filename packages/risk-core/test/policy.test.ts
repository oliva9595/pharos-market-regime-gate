import { describe, it, expect } from 'vitest';
import { evaluatePolicy } from '../src/policy/evaluate.js';

describe('CombinedPolicyEngine', () => {
  const defaultParams = {
    reportId: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef' as const,
    opportunityId: '0xbe713906E4D5ac544C069Cd16B2233C979b8AB5a' as const,
    actionType: 'DEPOSIT',
    marketRegime: 'NORMAL' as const,
    yieldState: 'HEALTHY' as const,
    isVerifiedTarget: true,
    isBlacklistedTarget: false,
    reasonsHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef' as const,
    validUntil: 1700000500
  };

  it('ALLOWs deposit on Normal + Healthy verified target', () => {
    const receipt = evaluatePolicy(defaultParams);
    expect(receipt.decision).toBe('ALLOW');
    expect(receipt.maxPositionUsd).toBe(1_000_000n);
    expect(receipt.maxSlippageBps).toBe(100);
  });

  it('BLOCKs blacklisted targets always', () => {
    const receipt = evaluatePolicy({
      ...defaultParams,
      isBlacklistedTarget: true
    });
    expect(receipt.decision).toBe('BLOCK');
  });

  it('BLOCKs unverified targets in Volatile regime', () => {
    const receipt = evaluatePolicy({
      ...defaultParams,
      marketRegime: 'VOLATILE',
      isVerifiedTarget: false
    });
    expect(receipt.decision).toBe('BLOCK');
  });

  it('RESTRICTs deposit in Volatile + Healthy verified targets', () => {
    const receipt = evaluatePolicy({
      ...defaultParams,
      marketRegime: 'VOLATILE'
    });
    expect(receipt.decision).toBe('RESTRICT');
    expect(receipt.maxPositionUsd).toBe(250_000n);
    expect(receipt.maxSlippageBps).toBe(50);
  });

  it('allows Repay always', () => {
    const receipt = evaluatePolicy({
      ...defaultParams,
      marketRegime: 'PANIC',
      yieldState: 'EXIT',
      actionType: 'REPAY'
    });
    expect(receipt.decision).toBe('ALLOW');
  });

  it('blocks new allocation and allows unwind in Decaying yield state', () => {
    const receiptDeposit = evaluatePolicy({
      ...defaultParams,
      yieldState: 'DECAYING',
      actionType: 'DEPOSIT'
    });
    expect(receiptDeposit.decision).toBe('BLOCK');

    const receiptWithdraw = evaluatePolicy({
      ...defaultParams,
      yieldState: 'DECAYING',
      actionType: 'WITHDRAW'
    });
    expect(receiptWithdraw.decision).toBe('ALLOW');

    const receiptSwap = evaluatePolicy({
      ...defaultParams,
      yieldState: 'DECAYING',
      actionType: 'SWAP'
    });
    expect(receiptSwap.decision).toBe('UNWIND');
  });

  it('evaluates Panic + Any actions correctly', () => {
    const receiptDeposit = evaluatePolicy({
      ...defaultParams,
      marketRegime: 'PANIC',
      actionType: 'DEPOSIT'
    });
    expect(receiptDeposit.decision).toBe('BLOCK');

    const receiptWithdraw = evaluatePolicy({
      ...defaultParams,
      marketRegime: 'PANIC',
      actionType: 'WITHDRAW'
    });
    expect(receiptWithdraw.decision).toBe('UNWIND');
  });
});

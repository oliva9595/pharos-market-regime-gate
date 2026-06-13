import { describe, it, expect, vi } from 'vitest';
import { DataCollector } from '../src/collector.js';
import { RiskEvaluator } from '../src/evaluator.js';
import { TransactionQueue } from '../src/queue.js';
import { SentinelKeeper } from '../src/index.js';

describe('SentinelKeeper components', () => {
  it('collects and evaluates snapshots', () => {
    const collector = new DataCollector();
    const evaluator = new RiskEvaluator();

    const mSnap = collector.collectMarketSnapshot();
    const mRes = evaluator.evaluateMarket(mSnap);
    expect(mRes.regime).toBe('NORMAL');

    const opportunityId = '0xbe713906E4D5ac544C069Cd16B2233C979b8AB5a';
    const ySnap = collector.collectYieldSnapshot(opportunityId);
    const yRes = evaluator.evaluateYield(ySnap);
    expect(yRes.yieldState).toBe('HEALTHY');
  });

  it('submits tasks in transaction queue sequentially', async () => {
    const executed: string[] = [];
    const submitFn = async (task: any) => {
      executed.push(task.opportunityId);
      return '0xhash';
    };

    const queue = new TransactionQueue(submitFn, 3, 10);
    queue.enqueue({ opportunityId: 'opp1', marketRegime: 'NORMAL', yieldState: 'HEALTHY', confidenceBps: 9000, observedAt: 0, validUntil: 0 });
    queue.enqueue({ opportunityId: 'opp2', marketRegime: 'NORMAL', yieldState: 'HEALTHY', confidenceBps: 9000, observedAt: 0, validUntil: 0 });

    // Wait short time for queue to flush
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(executed).toEqual(['opp1', 'opp2']);
  });

  it('runs keeper dry-run loop successfully', async () => {
    const keeper = new SentinelKeeper(true, ['opp1', 'opp2']);
    const logSpy = vi.spyOn(console, 'log');

    await keeper.runOnce();
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Keeper: Market Regime is NORMAL'));
    
    logSpy.mockRestore();
  });
});

import { config } from './config.js';
import { DataCollector } from './collector.js';
import { RiskEvaluator } from './evaluator.js';
import { SignedReporter } from './reporter.js';
import { TransactionQueue } from './queue.js';
import { ethers } from 'ethers';

export class SentinelKeeper {
  private collector = new DataCollector();
  private evaluator = new RiskEvaluator();
  private reporter?: SignedReporter;
  private queue?: TransactionQueue;
  private timer?: NodeJS.Timeout;

  constructor(
    private dryRun = true,
    private opportunityIds: string[] = []
  ) {
    if (!this.dryRun) {
      if (!config.keeperPrivateKey || config.registryAddress === ethers.ZeroAddress) {
        throw new Error('Live keeper requires PHAROS_KEEPER_PRIVATE_KEY and a non-zero REGISTRY_ADDRESS');
      }
      const provider = new ethers.JsonRpcProvider(config.rpcUrl);
      this.reporter = new SignedReporter(config.keeperPrivateKey, config.registryAddress, provider);
      this.queue = new TransactionQueue(async (task) => {
        const seq = await this.reporter!.getNextSequence(task.opportunityId);
        const { reportId, signature } = await this.reporter!.createAndSignReport(
          task.opportunityId,
          task.marketRegime,
          task.yieldState,
          task.confidenceBps,
          task.observedAt,
          task.validUntil,
          seq
        );
        return this.reporter!.submitReport(
          task.opportunityId,
          task.marketRegime,
          task.yieldState,
          task.confidenceBps,
          task.observedAt,
          task.validUntil,
          seq,
          reportId,
          signature
        );
      });
    }
  }

  async runOnce() {
    console.log('Keeper: starting evaluation cycle...');
    try {
      // 1. Evaluate global market regime
      const marketSnap = this.collector.collectMarketSnapshot();
      const marketRes = this.evaluator.evaluateMarket(marketSnap);
      console.log(`Keeper: Market Regime is ${marketRes.regime}. Reasons: ${marketRes.reasons.join(', ')}`);

      const now = Math.floor(Date.now() / 1000);
      const validUntil = now + config.staleThresholdSeconds;

      if (this.dryRun) {
        console.log('[DRY-RUN] Submit global market report to registry');
      } else {
        this.queue!.enqueue({
          opportunityId: ethers.ZeroHash,
          marketRegime: marketRes.regime,
          yieldState: 'HEALTHY',
          confidenceBps: marketSnap.confidenceBps,
          observedAt: now,
          validUntil
        });
      }

      // 2. Evaluate specific yield opportunities
      for (const oppId of this.opportunityIds) {
        const yieldSnap = this.collector.collectYieldSnapshot(oppId);
        const yieldRes = this.evaluator.evaluateYield(yieldSnap);
        console.log(`Keeper: Opportunity ${oppId} yield state is ${yieldRes.yieldState} (Score: ${yieldRes.decayScore})`);

        if (this.dryRun) {
          console.log(`[DRY-RUN] Submit yield report for ${oppId} to registry`);
        } else {
          this.queue!.enqueue({
            opportunityId: oppId,
            marketRegime: marketRes.regime,
            yieldState: yieldRes.yieldState,
            confidenceBps: yieldSnap.confidenceBps,
            observedAt: now,
            validUntil
          });
        }
      }
    } catch (error) {
      console.error('Keeper: error in evaluation cycle', error);
    }
  }

  start(intervalMs = 15000) {
    this.runOnce();
    this.timer = setInterval(() => this.runOnce(), intervalMs);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }
}

// Start keeper if invoked directly
if (process.argv[1] && process.argv[1].endsWith('index.js')) {
  const isLive = process.env.KEEPER_LIVE === 'true';
  const opportunities = (process.env.OPPORTUNITY_IDS ?? '').split(',').filter(x => x.length > 0);
  
  console.log(`Keeper starting in ${isLive ? 'LIVE' : 'DRY-RUN'} mode`);
  const keeper = new SentinelKeeper(!isLive, opportunities);
  keeper.start();
}

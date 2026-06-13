import { 
  MarketSnapshot, 
  YieldSnapshot, 
  classifyMarketRegime, 
  evaluateYieldDecay,
  MarketClassificationResult,
  YieldScoringResult
} from '@pharos/risk-core';
import { YieldHistoryStore } from '@pharos/data-adapters';

export class RiskEvaluator {
  private yieldHistoryStore = new YieldHistoryStore();
  private prevMarketResult?: MarketClassificationResult;
  private prevYieldResults: Map<string, YieldScoringResult> = new Map();
  private marketSnapshots: MarketSnapshot[] = [];

  evaluateMarket(snap: MarketSnapshot): MarketClassificationResult {
    this.marketSnapshots.push(snap);
    if (this.marketSnapshots.length > 50) {
      this.marketSnapshots.shift();
    }
    const result = classifyMarketRegime(this.marketSnapshots, this.prevMarketResult);
    this.prevMarketResult = result;
    return result;
  }

  evaluateYield(snap: YieldSnapshot): YieldScoringResult {
    const oppId = snap.opportunityId.toLowerCase();
    this.yieldHistoryStore.addSnapshot(snap);
    
    // Calculate APY slope over 1 day window
    const slope = this.yieldHistoryStore.calculateApySlope(oppId, 86400);
    const prevResult = this.prevYieldResults.get(oppId);

    const result = evaluateYieldDecay(snap, slope, prevResult);
    this.prevYieldResults.set(oppId, result);
    return result;
  }
}

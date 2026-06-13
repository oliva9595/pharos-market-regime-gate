import fs from 'fs';
import { MarketSnapshot, YieldSnapshot, DecisionReceipt } from '@pharos/risk-core';

export class SentinelStore {
  private dbPath: string;
  private data: {
    marketSnapshots: MarketSnapshot[];
    yieldSnapshots: YieldSnapshot[];
    decisions: DecisionReceipt[];
  };

  constructor(dbPath = './sentinel-db.json') {
    this.dbPath = dbPath;
    this.data = {
      marketSnapshots: [],
      yieldSnapshots: [],
      decisions: []
    };
    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(this.dbPath)) {
        const raw = fs.readFileSync(this.dbPath, 'utf-8');
        const parsed = JSON.parse(raw);
        this.data = {
          marketSnapshots: (parsed.marketSnapshots ?? []).map((s: any) => ({
            ...s,
            bridgeNetOutflowUsd: BigInt(s.bridgeNetOutflowUsd),
            liquidityDepthUsd: BigInt(s.liquidityDepthUsd)
          })),
          yieldSnapshots: (parsed.yieldSnapshots ?? []).map((s: any) => ({
            ...s,
            tvlUsd: BigInt(s.tvlUsd),
            netFlowUsd24h: BigInt(s.netFlowUsd24h),
            feesUsd24h: BigInt(s.feesUsd24h),
            liquidityDepthUsd: BigInt(s.liquidityDepthUsd)
          })),
          decisions: (parsed.decisions ?? []).map((d: any) => ({
            ...d,
            maxPositionUsd: BigInt(d.maxPositionUsd)
          }))
        };
      }
    } catch (err) {
      console.error('Store: load failed', err);
    }
  }

  private save() {
    try {
      const serializable = {
        marketSnapshots: this.data.marketSnapshots.map(s => ({
          ...s,
          bridgeNetOutflowUsd: s.bridgeNetOutflowUsd.toString(),
          liquidityDepthUsd: s.liquidityDepthUsd.toString()
        })),
        yieldSnapshots: this.data.yieldSnapshots.map(s => ({
          ...s,
          tvlUsd: s.tvlUsd.toString(),
          netFlowUsd24h: s.netFlowUsd24h.toString(),
          feesUsd24h: s.feesUsd24h.toString(),
          liquidityDepthUsd: s.liquidityDepthUsd.toString()
        })),
        decisions: this.data.decisions.map(d => ({
          ...d,
          maxPositionUsd: d.maxPositionUsd.toString()
        }))
      };
      fs.writeFileSync(this.dbPath, JSON.stringify(serializable, null, 2), 'utf-8');
    } catch (err) {
      console.error('Store: save failed', err);
    }
  }

  addMarketSnapshot(snap: MarketSnapshot) {
    this.data.marketSnapshots.push(snap);
    if (this.data.marketSnapshots.length > 100) this.data.marketSnapshots.shift();
    this.save();
  }

  addYieldSnapshot(snap: YieldSnapshot) {
    this.data.yieldSnapshots.push(snap);
    if (this.data.yieldSnapshots.length > 200) this.data.yieldSnapshots.shift();
    this.save();
  }

  addDecision(receipt: DecisionReceipt) {
    this.data.decisions.push(receipt);
    if (this.data.decisions.length > 100) this.data.decisions.shift();
    this.save();
  }

  getMarketHistory(limit = 20): MarketSnapshot[] {
    return this.data.marketSnapshots.slice(-limit);
  }

  getYieldHistory(opportunityId: string, limit = 20): YieldSnapshot[] {
    return this.data.yieldSnapshots
      .filter(s => s.opportunityId.toLowerCase() === opportunityId.toLowerCase())
      .slice(-limit);
  }

  getDecisionsHistory(limit = 20): DecisionReceipt[] {
    return this.data.decisions.slice(-limit);
  }
}

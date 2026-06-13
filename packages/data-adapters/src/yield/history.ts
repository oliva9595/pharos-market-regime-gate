import { YieldSnapshot } from '@pharos/risk-core';

export class YieldHistoryStore {
  private store: Map<string, YieldSnapshot[]> = new Map();
  private maxHistorySize: number;

  constructor(maxHistorySize = 100) {
    this.maxHistorySize = maxHistorySize;
  }

  addSnapshot(snapshot: YieldSnapshot) {
    const oppId = snapshot.opportunityId.toLowerCase();
    if (!this.store.has(oppId)) {
      this.store.set(oppId, []);
    }
    const history = this.store.get(oppId)!;
    
    // Prevent duplicate observedAt
    if (history.some(h => h.observedAt === snapshot.observedAt)) {
      return;
    }

    history.push(snapshot);
    history.sort((a, b) => a.observedAt - b.observedAt);
    
    if (history.length > this.maxHistorySize) {
      history.shift();
    }
  }

  getHistory(opportunityId: string): YieldSnapshot[] {
    return this.store.get(opportunityId.toLowerCase()) ?? [];
  }

  /**
   * Calculates APY slope in BPS change per day.
   * If there is less than 2 observations, or if the time span is less than 1 hour,
   * returns null to signal insufficient history.
   */
  calculateApySlope(opportunityId: string, windowSeconds: number): number | null {
    const history = this.getHistory(opportunityId);
    if (history.length < 2) return null;

    const latest = history[history.length - 1];
    const earliestAllowed = latest.observedAt - windowSeconds;

    // Find the snapshot closest to earliestAllowed
    let baseline: YieldSnapshot | null = null;
    for (let i = history.length - 2; i >= 0; i--) {
      if (history[i].observedAt <= earliestAllowed) {
        baseline = history[i];
        break;
      }
    }

    // If we have no observation before the window, check if we have enough total span (at least 1 hour)
    if (!baseline) {
      baseline = history[0];
    }

    const timeDiff = latest.observedAt - baseline.observedAt;
    if (timeDiff < 3600) {
      // Less than 1 hour of total data span is insufficient
      return null;
    }

    const apyDiff = latest.totalApyBps - baseline.totalApyBps;
    const secondsInDay = 86400;
    
    return (apyDiff / timeDiff) * secondsInDay;
  }
}

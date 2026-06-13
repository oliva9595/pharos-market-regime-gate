export interface QueueTask {
  opportunityId: string;
  marketRegime: string;
  yieldState: string;
  confidenceBps: number;
  observedAt: number;
  validUntil: number;
}

export class TransactionQueue {
  private queue: QueueTask[] = [];
  private processing = false;

  constructor(
    private submitFn: (task: QueueTask) => Promise<string>,
    private retryLimit = 3,
    private backoffMs = 1000
  ) {}

  enqueue(task: QueueTask) {
    this.queue.push(task);
    this.processNext();
  }

  private async processNext() {
    if (this.processing || this.queue.length === 0) return;
    this.processing = true;

    const task = this.queue.shift()!;
    let attempts = 0;
    let success = false;

    while (attempts < this.retryLimit && !success) {
      try {
        attempts++;
        await this.submitFn(task);
        success = true;
      } catch (err) {
        if (attempts >= this.retryLimit) {
          console.error(`Queue: task failed after ${attempts} attempts`, err);
        } else {
          console.warn(`Queue: retry attempt ${attempts} in ${this.backoffMs}ms`);
          await new Promise(resolve => setTimeout(resolve, this.backoffMs));
        }
      }
    }

    this.processing = false;
    this.processNext();
  }
}

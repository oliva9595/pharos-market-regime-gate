import { ethers, Wallet, Contract, solidityPackedKeccak256 } from 'ethers';
import { MarketClassificationResult, YieldScoringResult } from '@pharos/risk-core';

export class SignedReporter {
  private wallet: Wallet;
  private contract: Contract;
  private sequenceNumbers: Map<string, number> = new Map();

  constructor(
    privateKey: string,
    registryAddress: string,
    provider: ethers.JsonRpcProvider
  ) {
    this.wallet = new Wallet(privateKey, provider);
    
    const abi = [
      "function registerReport(bytes32 reportId, bytes32 opportunityId, uint8 marketRegime, uint8 yieldState, uint16 confidenceBps, uint256 observedAt, uint256 validUntil, uint256 sequenceNumber, bytes signature) external",
      "function latestSequenceNumbers(bytes32 opportunityId) view returns (uint256)"
    ];
    this.contract = new Contract(registryAddress, abi, this.wallet);
  }

  async getNextSequence(opportunityId: string): Promise<number> {
    const oppIdLower = opportunityId.toLowerCase();
    let seq = this.sequenceNumbers.get(oppIdLower);
    if (seq === undefined) {
      try {
        const onChainSeq = await this.contract.latestSequenceNumbers(opportunityId);
        seq = Number(onChainSeq);
      } catch {
        seq = 0;
      }
    }
    const nextSeq = seq + 1;
    this.sequenceNumbers.set(oppIdLower, nextSeq);
    return nextSeq;
  }

  async createAndSignReport(
    opportunityId: string,
    marketRegime: string,
    yieldState: string,
    confidenceBps: number,
    observedAt: number,
    validUntil: number,
    sequenceNumber: number
  ): Promise<{ reportId: string; signature: string }> {
    const REGIME_MAP: Record<string, number> = { NORMAL: 0, VOLATILE: 1, PANIC: 2 };
    const YIELD_MAP: Record<string, number> = { HEALTHY: 0, WATCH: 1, DECAYING: 2, EXIT: 3 };

    // Format opportunityId as bytes32
    let oppIdBytes32 = opportunityId;
    if (oppIdBytes32.length === 42) {
      oppIdBytes32 = '0x' + oppIdBytes32.slice(2).padStart(64, '0');
    }

    const reportId = ethers.keccak256(ethers.toUtf8Bytes(`report-${opportunityId}-${sequenceNumber}`));

    // Compute SolidityPacked keccak256
    const reportHash = solidityPackedKeccak256(
      ['bytes32', 'bytes32', 'uint8', 'uint8', 'uint16', 'uint256', 'uint256', 'uint256'],
      [
        reportId,
        oppIdBytes32,
        REGIME_MAP[marketRegime] ?? 0,
        YIELD_MAP[yieldState] ?? 0,
        confidenceBps,
        BigInt(observedAt),
        BigInt(validUntil),
        BigInt(sequenceNumber)
      ]
    );

    // Sign hash (prepending Ethereum Signed Message prefix)
    const signature = await this.wallet.signMessage(ethers.getBytes(reportHash));
    return { reportId, signature };
  }

  async submitReport(
    opportunityId: string,
    marketRegime: string,
    yieldState: string,
    confidenceBps: number,
    observedAt: number,
    validUntil: number,
    sequenceNumber: number,
    reportId: string,
    signature: string
  ): Promise<string> {
    const REGIME_MAP: Record<string, number> = { NORMAL: 0, VOLATILE: 1, PANIC: 2 };
    const YIELD_MAP: Record<string, number> = { HEALTHY: 0, WATCH: 1, DECAYING: 2, EXIT: 3 };

    let oppIdBytes32 = opportunityId;
    if (oppIdBytes32.length === 42) {
      oppIdBytes32 = '0x' + oppIdBytes32.slice(2).padStart(64, '0');
    }

    // Call contract
    const tx = await this.contract.registerReport(
      reportId,
      oppIdBytes32,
      REGIME_MAP[marketRegime] ?? 0,
      YIELD_MAP[yieldState] ?? 0,
      confidenceBps,
      observedAt,
      validUntil,
      sequenceNumber,
      signature
    );

    await tx.wait();
    return tx.hash;
  }
}

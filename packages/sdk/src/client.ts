import { ethers, Wallet } from 'ethers';
import { readLatestReport } from './reads.js';
import { checkActionOnChain, executeActionOnChain } from './writes.js';
import { diagnosePolicyFailure, DiagnosticResult } from './diagnostics.js';

export interface SdkConfig {
  rpcUrl: string;
  engineAddress: string;
  registryAddress: string;
}

export class SentinelSdk {
  private provider: ethers.JsonRpcProvider;
  private config: SdkConfig;

  constructor(config: SdkConfig) {
    this.config = config;
    this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
  }

  async getExecutionReadiness(opportunityId: string) {
    return readLatestReport(this.config.registryAddress, opportunityId, this.provider);
  }

  async checkAction(ctx: {
    target: string;
    data?: string;
    value?: number | string;
    actionType: string;
    opportunityId: string;
    positionUsd: number;
    requestedSlippageBps: number;
  }): Promise<{ allowed: boolean; reason: string; diagnostics?: DiagnosticResult }> {
    const res = await checkActionOnChain(this.config.engineAddress, ctx, this.provider);
    if (!res.allowed) {
      const diagnostics = diagnosePolicyFailure(res.reason);
      return {
        allowed: false,
        reason: res.reason,
        diagnostics
      };
    }
    return { allowed: true, reason: "" };
  }

  async safeExecuteAction(
    ctx: any,
    walletPrivateKey: string
  ): Promise<{ success: boolean; txHash?: string; error?: string; diagnostics?: DiagnosticResult }> {
    const check = await this.checkAction(ctx);
    if (!check.allowed) {
      return { success: false, error: check.reason, diagnostics: check.diagnostics };
    }

    try {
      const wallet = new Wallet(walletPrivateKey, this.provider);
      const hash = await executeActionOnChain(this.config.engineAddress, ctx, wallet);
      return { success: true, txHash: hash };
    } catch (err: any) {
      const diagnostics = diagnosePolicyFailure(err.message);
      return { success: false, error: err.message, diagnostics };
    }
  }

  explainDecision(reason: string): DiagnosticResult {
    return diagnosePolicyFailure(reason);
  }
}

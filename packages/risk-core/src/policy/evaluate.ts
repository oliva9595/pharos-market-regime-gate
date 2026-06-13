import { DecisionReceipt, MarketRegime, YieldState, PolicyDecision } from '../types.js';
import { getMatrixDecision } from './matrix.js';
import { getPolicyLimits } from './limits.js';

export interface PolicyEvaluationParams {
  reportId: `0x${string}`;
  opportunityId: `0x${string}`;
  actionType: string;
  marketRegime: MarketRegime;
  yieldState: YieldState;
  isVerifiedTarget: boolean;
  isBlacklistedTarget: boolean;
  reasonsHash: `0x${string}`;
  validUntil: number;
}

export function evaluatePolicy(
  params: PolicyEvaluationParams
): DecisionReceipt {
  let decision: PolicyDecision = "ALLOW";

  // 1. Target Security Checks
  if (params.isBlacklistedTarget) {
    decision = "BLOCK";
  } else if (!params.isVerifiedTarget && (params.marketRegime === "VOLATILE" || params.marketRegime === "PANIC")) {
    decision = "BLOCK";
  } else {
    // 2. Combined Policy Matrix Lookup
    decision = getMatrixDecision(params.marketRegime, params.yieldState, params.actionType);
  }

  // 3. Compute position and slippage limits
  const limits = getPolicyLimits(decision);

  return {
    reportId: params.reportId,
    opportunityId: params.opportunityId,
    actionType: params.actionType.toUpperCase(),
    marketRegime: params.marketRegime,
    yieldState: params.yieldState,
    decision,
    maxPositionUsd: limits.maxPositionUsd,
    maxSlippageBps: limits.maxSlippageBps,
    reasonsHash: params.reasonsHash,
    validUntil: params.validUntil
  };
}

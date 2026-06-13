import { keccak256, toUtf8Bytes } from 'ethers';
import { YieldSnapshot, YieldSnapshotSchema } from '@pharos/risk-core';
import { RawYieldData } from './types.js';

export function normalizeYieldSnapshot(raw: RawYieldData): YieldSnapshot {
  const totalApyBps = Math.round(raw.totalApyRate * 10000);
  const baseApyBps = Math.round(raw.baseApyRate * 10000);
  const rewardApyBps = Math.round(raw.rewardApyRate * 10000);

  const tvlUsd = BigInt(raw.tvlUsd);
  const netFlowUsd24h = BigInt(raw.netFlowUsd24h);
  const feesUsd24h = BigInt(raw.feesUsd24h);
  const liquidityDepthUsd = BigInt(raw.liquidityDepthUsd);

  const exitSlippageBps = Math.round(raw.exitSlippageRate * 10000);
  const rewardTokenChangeBps7d = Math.round(raw.rewardTokenPriceChange7d * 10000);
  const confidenceBps = Math.round(raw.oracleConfidence * 10000);

  const sourceHash = keccak256(toUtf8Bytes(raw.source)) as `0x${string}`;

  // Make sure opportunityId is valid format
  let opportunityId = raw.opportunityId;
  if (!opportunityId.startsWith('0x')) {
    opportunityId = keccak256(toUtf8Bytes(opportunityId)); // hash if not hex
  }

  const snapshot: YieldSnapshot = {
    opportunityId: opportunityId as `0x${string}`,
    observedAt: raw.timestamp,
    validUntil: raw.timestamp + 300, // 5 minutes validity
    totalApyBps,
    baseApyBps,
    rewardApyBps,
    tvlUsd,
    netFlowUsd24h,
    feesUsd24h,
    liquidityDepthUsd,
    exitSlippageBps,
    rewardTokenChangeBps7d,
    confidenceBps,
    sourceHash
  };

  return YieldSnapshotSchema.parse(snapshot) as YieldSnapshot;
}

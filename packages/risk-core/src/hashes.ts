import { solidityPackedKeccak256, keccak256, toUtf8Bytes } from 'ethers';
import { MarketSnapshot, YieldSnapshot, DecisionReceipt } from './types.js';

const REGIME_MAP = { NORMAL: 0, VOLATILE: 1, PANIC: 2 } as const;
const YIELD_MAP = { HEALTHY: 0, WATCH: 1, DECAYING: 2, EXIT: 3 } as const;
const DECISION_MAP = { ALLOW: 0, RESTRICT: 1, BLOCK: 2, UNWIND: 3 } as const;

export function hashMarketSnapshot(snap: MarketSnapshot): `0x${string}` {
  return solidityPackedKeccak256(
    ['uint256', 'uint256', 'uint256', 'uint256', 'uint256', 'uint256', 'uint256', 'uint256', 'bytes32'],
    [
      BigInt(snap.observedAt),
      BigInt(snap.validUntil),
      BigInt(snap.volatilityBps),
      BigInt(snap.priceDivergenceBps),
      snap.bridgeNetOutflowUsd,
      BigInt(snap.stablecoinDepegBps),
      snap.liquidityDepthUsd,
      BigInt(snap.confidenceBps),
      snap.sourceHash
    ]
  ) as `0x${string}`;
}

export function hashYieldSnapshot(snap: YieldSnapshot): `0x${string}` {
  // Pad opportunityId to bytes32 if it is an address (20 bytes)
  let oppIdBytes32 = snap.opportunityId;
  if (oppIdBytes32.length === 42) {
    oppIdBytes32 = ('0x' + oppIdBytes32.slice(2).padStart(64, '0')) as `0x${string}`;
  }

  return solidityPackedKeccak256(
    [
      'bytes32', 'uint256', 'uint256', 'uint256', 'uint256', 'uint256',
      'uint256', 'int256', 'uint256', 'uint256', 'uint256', 'int256',
      'uint256', 'bytes32'
    ],
    [
      oppIdBytes32,
      BigInt(snap.observedAt),
      BigInt(snap.validUntil),
      BigInt(snap.totalApyBps),
      BigInt(snap.baseApyBps),
      BigInt(snap.rewardApyBps),
      snap.tvlUsd,
      snap.netFlowUsd24h,
      snap.feesUsd24h,
      snap.liquidityDepthUsd,
      BigInt(snap.exitSlippageBps),
      BigInt(snap.rewardTokenChangeBps7d),
      BigInt(snap.confidenceBps),
      snap.sourceHash
    ]
  ) as `0x${string}`;
}

export function hashReasons(reasons: string[]): `0x${string}` {
  const sorted = [...reasons].sort();
  return keccak256(toUtf8Bytes(sorted.join(','))) as `0x${string}`;
}

export function hashDecisionReceipt(receipt: DecisionReceipt): `0x${string}` {
  let oppIdBytes32 = receipt.opportunityId;
  if (oppIdBytes32.length === 42) {
    oppIdBytes32 = ('0x' + oppIdBytes32.slice(2).padStart(64, '0')) as `0x${string}`;
  }

  return solidityPackedKeccak256(
    ['bytes32', 'bytes32', 'string', 'uint8', 'uint8', 'uint8', 'uint256', 'uint256', 'bytes32', 'uint256'],
    [
      receipt.reportId,
      oppIdBytes32,
      receipt.actionType,
      REGIME_MAP[receipt.marketRegime],
      YIELD_MAP[receipt.yieldState],
      DECISION_MAP[receipt.decision],
      receipt.maxPositionUsd,
      BigInt(receipt.maxSlippageBps),
      receipt.reasonsHash,
      BigInt(receipt.validUntil)
    ]
  ) as `0x${string}`;
}

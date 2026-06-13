import { z } from 'zod';
import { MarketRegime, YieldState, PolicyDecision } from './types.js';

// Helper for BigInt parsing
export const BigIntSchema = z.union([
  z.bigint(),
  z.string().regex(/^-?\d+$/).transform(val => BigInt(val)),
  z.number().int().transform(val => BigInt(val))
]);

export const NonNegativeBigIntSchema = BigIntSchema.refine(val => val >= 0n, {
  message: "BigInt must be non-negative"
});

export const MarketSnapshotSchema = z.object({
  observedAt: z.number().int().nonnegative(),
  validUntil: z.number().int().nonnegative(),
  volatilityBps: z.number().int().nonnegative(),
  priceDivergenceBps: z.number().int().nonnegative(),
  bridgeNetOutflowUsd: NonNegativeBigIntSchema,
  stablecoinDepegBps: z.number().int().nonnegative(),
  liquidityDepthUsd: NonNegativeBigIntSchema,
  confidenceBps: z.number().int().min(0).max(10000),
  sourceHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/)
}).strict().refine(data => data.validUntil > data.observedAt, {
  message: "validUntil must be strictly after observedAt",
  path: ["validUntil"]
});

export const YieldSnapshotSchema = z.object({
  opportunityId: z.string().regex(/^0x[a-fA-F0-9]{40}$|^0x[a-fA-F0-9]{64}$/),
  observedAt: z.number().int().nonnegative(),
  validUntil: z.number().int().nonnegative(),
  totalApyBps: z.number().int().nonnegative(),
  baseApyBps: z.number().int().nonnegative(),
  rewardApyBps: z.number().int().nonnegative(),
  tvlUsd: NonNegativeBigIntSchema,
  netFlowUsd24h: BigIntSchema,
  feesUsd24h: NonNegativeBigIntSchema,
  liquidityDepthUsd: NonNegativeBigIntSchema,
  exitSlippageBps: z.number().int().nonnegative(),
  rewardTokenChangeBps7d: z.number().int(),
  confidenceBps: z.number().int().min(0).max(10000),
  sourceHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/)
}).strict().refine(data => data.validUntil > data.observedAt, {
  message: "validUntil must be strictly after observedAt",
  path: ["validUntil"]
}).refine(data => data.totalApyBps === data.baseApyBps + data.rewardApyBps, {
  message: "totalApyBps must equal baseApyBps + rewardApyBps",
  path: ["totalApyBps"]
});

export const DecisionReceiptSchema = z.object({
  reportId: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
  opportunityId: z.string().regex(/^0x[a-fA-F0-9]{40}$|^0x[a-fA-F0-9]{64}$/),
  actionType: z.string().min(1),
  marketRegime: z.enum(["NORMAL", "VOLATILE", "PANIC"] as [MarketRegime, ...MarketRegime[]]),
  yieldState: z.enum(["HEALTHY", "WATCH", "DECAYING", "EXIT"] as [YieldState, ...YieldState[]]),
  decision: z.enum(["ALLOW", "RESTRICT", "BLOCK", "UNWIND"] as [PolicyDecision, ...PolicyDecision[]]),
  maxPositionUsd: NonNegativeBigIntSchema,
  maxSlippageBps: z.number().int().min(0).max(10000),
  reasonsHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
  validUntil: z.number().int().nonnegative()
}).strict();

export interface PolicyLimits {
  maxPositionUsd: bigint;
  maxSlippageBps: number;
}

export const StandardLimits = {
  NORMAL_MAX_POSITION_USD: 1_000_000n, // $1M
  NORMAL_MAX_SLIPPAGE_BPS: 100, // 1%

  RESTRICTED_MAX_POSITION_USD: 250_000n, // $250k
  RESTRICTED_MAX_SLIPPAGE_BPS: 50 // 0.5%
} as const;

export function getPolicyLimits(
  decision: "ALLOW" | "RESTRICT" | "BLOCK" | "UNWIND"
): PolicyLimits {
  switch (decision) {
    case "ALLOW":
      return {
        maxPositionUsd: StandardLimits.NORMAL_MAX_POSITION_USD,
        maxSlippageBps: StandardLimits.NORMAL_MAX_SLIPPAGE_BPS
      };
    case "RESTRICT":
      return {
        maxPositionUsd: StandardLimits.RESTRICTED_MAX_POSITION_USD,
        maxSlippageBps: StandardLimits.RESTRICTED_MAX_SLIPPAGE_BPS
      };
    case "UNWIND":
    case "BLOCK":
    default:
      return {
        maxPositionUsd: 0n,
        maxSlippageBps: 0
      };
  }
}

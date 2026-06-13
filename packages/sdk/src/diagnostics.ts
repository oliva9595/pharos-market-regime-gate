export interface DiagnosticResult {
  allowed: boolean;
  reason: string;
  recommendation: string;
}

export function diagnosePolicyFailure(reason: string): DiagnosticResult {
  let recommendation = "Check parameters and try again.";

  if (reason.includes("blacklisted")) {
    recommendation = "Target target address is blacklisted due to security risks. Choose a verified vault instead.";
  } else if (reason.includes("unverified") || (reason.includes("MarketGate") && reason.includes("blocked"))) {
    recommendation = "Market regime is unstable. Wait for volatility to drop, or use a verified protocol target.";
  } else if (reason.includes("YieldGate") && reason.includes("blocked")) {
    recommendation = "Opportunity is decaying. Deposits are blocked. Unwind/withdraw to preserve capital.";
  } else if (reason.includes("position size")) {
    recommendation = "Requested amount exceeds limits ($250k in volatile/watch, $1M in normal). Reduce transaction size.";
  } else if (reason.includes("slippage")) {
    recommendation = "Slippage parameter is too loose (max 0.5% in volatile/watch, 1% in normal). Tighten slippage.";
  }

  return {
    allowed: false,
    reason,
    recommendation
  };
}

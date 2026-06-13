import { ethers, Contract } from 'ethers';

const REGISTRY_ABI = [
  "function getLatestReport(bytes32 opportunityId) view returns (tuple(bytes32 reportId, bytes32 opportunityId, uint8 marketRegime, uint8 yieldState, uint16 confidenceBps, uint256 observedAt, uint256 validUntil, uint256 sequenceNumber))",
  "function latestSequenceNumbers(bytes32 opportunityId) view returns (uint256)"
];

export async function readLatestReport(
  registryAddress: string,
  opportunityId: string,
  provider: ethers.JsonRpcProvider
) {
  const contract = new Contract(registryAddress, REGISTRY_ABI, provider);
  
  let oppIdBytes32 = opportunityId;
  if (oppIdBytes32.length === 42) {
    oppIdBytes32 = '0x' + oppIdBytes32.slice(2).padStart(64, '0');
  }

  const report = await contract.getLatestReport(oppIdBytes32);
  
  const REGIME_MAP = ["NORMAL", "VOLATILE", "PANIC"];
  const YIELD_MAP = ["HEALTHY", "WATCH", "DECAYING", "EXIT"];

  return {
    reportId: report.reportId,
    opportunityId: report.opportunityId,
    marketRegime: REGIME_MAP[Number(report.marketRegime)] ?? "NORMAL",
    yieldState: YIELD_MAP[Number(report.yieldState)] ?? "HEALTHY",
    confidenceBps: Number(report.confidenceBps),
    observedAt: Number(report.observedAt),
    validUntil: Number(report.validUntil),
    sequenceNumber: Number(report.sequenceNumber)
  };
}

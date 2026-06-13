import { ethers, Contract, Wallet } from 'ethers';

const ENGINE_ABI = [
  "function checkAction(tuple(address target, bytes data, uint256 value, string actionType, bytes32 opportunityId, uint256 positionUsd, uint256 requestedSlippageBps) ctx) view returns (bool allowed, string reason)",
  "function executeAction(tuple(address target, bytes data, uint256 value, string actionType, bytes32 opportunityId, uint256 positionUsd, uint256 requestedSlippageBps) ctx) payable returns (bytes)"
];

export async function checkActionOnChain(
  engineAddress: string,
  ctx: any,
  provider: ethers.JsonRpcProvider
): Promise<{ allowed: boolean; reason: string }> {
  const contract = new Contract(engineAddress, ENGINE_ABI, provider);
  
  let oppIdBytes32 = ctx.opportunityId;
  if (oppIdBytes32.length === 42) {
    oppIdBytes32 = '0x' + oppIdBytes32.slice(2).padStart(64, '0');
  }

  const formattedCtx = {
    target: ctx.target,
    data: ctx.data ?? '0x',
    value: BigInt(ctx.value ?? 0),
    actionType: ctx.actionType,
    opportunityId: oppIdBytes32,
    positionUsd: BigInt(ctx.positionUsd),
    requestedSlippageBps: BigInt(ctx.requestedSlippageBps)
  };

  try {
    const [allowed, reason] = await contract.checkAction(formattedCtx);
    return { allowed, reason };
  } catch (err: any) {
    return { allowed: false, reason: err.message };
  }
}

export async function executeActionOnChain(
  engineAddress: string,
  ctx: any,
  wallet: Wallet
): Promise<string> {
  const contract = new Contract(engineAddress, ENGINE_ABI, wallet);

  let oppIdBytes32 = ctx.opportunityId;
  if (oppIdBytes32.length === 42) {
    oppIdBytes32 = '0x' + oppIdBytes32.slice(2).padStart(64, '0');
  }

  const formattedCtx = {
    target: ctx.target,
    data: ctx.data ?? '0x',
    value: BigInt(ctx.value ?? 0),
    actionType: ctx.actionType,
    opportunityId: oppIdBytes32,
    positionUsd: BigInt(ctx.positionUsd),
    requestedSlippageBps: BigInt(ctx.requestedSlippageBps)
  };

  const tx = await contract.executeAction(formattedCtx, {
    value: formattedCtx.value
  });
  await tx.wait();
  return tx.hash;
}

const ENGINE_ABI = [
  'function checkAction(tuple(address target, bytes data, uint256 value, string actionType, bytes32 opportunityId, uint256 positionUsd, uint256 requestedSlippageBps) ctx) view returns (bool allowed, string reason)',
  'function executeAction(tuple(address target, bytes data, uint256 value, string actionType, bytes32 opportunityId, uint256 positionUsd, uint256 requestedSlippageBps) ctx) payable returns (bytes)'
];

export function toBytes32(value) {
  if (/^0x[0-9a-fA-F]{64}$/.test(value)) return value.toLowerCase();
  if (/^0x[0-9a-fA-F]{40}$/.test(value)) {
    return `0x${value.slice(2).padStart(64, '0')}`.toLowerCase();
  }
  throw new Error('Opportunity ID must be an address or bytes32 hex value.');
}

export function buildActionContext(scenario) {
  return {
    target: scenario.target,
    data: scenario.data || '0x',
    value: BigInt(scenario.value || 0),
    actionType: scenario.actionType,
    opportunityId: toBytes32(scenario.opportunityId),
    positionUsd: BigInt(scenario.positionUsd),
    requestedSlippageBps: BigInt(scenario.requestedSlippageBps)
  };
}

export function evaluateMockExecution(scenario) {
  return {
    allowed: scenario.allowed,
    decision: scenario.decision,
    reason: scenario.allowed ? 'Policy simulation passed.' : 'Policy simulation rejected the action.',
    reasonCodes: [...scenario.reasonCodes],
    reportId: `mock-${scenario.id}`,
    maxPositionUsd: BigInt(scenario.maxPositionUsd),
    maxSlippageBps: BigInt(scenario.maxSlippageBps),
    context: buildActionContext(scenario)
  };
}

export function createEngineClient({ ethersApi, engineAddress, provider, signer }) {
  if (!ethersApi?.Contract) throw new Error('Ethers Contract API is unavailable.');
  if (!provider) throw new Error('A Web3 provider is required.');

  const readContract = new ethersApi.Contract(engineAddress, ENGINE_ABI, provider);

  return {
    async check(scenario) {
      const [allowed, reason] = await readContract.checkAction(buildActionContext(scenario));
      return { allowed: Boolean(allowed), reason };
    },

    async execute(scenario) {
      if (!signer) throw new Error('Connect a wallet before executing an action.');
      const writeContract = new ethersApi.Contract(engineAddress, ENGINE_ABI, signer);
      const context = buildActionContext(scenario);
      const tx = await writeContract.executeAction(context, { value: context.value });
      const receipt = await tx.wait();
      return { hash: tx.hash, blockNumber: receipt.blockNumber };
    }
  };
}

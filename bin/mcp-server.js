#!/usr/bin/env node
require('dotenv').config({ path: ['.env.local', '.env'] });

const { SentinelSdk } = require('../packages/sdk/dist/index.js');

const rpcUrl = process.env.PHAROS_RPC_URL ?? 'https://atlantic.dplabs-internal.com';
const engineAddress = process.env.ENGINE_ADDRESS ?? process.env.PHAROS_ENGINE_ADDRESS;
const registryAddress = process.env.REGISTRY_ADDRESS ?? process.env.PHAROS_REGISTRY_ADDRESS;

let sdk = null;
let initError = null;

try {
  if (!engineAddress || !registryAddress) {
    throw new Error("Missing ENGINE_ADDRESS or REGISTRY_ADDRESS configurations.");
  }
  sdk = new SentinelSdk({
    rpcUrl,
    engineAddress,
    registryAddress
  });
} catch (err) {
  initError = err.message;
}

async function main() {
  const { Server } = await import("@modelcontextprotocol/sdk/server/index.js");
  const { StdioServerTransport } = await import("@modelcontextprotocol/sdk/server/stdio.js");
  const { CallToolRequestSchema, ListToolsRequestSchema } = await import("@modelcontextprotocol/sdk/types.js");

  const server = new Server(
    { name: "pharos-sentinel-mcp", version: "2.0.0" },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: "get_market_regime",
          description: "Fetch current global market regime state and metadata.",
          inputSchema: { type: "object", properties: {} }
        },
        {
          name: "get_yield_state",
          description: "Fetch yield decay state for a specific opportunity.",
          inputSchema: {
            type: "object",
            properties: {
              opportunityId: { type: "string", description: "Opportunity ID (e.g. vault address or hash)" }
            },
            required: ["opportunityId"]
          }
        },
        {
          name: "check_action",
          description: "Simulate a proposed action against combined risk policies on-chain.",
          inputSchema: {
            type: "object",
            properties: {
              target: { type: "string", description: "Target contract address" },
              actionType: { type: "string", description: "Action type (e.g. DEPOSIT, WITHDRAW, SWAP)" },
              positionUsd: { type: "number", description: "Transaction size in USD" },
              requestedSlippageBps: { type: "number", description: "Slippage limit in basis points" },
              opportunityId: { type: "string", description: "Opportunity ID", default: "0x0000000000000000000000000000000000000000" }
            },
            required: ["target", "actionType", "positionUsd", "requestedSlippageBps"]
          }
        },
        {
          name: "execute_action",
          description: "Execute a transaction with keeper signature and policy verification.",
          inputSchema: {
            type: "object",
            properties: {
              target: { type: "string" },
              data: { type: "string", default: "0x" },
              value: { type: "string", default: "0" },
              actionType: { type: "string" },
              positionUsd: { type: "number" },
              requestedSlippageBps: { type: "number" },
              opportunityId: { type: "string", default: "0x0000000000000000000000000000000000000000" }
            },
            required: ["target", "actionType", "positionUsd", "requestedSlippageBps"]
          }
        },
        {
          name: "explain_decision",
          description: "Get actionable advice and recommendations for a policy failure reason.",
          inputSchema: {
            type: "object",
            properties: {
              reason: { type: "string", description: "Fail or revert reason string" }
            },
            required: ["reason"]
          }
        }
      ]
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    if (initError) {
      return { content: [{ type: "text", text: initError }], isError: true };
    }

    try {
      switch (name) {
        case "get_market_regime": {
          const r = await sdk.getExecutionReadiness('0x0000000000000000000000000000000000000000');
          return { content: [{ type: "text", text: JSON.stringify(r) }] };
        }
        case "get_yield_state": {
          const r = await sdk.getExecutionReadiness(args.opportunityId);
          return { content: [{ type: "text", text: JSON.stringify(r) }] };
        }
        case "check_action": {
          const result = await sdk.checkAction({
            target: args.target,
            actionType: args.actionType,
            positionUsd: args.positionUsd,
            requestedSlippageBps: args.requestedSlippageBps,
            opportunityId: args.opportunityId || "0x0000000000000000000000000000000000000000"
          });
          return { content: [{ type: "text", text: JSON.stringify(result) }] };
        }
        case "execute_action": {
          const pkey = process.env.PHAROS_KEEPER_PRIVATE_KEY || process.env.PHAROS_DEPLOYER_PRIVATE_KEY;
          if (!pkey) throw new Error("Missing wallet private key configuration.");

          const result = await sdk.safeExecuteAction({
            target: args.target,
            data: args.data || "0x",
            value: args.value || "0",
            actionType: args.actionType,
            positionUsd: args.positionUsd,
            requestedSlippageBps: args.requestedSlippageBps,
            opportunityId: args.opportunityId || "0x0000000000000000000000000000000000000000"
          }, pkey);
          return { content: [{ type: "text", text: JSON.stringify(result) }] };
        }
        case "explain_decision": {
          const result = sdk.explainDecision(args.reason);
          return { content: [{ type: "text", text: JSON.stringify(result) }] };
        }
        default:
          throw new Error(`Tool not found: ${name}`);
      }
    } catch (err) {
      return { content: [{ type: "text", text: err.message }], isError: true };
    }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  process.exit(1);
});

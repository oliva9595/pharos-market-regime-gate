#!/usr/bin/env node
require('dotenv').config({ path: ['.env.local', '.env'] });

const { ethers } = require("ethers");
const { ExecutionEngineSDK } = require("../index");

const rpcUrl = process.env.PHAROS_RPC_URL || process.env.RPC_URL || process.env.PHAROS_ATLANTIC_RPC_URL;
const privateKey = process.env.PHAROS_PRIVATE_KEY || process.env.PRIVATE_KEY || process.env.PHAROS_DEPLOYER_PRIVATE_KEY;
const engineAddress = process.env.PHAROS_ENGINE_ADDRESS || process.env.ENGINE_ADDRESS || process.env.EXECUTION_ENGINE_CORE_ADDRESS;

let sdk = null;
let initError = null;

try {
    if (!rpcUrl || !privateKey || !engineAddress) {
        throw new Error("Missing parameters configuration.");
    }
    sdk = new ExecutionEngineSDK(rpcUrl, privateKey, engineAddress);
} catch (err) {
    initError = err.message;
}

async function main() {
    const { Server } = await import("@modelcontextprotocol/sdk/server/index.js");
    const { StdioServerTransport } = await import("@modelcontextprotocol/sdk/server/stdio.js");
    const { CallToolRequestSchema, ListToolsRequestSchema } = await import("@modelcontextprotocol/sdk/types.js");

    const server = new Server(
        { name: "pharos-mcp", version: "1.2.0" },
        { capabilities: { tools: {} } }
    );

    server.setRequestHandler(ListToolsRequestSchema, async () => {
        return {
            tools: [
                {
                    name: "get_market_regime",
                    description: "Fetch current market regime state.",
                    inputSchema: { type: "object", properties: {} }
                },
                {
                    name: "set_market_regime",
                    description: "Set market regime state (0=NORMAL, 1=VOLATILE, 2=PANIC).",
                    inputSchema: {
                        type: "object",
                        properties: { regime: { type: "integer", description: "State code" } },
                        required: ["regime"]
                    }
                },
                {
                    name: "safe_execute",
                    description: "Submit safe execution with regime checks.",
                    inputSchema: {
                        type: "object",
                        properties: {
                            target: { type: "string" },
                            data: { type: "string", default: "0x" },
                            value: { type: "string", default: "0" }
                        },
                        required: ["target"]
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
                    const r = await sdk.getMarketRegime();
                    const regimes = ["NORMAL", "VOLATILE", "PANIC"];
                    return { content: [{ type: "text", text: JSON.stringify({ code: r, label: regimes[r] }) }] };
                }
                case "set_market_regime": {
                    await sdk.setMarketRegime(args.regime);
                    return { content: [{ type: "text", text: "Regime updated successfully!" }] };
                }
                case "safe_execute": {
                    const receipt = await sdk.safeExecute(args.target, args.data, args.value);
                    return {
                        content: [{
                            type: "text",
                            text: JSON.stringify({
                                success: true,
                                txHash: receipt.hash || receipt.transactionHash,
                                blockNumber: receipt.blockNumber
                            })
                        }]
                    };
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

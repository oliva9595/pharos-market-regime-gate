#!/usr/bin/env node
require('dotenv').config({ path: ['.env.local', '.env'] });

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const { ExecutionEngineSDK } = require('../index');

function getSDKParams(argv) {
    const rpcUrl = argv.rpcUrl || process.env.RPC_URL || process.env.PHAROS_RPC_URL || process.env.PHAROS_ATLANTIC_RPC_URL;
    const privateKey = argv.privateKey || process.env.PRIVATE_KEY || process.env.PHAROS_DEPLOYER_PRIVATE_KEY;
    const engineAddress = argv.engineAddress || process.env.ENGINE_ADDRESS || process.env.EXECUTION_ENGINE_CORE_ADDRESS;

    if (!rpcUrl) throw new Error("Missing RPC URL.");
    if (!privateKey) throw new Error("Missing Private Key.");
    if (!engineAddress) throw new Error("Missing Engine Address.");

    return { rpcUrl, privateKey, engineAddress };
}

yargs(hideBin(process.argv))
    .usage('Usage: $0 <command> [options]')
    .command(
        'check-regime',
        'Inquire current Market Regime status',
        (yargs) => yargs,
        async (argv) => {
            try {
                const { rpcUrl, privateKey, engineAddress } = getSDKParams(argv);
                const sdk = new ExecutionEngineSDK(rpcUrl, privateKey, engineAddress);
                const regime = await sdk.getMarketRegime();
                const regimes = ["NORMAL", "VOLATILE", "PANIC"];
                console.log(`Current Market Regime: ${regimes[regime]} (${regime})`);
            } catch (err) {
                console.error(`Error checking regime: ${err.message}`);
                process.exit(1);
            }
        }
    )
    .command(
        'set-regime <value>',
        'Set current Market Regime (0=NORMAL, 1=VOLATILE, 2=PANIC)',
        (yargs) => yargs.positional('value', { type: 'number' }),
        async (argv) => {
            try {
                const { rpcUrl, privateKey, engineAddress } = getSDKParams(argv);
                const sdk = new ExecutionEngineSDK(rpcUrl, privateKey, engineAddress);
                console.log(`Setting Market Regime to: ${argv.value}`);
                await sdk.setMarketRegime(argv.value);
                console.log("Regime updated successfully!");
            } catch (err) {
                console.error(`Error setting regime: ${err.message}`);
                process.exit(1);
            }
        }
    )
    .command(
        'safety-check <target>',
        'Verify target safety checks',
        (yargs) => yargs.positional('target', { type: 'string' }),
        async (argv) => {
            try {
                const { rpcUrl, privateKey, engineAddress } = getSDKParams(argv);
                const sdk = new ExecutionEngineSDK(rpcUrl, privateKey, engineAddress);
                const { isContract, isBlacklisted } = await sdk.checkTargetSafety(argv.target);
                console.log(`Is Contract: ${isContract}`);
                console.log(`Is Blacklisted: ${isBlacklisted}`);
            } catch (err) {
                console.error(`Error: ${err.message}`);
                process.exit(1);
            }
        }
    )
    .command(
        'mcp-start',
        'Launch MCP Server',
        () => {},
        () => {
            const mcpServerPath = path.resolve(__dirname, 'mcp-server.js');
            const child = spawn('node', [mcpServerPath], { stdio: 'inherit' });
            child.on('close', (code) => process.exit(code || 0));
        }
    )
    .demandCommand(1, 'Command required.')
    .help()
    .argv;

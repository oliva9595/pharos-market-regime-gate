#!/usr/bin/env node
require('dotenv').config({ path: ['.env.local', '.env'] });

const { spawn } = require('child_process');
const path = require('path');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const { SentinelSdk } = require('../packages/sdk/dist/index.js');

function getSdk() {
  const rpcUrl = process.env.PHAROS_RPC_URL ?? 'https://atlantic.dplabs-internal.com';
  const engineAddress = process.env.ENGINE_ADDRESS ?? process.env.PHAROS_ENGINE_ADDRESS;
  const registryAddress = process.env.REGISTRY_ADDRESS ?? process.env.PHAROS_REGISTRY_ADDRESS;

  if (!engineAddress || !registryAddress) {
    throw new Error("Missing ENGINE_ADDRESS or REGISTRY_ADDRESS environment variables.");
  }

  return new SentinelSdk({
    rpcUrl,
    engineAddress,
    registryAddress
  });
}

yargs(hideBin(process.argv))
  .usage('Usage: $0 <command> [options]')
  .command(
    'market',
    'Get current Market Regime state',
    (yargs) => yargs,
    async (argv) => {
      try {
        const sdk = getSdk();
        const report = await sdk.getExecutionReadiness('0x0000000000000000000000000000000000000000');
        console.log(`Current Market Regime: ${report.marketRegime} (Confidence: ${report.confidenceBps} BPS)`);
      } catch (err) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    }
  )
  .command(
    'yield <opportunityId>',
    'Get Yield Decay state for an opportunity',
    (yargs) => yargs.positional('opportunityId', { type: 'string' }),
    async (argv) => {
      try {
        const sdk = getSdk();
        const report = await sdk.getExecutionReadiness(argv.opportunityId);
        console.log(`Yield State: ${report.yieldState} (Sequence: ${report.sequenceNumber})`);
      } catch (err) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    }
  )
  .command(
    'check <target> <actionType> <positionUsd> <slippageBps> [opportunityId]',
    'Verify action eligibility using ExecutionEngine simulation',
    (yargs) => yargs
      .positional('target', { type: 'string' })
      .positional('actionType', { type: 'string' })
      .positional('positionUsd', { type: 'number' })
      .positional('slippageBps', { type: 'number' })
      .positional('opportunityId', { type: 'string', default: '0x0000000000000000000000000000000000000000' }),
    async (argv) => {
      try {
        const sdk = getSdk();
        const res = await sdk.checkAction({
          target: argv.target,
          actionType: argv.actionType,
          positionUsd: argv.positionUsd,
          requestedSlippageBps: argv.slippageBps,
          opportunityId: argv.opportunityId
        });
        if (res.allowed) {
          console.log("✅ Action is ALLOWED under current risk policy.");
        } else {
          console.log(`❌ Action is BLOCKED: ${res.reason}`);
          console.log(`💡 Recommendation: ${res.diagnostics.recommendation}`);
        }
      } catch (err) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    }
  )
  .command(
    'execute <target> <data> <value> <actionType> <positionUsd> <slippageBps> [opportunityId]',
    'Execute transaction with risk engine verification',
    (yargs) => yargs
      .positional('target', { type: 'string' })
      .positional('data', { type: 'string' })
      .positional('value', { type: 'string' })
      .positional('actionType', { type: 'string' })
      .positional('positionUsd', { type: 'number' })
      .positional('slippageBps', { type: 'number' })
      .positional('opportunityId', { type: 'string', default: '0x0000000000000000000000000000000000000000' }),
    async (argv) => {
      try {
        const pkey = process.env.PHAROS_KEEPER_PRIVATE_KEY || process.env.PHAROS_DEPLOYER_PRIVATE_KEY;
        if (!pkey) throw new Error("Missing wallet private key env variable.");
        
        const sdk = getSdk();
        const res = await sdk.safeExecuteAction({
          target: argv.target,
          data: argv.data,
          value: argv.value,
          actionType: argv.actionType,
          positionUsd: argv.positionUsd,
          requestedSlippageBps: argv.slippageBps,
          opportunityId: argv.opportunityId
        }, pkey);

        if (res.success) {
          console.log(`✅ Tx executed successfully! Hash: ${res.txHash}`);
        } else {
          console.log(`❌ Tx failed: ${res.error}`);
          if (res.diagnostics) {
            console.log(`💡 Recommendation: ${res.diagnostics.recommendation}`);
          }
        }
      } catch (err) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    }
  )
  .command(
    'explain <reason>',
    'Explain a risk policy failure or revert reason',
    (yargs) => yargs.positional('reason', { type: 'string' }),
    async (argv) => {
      const sdk = getSdk();
      const explanation = sdk.explainDecision(argv.reason);
      console.log(`Failure Reason: ${explanation.reason}`);
      console.log(`Actionable Advice: ${explanation.recommendation}`);
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

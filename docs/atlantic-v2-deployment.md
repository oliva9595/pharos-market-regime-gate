# Atlantic V2 Deployment

V2 uses entirely new deployer and reporter wallets. Never reuse V1 keys or commit private keys.

## Prerequisites

1. Copy `.env.example` to `.env` and populate new wallet addresses and keys.
2. Fund deployer and reporter with test PHRS.
3. Confirm `PHAROS_RPC_URL` is `https://atlantic.dplabs-internal.com`.
4. Run `npm test`, `npm run test:contracts`, `npm run build`, and `npm run check:secrets`.

## Deploy And Configure

```powershell
forge script scripts/DeployV2.s.sol:DeployV2 --rpc-url $env:PHAROS_RPC_URL --broadcast
forge script scripts/ConfigureV2.s.sol:ConfigureV2 --rpc-url $env:PHAROS_RPC_URL --broadcast
forge script scripts/CheckV2.s.sol:CheckV2 --rpc-url $env:PHAROS_RPC_URL
```

Review `deployments/atlantic-v2.json`, set `status` to `deployed` only after `CheckV2` succeeds, then run `npm run check:atlantic`.

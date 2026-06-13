import dotenv from 'dotenv';
dotenv.config();

export const config = {
  rpcUrl: process.env.PHAROS_RPC_URL ?? 'https://atlantic.dplabs-internal.com',
  keeperPrivateKey: process.env.PHAROS_KEEPER_PRIVATE_KEY ?? '',
  registryAddress: process.env.REGISTRY_ADDRESS ?? '0x0000000000000000000000000000000000000000', // deployed V2 registry address
  cooldownSeconds: 60,
  staleThresholdSeconds: 300,
};

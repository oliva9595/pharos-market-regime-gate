# Pharos Market Regime Gate V1 Baseline Audit

This document freezes the baseline of the V1 system before upgrading to V2.

## Deployment Information
- **Network**: Pharos Atlantic Testnet
- **Baseline Git Commit**: `a9c6b5002659cbddcd7d5f1be1676ba4ca5d481e`
- **ProtocolRegistry Address**: `0xbe713906E4D5ac544C069Cd16B2233C979b8AB5a`
- **ExecutionEngine Address**: `0x8A3e25CbB9e07B122fFBD8718eAD597E0dCCF8f4`
- **MarketRegimeGate Address**: `0xECF86Cf42d27582FDcc60Eed65F0bB7567c789CF`

## Contract Methods and Interfaces

### [ProtocolRegistry.sol](file:///d:/dorahack/pharos-market-regime-gate/src/ProtocolRegistry.sol)
- `setVerified(address addr, bool status)` (onlyOwner)
- `setBlacklisted(address addr, bool status)` (onlyOwner)
- `checkAddress(address addr) external view returns (bool)` - Reverts if blacklisted, returns verification status.

### [SlippageGuard.sol](file:///d:/dorahack/pharos-market-regime-gate/src/SlippageGuard.sol)
- `verifySlippage(address target, bytes calldata data, uint256 maxSlippageBps) external view returns (bool)` - Decodes selector (Uniswap V2) and verifies that output min satisfies expected slippage boundaries.

### [MarketRegimeGate.sol](file:///d:/dorahack/pharos-market-regime-gate/src/MarketRegimeGate.sol)
- `currentRegime()` - Returns `Regime` (`NORMAL = 0`, `VOLATILE = 1`, `PANIC = 2`).
- `setMarketRegime(uint8 _regime)` (onlyOwner)
- `setRegistry(address _registry)` (onlyOwner)
- `verifyRegime(address target, bool isVerified) external view returns (bool)` - Reverts if panic, requires verification in volatile.

### [ExecutionEngine.sol](file:///d:/dorahack/pharos-market-regime-gate/src/ExecutionEngine.sol)
- `checkTx(address target, bytes calldata data, uint256 value) external view returns (bool)` - Runs registry, slippage guard, and regime gate checks.
- `executeTx(address target, bytes calldata data, uint256 value) external payable onlyAuthorized returns (bytes memory)` - Executes transaction after running registry, slippage guard, and regime gate checks.

## Known Limitations & Web3 Status
- Currently, Web3 mode only reads/writes the market regime status to/from the smart contract.
- It does **not** prove the full `checkTx` or `executeTx` enforcement on-chain via execution simulations or actual client-side wallet submissions.
- The regime updates are applied directly by owner transactions, with no off-chain keeper proving data freshness or cryptographically signed reports.
- Yield decay checks are not implemented in V1.

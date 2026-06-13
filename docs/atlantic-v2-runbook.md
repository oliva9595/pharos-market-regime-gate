# Atlantic V2 Runbook

Network: Pharos Atlantic, chain ID `688689`, explorer `https://atlantic.pharosscan.xyz`.

1. Verify all local quality gates.
2. Verify deployer/reporter are separate, funded test wallets.
3. Deploy and configure using `docs/atlantic-v2-deployment.md`.
4. Start keeper in deterministic demo mode.
5. Publish fresh global and opportunity reports.
6. Run safe yield, volatile restriction, yield decay block, panic block, and safe unwind.
7. Record report IDs, transaction hashes or revert reasons, and block numbers.
8. Reconcile dashboard, API, and on-chain state.

Do not publish reports when source confidence is below policy minimum. Pause ingestion after suspected reporter compromise.

# Keeper Key Management

- Use a dedicated reporter key, separate from deployer, owner, and demo client.
- Load keys only from local environment or a production secret manager.
- Never place keys in browser code, logs, manifests, screenshots, or repository files.
- Fund with the minimum operational PHRS and alert on low balance.
- Rotate immediately after suspected disclosure; authorize the replacement before revoking the old reporter.
- Prefer hardware-backed signing or multisig-controlled reporter administration before public beta.

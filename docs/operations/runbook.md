# Operations Runbook

## Routine Checks

- Reporter balance and authorization
- Latest report age, sequence, confidence, and validity
- Keeper queue failures and RPC health
- API health/history persistence
- Dashboard stale/error indicators

## Alerts

Alert immediately when reports are stale, confidence falls below `6000 bps`, reporter balance cannot fund the next submission, submissions repeatedly fail, or state transitions occur faster than cooldown policy.

## Emergency

Pause `RiskReportRegistry` ingestion, rotate reporter credentials, preserve safe unwind paths, and follow `docs/security/incident-response.md`.

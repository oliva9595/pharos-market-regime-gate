# API

Default base URL: `http://localhost:3000`.

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/health` | API health |
| `GET` | `/api/market/status` | Current and historical market state |
| `GET` | `/api/yield/status?opportunityId=...` | Yield state and factors |
| `GET` | `/api/decisions/history` | Decision receipts |
| `POST` | `/api/decisions` | Persist a decision receipt |

Responses expose classifications, reasons, confidence, freshness, and bounded history. Errors must not reveal secrets or raw internal stack traces.

Agent SDK methods:

- `getExecutionReadiness`
- `checkAction`
- `safeExecuteAction`
- `explainDecision`

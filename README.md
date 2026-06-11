# Pharos Execution Shield (PES) - Volatility Gate

Transaction safety and market regime middleware for autonomous AI agents on Pharos Network.

## Partner Integrations

This project integrates technologies from the official Pharos Atlantic hackathon partners:

1. **GoPlus Security (Address Security API)**
   The Node SDK dynamically queries GoPlus API endpoints before transaction broadcasts to intercept blacklisted cybercrime, phishing, and malicious addresses.
   
2. **CertiK (Security Score Integration)**
   The Protocol Registry and Web Sandbox uses CertiK SkyNet ratings. During `VOLATILE` market states, Gate 7 limits transactions only to protocols with verified CertiK Security scores (>80).
   
3. **Anvita Flow (Execution Flow Middleware)**
   PES acts as an execution interceptor for Anvita Flow graphs. Detailed revert diagnostics are returned to Anvita node coordinators to trigger auto-healing fallback paths.

4. **Alibaba Cloud (Serverless Hosting)**
   MCP server, gas oracle cron, and diagnostics services are pre-configured to run serverless on Alibaba Cloud Function Compute for 99.9% uptime and zero idling costs.

## Quickstart

Initialize and test local smart contracts:
```bash
npm install
forge test
npm run demo-web
```

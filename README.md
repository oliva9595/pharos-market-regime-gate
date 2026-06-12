# Pharos Volatility Sentinel and Market Regime Gate

Pharos Volatility Sentinel (formerly Pharos Execution Shield) is a transaction safety and market regime enforcement middleware designed for autonomous AI agents operating on the Pharos Network. It integrates real-time security checking, dynamic slippage control, on-chain market regime state gates, and detailed revert diagnostics to protect AI agent assets during execution.

## System Architecture

The project consists of four primary layers:

1. **On-chain Protective Gates (Foundry Contracts)**:
   * `ProtocolRegistry.sol`: Maintains verified and blacklisted protocol mappings on-chain.
   * `SlippageGuard.sol`: Enforces slippage threshold rules during automated trading.
   * `MarketRegimeGate.sol`: Holds the current market regime state (0 = NORMAL, 1 = VOLATILE, 2 = PANIC), which changes contract permissions dynamically.
   * `ExecutionEngine.sol`: The coordinator that aggregates checks and simulates/executes agent transactions atomically.

2. **Off-chain SDK and CLI (Node.js)**:
   * `ExecutionEngineSDK`: Built on Ethers.js v6 to query GoPlus APIs, manage wallet interactions, simulate transactions, and parse transaction reverts.
   * `CLI Utility`: Commands for testing regime state, modifying parameters, and verifying security settings.

3. **Model Context Protocol (MCP) Server**:
   * Exposes structured tools (`get_market_regime`, `set_market_regime`, `safe_execute`) allowing LLM agents to interact securely with Pharos smart contracts.

4. **Interactive Simulation Dashboard**:
   * A premium glassmorphic interface showing the system status.
   * **Three.js WebGL Particle System**: A 3D particle shield showing the regime status (Normal = Green, Volatile = Orange, Panic = Red) with speed-scaling rotation.
   * **HTML5 Canvas Visualizations**: Real-time rendering of Yield Agent (breathing radar chart), Arbitrage Agent (dual-line spread chart with profit bands), and Phishing Scam Agent (generative recursive dendritic tree).

## Partner Integrations

* **GoPlus Security (Address Security API)**: Integrates before transaction broadcasts to intercept blacklisted cybercrime, phishing, and drainer addresses.
* **CertiK (Security Score Integration)**: Restricts AI transactions during VOLATILE state to protocols with a SkyNet security score of >80.
* **Anvita Flow (Execution Flow Middleware)**: Connects with execution graphs to provide RevertDiagnose diagnostics, enabling LLMs to self-correct and execute alternative paths.
* **Alibaba Cloud (Serverless Hosting)**: Microservices, cron jobs, and MCP servers are configured to run serverless on Alibaba Cloud Function Compute.

## Smart Contract Deployments

Deployed on the Pharos Atlantic Testnet (Chain ID 688689):

* **ProtocolRegistry**: `0xbe713906E4D5ac544C069Cd16B2233C979b8AB5a`
* **SlippageGuard**: `0xdeB9B625e70E38cdb0dEe5DEAACa25A5095D512E`
* **MarketRegimeGate**: `0xECF86Cf42d27582FDcc60Eed65F0bB7567c789CF`
* **ExecutionEngine**: `0x8A3e25CbB9e07B122fFBD8718eAD597E0dCCF8f4`

## Getting Started

### Prerequisites

* Node.js (v18 or higher)
* Foundry (for compiling and testing Solidity smart contracts)

### Installation

Clone the repository and install dependencies:

```bash
npm install
```

### Smart Contract Verification

Compile and run smart contract unit tests using Foundry:

```bash
forge build
forge test
```

### Running the Web Dashboard

Start the local development server to view the Three.js WebGL shield and agent visualizations:

```bash
npm run demo-web
```

Open your browser and navigate to `http://localhost:8080`.

### Running CLI Commands

Use the local CLI to query and set values:

```bash
# Query the current on-chain market regime
node bin/cli.js check-regime

# Force set the market regime (owner only)
node bin/cli.js set-regime --value 1
```

### Starting the MCP Server

Start the Model Context Protocol server for agent integrations:

```bash
node bin/mcp-server.js
```

## Visualization Engines

The dashboard features custom graphics engines to represent system state:

* **Gate 7 WebGL Shield**: Runs on Three.js. Standard green particle rotation for NORMAL mode, orange 2.5x speed rotation for VOLATILE mode, and red 6.0x speed rotation for PANIC mode.
* **DeFi Yield Radar (2D Canvas)**: Renders a 5-axes radar web representing target protocol stats. Dynamically pulses and contracts to represent diminished performance or safety during volatile market regimes.
* **Arbitrage Dual-Line (2D Canvas)**: Renders sine waves representing DEX/CEX price spreads and highlights arbitrage windows with shaded profit bands.
* **Generative Scam Dendrite (2D Canvas)**: Uses a recursive branching algorithm to simulate malicious drainer contract interactions.

## License

This project is licensed under the Apache-2.0 License.

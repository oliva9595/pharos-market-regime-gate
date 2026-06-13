// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/RiskReportRegistry.sol";
import "../src/MarketRegimeGateV2.sol";
import "../src/YieldDecayGate.sol";
import "../src/ProtocolRegistry.sol";
import "../src/SlippageGuard.sol";
import "../src/ExecutionEngineV2.sol";

contract DeployV2 is Script {
    function run() external returns (
        RiskReportRegistry reports,
        MarketRegimeGateV2 marketGate,
        YieldDecayGate yieldGate,
        ProtocolRegistry registry,
        SlippageGuard slippageGuard,
        ExecutionEngineV2 engine
    ) {
        uint256 deployerKey = vm.envUint("PHAROS_DEPLOYER_PRIVATE_KEY");
        require(block.chainid == 688689, "DeployV2: Pharos Atlantic only");

        vm.startBroadcast(deployerKey);
        reports = new RiskReportRegistry();
        marketGate = new MarketRegimeGateV2(address(reports));
        yieldGate = new YieldDecayGate(address(reports));
        registry = new ProtocolRegistry();
        slippageGuard = new SlippageGuard();
        engine = new ExecutionEngineV2(address(registry), address(slippageGuard), address(marketGate), address(yieldGate));
        vm.stopBroadcast();

        string memory root = "atlantic-v2";
        vm.serializeUint(root, "chainId", block.chainid);
        vm.serializeAddress(root, "riskReportRegistry", address(reports));
        vm.serializeAddress(root, "marketRegimeGateV2", address(marketGate));
        vm.serializeAddress(root, "yieldDecayGate", address(yieldGate));
        vm.serializeAddress(root, "protocolRegistryV2", address(registry));
        vm.serializeAddress(root, "slippageGuardV2", address(slippageGuard));
        string memory json = vm.serializeAddress(root, "executionEngineV2", address(engine));
        vm.writeJson(json, "deployments/atlantic-v2.json");
    }
}

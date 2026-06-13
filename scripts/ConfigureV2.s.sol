// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/RiskReportRegistry.sol";
import "../src/ProtocolRegistry.sol";
import "../src/ExecutionEngineV2.sol";

contract ConfigureV2 is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("PHAROS_DEPLOYER_PRIVATE_KEY");
        address reporter = vm.envAddress("PHAROS_REPORTER_ADDRESS");
        address demoTarget = vm.envAddress("DEMO_TARGET_ADDRESS");
        RiskReportRegistry reports = RiskReportRegistry(vm.envAddress("RISK_REPORT_REGISTRY_ADDRESS"));
        ProtocolRegistry registry = ProtocolRegistry(vm.envAddress("PROTOCOL_REGISTRY_V2_ADDRESS"));
        ExecutionEngineV2 engine = ExecutionEngineV2(payable(vm.envAddress("EXECUTION_ENGINE_V2_ADDRESS")));
        require(block.chainid == 688689, "ConfigureV2: Pharos Atlantic only");
        require(reporter != address(0) && demoTarget != address(0), "ConfigureV2: zero address");

        vm.startBroadcast(deployerKey);
        reports.setReporter(reporter, true);
        registry.setVerified(demoTarget, true, keccak256("pharos-atlantic-demo-target-v2"));
        engine.setAuthorized(reporter, true);
        vm.stopBroadcast();
    }
}

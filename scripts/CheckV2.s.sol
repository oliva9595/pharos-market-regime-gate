// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/RiskReportRegistry.sol";
import "../src/MarketRegimeGateV2.sol";
import "../src/YieldDecayGate.sol";
import "../src/ExecutionEngineV2.sol";

contract CheckV2 is Script {
    function run() external view {
        require(block.chainid == 688689, "CheckV2: wrong chain");
        address reporter = vm.envAddress("PHAROS_REPORTER_ADDRESS");
        RiskReportRegistry reports = RiskReportRegistry(vm.envAddress("RISK_REPORT_REGISTRY_ADDRESS"));
        MarketRegimeGateV2 marketGate = MarketRegimeGateV2(vm.envAddress("MARKET_REGIME_GATE_V2_ADDRESS"));
        YieldDecayGate yieldGate = YieldDecayGate(vm.envAddress("YIELD_DECAY_GATE_ADDRESS"));
        ExecutionEngineV2 engine = ExecutionEngineV2(payable(vm.envAddress("EXECUTION_ENGINE_V2_ADDRESS")));

        require(address(reports).code.length > 0, "CheckV2: reports missing");
        require(address(marketGate).code.length > 0, "CheckV2: market gate missing");
        require(address(yieldGate).code.length > 0, "CheckV2: yield gate missing");
        require(address(engine).code.length > 0, "CheckV2: engine missing");
        require(address(marketGate.reportRegistry()) == address(reports), "CheckV2: market registry mismatch");
        require(address(yieldGate.reportRegistry()) == address(reports), "CheckV2: yield registry mismatch");
        require(reports.isReporter(reporter), "CheckV2: reporter unauthorized");
    }
}

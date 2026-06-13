// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../../src/RiskReportRegistry.sol";
import "../../src/MarketRegimeGateV2.sol";
import "../../src/YieldDecayGate.sol";
import "../../src/ProtocolRegistry.sol";
import "../../src/SlippageGuard.sol";
import "../../src/ExecutionEngineV2.sol";

contract SentinelFlowTarget {
    uint256 public calls;
    function execute() external { calls++; }
}

contract SentinelFlowIntegrationTest is Test {
    uint256 reporterKey = 0xA11CE;
    address reporter;
    bytes32 opportunity = keccak256("sentinel-flow-opportunity");

    RiskReportRegistry reports;
    ProtocolRegistry registry;
    ExecutionEngineV2 engine;
    SentinelFlowTarget target;

    function setUp() public {
        reporter = vm.addr(reporterKey);
        reports = new RiskReportRegistry();
        reports.setReporter(reporter, true);
        registry = new ProtocolRegistry();
        target = new SentinelFlowTarget();
        registry.setVerified(address(target), true, keccak256("verified-demo-target"));
        engine = new ExecutionEngineV2(
            address(registry),
            address(new SlippageGuard()),
            address(new MarketRegimeGateV2(address(reports))),
            address(new YieldDecayGate(address(reports)))
        );
        publish(bytes32(0), 0, 0, 9500, 1);
        publish(opportunity, 0, 0, 9500, 1);
    }

    function testReportToCheckAndExecuteThenPanicRevert() public {
        ExecutionEngineV2.ActionContext memory ctx = context("DEPOSIT");
        (bool allowed,) = engine.checkAction(ctx);
        assertTrue(allowed);
        engine.executeAction(ctx);
        assertEq(target.calls(), 1);

        publish(bytes32(0), 2, 0, 9500, 2);
        (allowed,) = engine.checkAction(ctx);
        assertFalse(allowed);
        vm.expectRevert("MarketGate: blocked by policy");
        engine.executeAction(ctx);

        ExecutionEngineV2.ActionContext memory unwind = context("WITHDRAW");
        (allowed,) = engine.checkAction(unwind);
        assertTrue(allowed);
    }

    function context(string memory actionType) internal view returns (ExecutionEngineV2.ActionContext memory) {
        return ExecutionEngineV2.ActionContext({
            target: address(target),
            data: abi.encodeCall(target.execute, ()),
            value: 0,
            actionType: actionType,
            opportunityId: opportunity,
            positionUsd: 100_000,
            requestedSlippageBps: 40
        });
    }

    function publish(bytes32 opp, uint8 marketRegime, uint8 yieldState, uint16 confidence, uint256 sequence) internal {
        bytes32 reportId = keccak256(abi.encode(opp, sequence));
        uint256 observedAt = block.timestamp;
        uint256 validUntil = block.timestamp + 1 hours;
        bytes32 hash = reports.getReportHash(reportId, opp, marketRegime, yieldState, confidence, observedAt, validUntil, sequence);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(reporterKey, MessageHashUtils.toEthSignedMessageHash(hash));
        reports.registerReport(reportId, opp, marketRegime, yieldState, confidence, observedAt, validUntil, sequence, abi.encodePacked(r, s, v));
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/ProtocolRegistry.sol";
import "../src/SlippageGuard.sol";
import "../src/RiskReportRegistry.sol";
import "../src/MarketRegimeGateV2.sol";
import "../src/YieldDecayGate.sol";
import "../src/ExecutionEngineV2.sol";

contract ExecutionEngineV2Test is Test {
    ProtocolRegistry public registry;
    SlippageGuard public guard;
    RiskReportRegistry public reportRegistry;
    MarketRegimeGateV2 public regimeGate;
    YieldDecayGate public yieldGate;
    ExecutionEngineV2 public engine;

    uint256 public reporterPrivateKey = 0xA11CE;
    address public reporter;
    address public agent = address(0x222);

    function setUp() public {
        reporter = vm.addr(reporterPrivateKey);

        registry = new ProtocolRegistry();
        guard = new SlippageGuard();
        reportRegistry = new RiskReportRegistry();
        reportRegistry.setReporter(reporter, true);

        regimeGate = new MarketRegimeGateV2(address(reportRegistry));
        yieldGate = new YieldDecayGate(address(reportRegistry));

        engine = new ExecutionEngineV2(
            address(registry),
            address(guard),
            address(regimeGate),
            address(yieldGate)
        );

        engine.setAuthorized(agent, true);
    }

    function _helperGetSignature(
        bytes32 reportId,
        bytes32 opportunityId,
        uint8 marketRegime,
        uint8 yieldState,
        uint16 confidenceBps,
        uint256 observedAt,
        uint256 validUntil,
        uint256 sequenceNumber,
        uint256 pkey
    ) internal view returns (bytes memory) {
        bytes32 hash = reportRegistry.getReportHash(
            reportId,
            opportunityId,
            marketRegime,
            yieldState,
            confidenceBps,
            observedAt,
            validUntil,
            sequenceNumber
        );
        bytes32 ethSignedHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(pkey, ethSignedHash);
        return abi.encodePacked(r, s, v);
    }

    function _registerReport(
        bytes32 opportunityId,
        uint8 regime,
        uint8 yieldState,
        uint16 confidence,
        uint256 sequence
    ) internal {
        bytes32 reportId = keccak256(abi.encodePacked("report", sequence));
        uint256 observedAt = block.timestamp;
        uint256 validUntil = block.timestamp + 300;

        bytes memory signature = _helperGetSignature(
            reportId,
            opportunityId,
            regime,
            yieldState,
            confidence,
            observedAt,
            validUntil,
            sequence,
            reporterPrivateKey
        );

        reportRegistry.registerReport(
            reportId,
            opportunityId,
            regime,
            yieldState,
            confidence,
            observedAt,
            validUntil,
            sequence,
            signature
        );
    }

    function testExecutionSuccess() public {
        // Normal + Healthy
        _registerReport(bytes32(0), 0, 0, 9500, 1); // global market
        bytes32 oppId = keccak256("pharos-vault");
        _registerReport(oppId, 0, 0, 9500, 1); // opportunity yield

        address mockTarget = address(0x555);
        registry.setVerified(mockTarget, true);

        ExecutionEngineV2.ActionContext memory ctx = ExecutionEngineV2.ActionContext({
            target: mockTarget,
            data: abi.encodeWithSignature("someFunction()"),
            value: 0,
            actionType: "DEPOSIT",
            opportunityId: oppId,
            positionUsd: 10000,
            requestedSlippageBps: 10
        });

        // Mock target call
        vm.mockCall(mockTarget, ctx.data, abi.encode(true));

        vm.prank(agent);
        engine.executeAction(ctx);
    }

    function testExceedsPositionLimitReverts() public {
        _registerReport(bytes32(0), 0, 0, 9500, 1);
        bytes32 oppId = keccak256("pharos-vault");
        _registerReport(oppId, 0, 0, 9500, 1);

        address mockTarget = address(0x555);
        registry.setVerified(mockTarget, true);

        ExecutionEngineV2.ActionContext memory ctx = ExecutionEngineV2.ActionContext({
            target: mockTarget,
            data: abi.encodeWithSignature("someFunction()"),
            value: 0,
            actionType: "DEPOSIT",
            opportunityId: oppId,
            positionUsd: 2_000_000, // exceeds Normal limit of $1M
            requestedSlippageBps: 10
        });

        vm.prank(agent);
        vm.expectRevert("ExecutionEngine: position size exceeds policy limit");
        engine.executeAction(ctx);
    }

    function testUnauthorizedAgentReverts() public {
        ExecutionEngineV2.ActionContext memory ctx = ExecutionEngineV2.ActionContext({
            target: address(0x555),
            data: "",
            value: 0,
            actionType: "DEPOSIT",
            opportunityId: bytes32(0),
            positionUsd: 10000,
            requestedSlippageBps: 10
        });

        vm.prank(address(0x999));
        vm.expectRevert("ExecutionEngine: not authorized");
        engine.executeAction(ctx);
    }
}

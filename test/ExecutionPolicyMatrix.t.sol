// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/ProtocolRegistry.sol";
import "../src/SlippageGuard.sol";
import "../src/RiskReportRegistry.sol";
import "../src/MarketRegimeGateV2.sol";
import "../src/YieldDecayGate.sol";
import "../src/ExecutionEngineV2.sol";

contract ExecutionPolicyMatrixTest is Test {
    ProtocolRegistry public registry;
    SlippageGuard public guard;
    RiskReportRegistry public reportRegistry;
    MarketRegimeGateV2 public regimeGate;
    YieldDecayGate public yieldGate;
    ExecutionEngineV2 public engine;

    uint256 public reporterPrivateKey = 0xA11CE;
    address public reporter;
    bytes32 public opportunityId = keccak256("vault-1");
    address public target = address(0x555);

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
    }

    function _helperGetSignature(
        bytes32 reportId,
        bytes32 oppId,
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
            oppId,
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
        bytes32 oppId,
        uint8 regime,
        uint8 yieldState,
        uint16 confidence,
        uint256 sequence
    ) internal {
        bytes32 reportId = keccak256(abi.encodePacked("report", sequence, oppId));
        uint256 observedAt = block.timestamp;
        uint256 validUntil = block.timestamp + 300;

        bytes memory signature = _helperGetSignature(
            reportId,
            oppId,
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
            oppId,
            regime,
            yieldState,
            confidence,
            observedAt,
            validUntil,
            sequence,
            signature
        );
    }

    function testNormalHealthyAllowsAll() public {
        _registerReport(bytes32(0), 0, 0, 9500, 1); // global NORMAL
        _registerReport(opportunityId, 0, 0, 9500, 1); // yield HEALTHY
        registry.setVerified(target, true);

        ExecutionEngineV2.ActionContext memory ctx = ExecutionEngineV2.ActionContext({
            target: target,
            data: "",
            value: 0,
            actionType: "DEPOSIT",
            opportunityId: opportunityId,
            positionUsd: 10000,
            requestedSlippageBps: 10
        });

        (bool allowed, string memory reason) = engine.checkAction(ctx);
        assertTrue(allowed, reason);
    }

    function testNormalWatchRestrictsDeposit() public {
        _registerReport(bytes32(0), 0, 0, 9500, 1); // global NORMAL
        _registerReport(opportunityId, 0, 1, 9500, 1); // yield WATCH
        registry.setVerified(target, true);

        // Under restricted limit ($250k)
        ExecutionEngineV2.ActionContext memory ctxOk = ExecutionEngineV2.ActionContext({
            target: target,
            data: "",
            value: 0,
            actionType: "DEPOSIT",
            opportunityId: opportunityId,
            positionUsd: 200000,
            requestedSlippageBps: 10
        });

        (bool allowed, string memory reason) = engine.checkAction(ctxOk);
        assertTrue(allowed, reason);

        // Exceeds restricted limit ($250k)
        ExecutionEngineV2.ActionContext memory ctxExceeds = ctxOk;
        ctxExceeds.positionUsd = 300000;

        (bool allowed2, string memory reason2) = engine.checkAction(ctxExceeds);
        assertFalse(allowed2);
        assertEq(reason2, "ExecutionEngine: position size exceeds policy limit");
    }

    function testDecayingYieldBlocksDepositAllowsWithdraw() public {
        _registerReport(bytes32(0), 0, 0, 9500, 1); // global NORMAL
        _registerReport(opportunityId, 0, 2, 9500, 1); // yield DECAYING
        registry.setVerified(target, true);

        ExecutionEngineV2.ActionContext memory ctxDeposit = ExecutionEngineV2.ActionContext({
            target: target,
            data: "",
            value: 0,
            actionType: "DEPOSIT",
            opportunityId: opportunityId,
            positionUsd: 10000,
            requestedSlippageBps: 10
        });

        (bool allowed, ) = engine.checkAction(ctxDeposit);
        assertFalse(allowed); // Blocked

        ExecutionEngineV2.ActionContext memory ctxWithdraw = ctxDeposit;
        ctxWithdraw.actionType = "WITHDRAW";

        (bool allowed2, ) = engine.checkAction(ctxWithdraw);
        assertTrue(allowed2); // Allowed
    }

    function testPanicBlocksDepositAllowsWithdrawUnwind() public {
        _registerReport(bytes32(0), 2, 0, 9500, 1); // global PANIC
        _registerReport(opportunityId, 0, 0, 9500, 1); // yield HEALTHY
        registry.setVerified(target, true);

        ExecutionEngineV2.ActionContext memory ctxDeposit = ExecutionEngineV2.ActionContext({
            target: target,
            data: "",
            value: 0,
            actionType: "DEPOSIT",
            opportunityId: opportunityId,
            positionUsd: 10000,
            requestedSlippageBps: 10
        });

        (bool allowed, ) = engine.checkAction(ctxDeposit);
        assertFalse(allowed); // Blocked

        ExecutionEngineV2.ActionContext memory ctxWithdraw = ctxDeposit;
        ctxWithdraw.actionType = "WITHDRAW";

        (bool allowed2, ) = engine.checkAction(ctxWithdraw);
        assertTrue(allowed2); // Allowed as unwind
    }

    function testBlacklistedBlocked() public {
        _registerReport(bytes32(0), 0, 0, 9500, 1);
        _registerReport(opportunityId, 0, 0, 9500, 1);
        
        registry.setBlacklisted(target, true);

        ExecutionEngineV2.ActionContext memory ctx = ExecutionEngineV2.ActionContext({
            target: target,
            data: "",
            value: 0,
            actionType: "DEPOSIT",
            opportunityId: opportunityId,
            positionUsd: 10000,
            requestedSlippageBps: 10
        });

        (bool allowed, string memory reason) = engine.checkAction(ctx);
        assertFalse(allowed);
        assertEq(reason, "Registry: Target address is blacklisted");
    }

    function testUnverifiedBlockedInVolatile() public {
        _registerReport(bytes32(0), 1, 0, 9500, 1); // Volatile
        _registerReport(opportunityId, 0, 0, 9500, 1);
        
        // target is NOT verified

        ExecutionEngineV2.ActionContext memory ctx = ExecutionEngineV2.ActionContext({
            target: target,
            data: "",
            value: 0,
            actionType: "DEPOSIT",
            opportunityId: opportunityId,
            positionUsd: 10000,
            requestedSlippageBps: 10
        });

        (bool allowed, string memory reason) = engine.checkAction(ctx);
        assertFalse(allowed);
        assertEq(reason, "MarketGate: blocked by policy");
    }
}

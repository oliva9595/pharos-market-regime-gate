// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/RiskReportRegistry.sol";
import "../src/YieldDecayGate.sol";

contract YieldDecayGateTest is Test {
    RiskReportRegistry public registry;
    YieldDecayGate public gate;
    uint256 public reporterPrivateKey = 0xA11CE;
    address public reporter;
    bytes32 public opportunityId = keccak256("pharos-vault-1");

    function setUp() public {
        reporter = vm.addr(reporterPrivateKey);
        registry = new RiskReportRegistry();
        registry.setReporter(reporter, true);
        gate = new YieldDecayGate(address(registry));
    }

    function _registerYieldReport(uint8 yieldState, uint16 confidence, uint256 sequence) internal {
        bytes32 reportId = keccak256(abi.encodePacked("report", sequence));
        uint256 observedAt = block.timestamp;
        uint256 validUntil = block.timestamp + 300;

        bytes32 hash = registry.getReportHash(
            reportId, opportunityId, 0, yieldState, confidence, observedAt, validUntil, sequence
        );
        bytes32 ethSignedHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(reporterPrivateKey, ethSignedHash);
        bytes memory sig = abi.encodePacked(r, s, v);

        registry.registerReport(
            reportId, opportunityId, 0, yieldState, confidence, observedAt, validUntil, sequence, sig
        );
    }

    function testHealthyYieldAllows() public {
        _registerYieldReport(0, 9000, 1); // HEALTHY
        (uint8 yieldState, bool isRestricted, bool isBlocked) = gate.checkYieldPolicy(
            opportunityId, "DEPOSIT", false
        );
        assertEq(yieldState, 0);
        assertFalse(isRestricted);
        assertFalse(isBlocked);
    }

    function testWatchYieldRestricts() public {
        _registerYieldReport(1, 9000, 1); // WATCH
        (uint8 yieldState, bool isRestricted, bool isBlocked) = gate.checkYieldPolicy(
            opportunityId, "DEPOSIT", false
        );
        assertEq(yieldState, 1);
        assertTrue(isRestricted);
        assertFalse(isBlocked);
    }

    function testDecayingYieldBlocksNewDepositAllowsUnwind() public {
        _registerYieldReport(2, 9000, 1); // DECAYING

        // Deposit is blocked
        (, , bool isBlocked) = gate.checkYieldPolicy(opportunityId, "DEPOSIT", false);
        assertTrue(isBlocked);

        // Unwind is allowed
        (, bool isRestricted, bool isBlockedUnwind) = gate.checkYieldPolicy(opportunityId, "WITHDRAW", true);
        assertFalse(isRestricted);
        assertFalse(isBlockedUnwind);
    }

    function testExitYieldBlocksEverythingExceptUnwind() public {
        _registerYieldReport(3, 9000, 1); // EXIT

        // Deposit is blocked
        (, , bool isBlocked) = gate.checkYieldPolicy(opportunityId, "DEPOSIT", false);
        assertTrue(isBlocked);

        // Unwind is allowed
        (, bool isRestricted, bool isBlockedUnwind) = gate.checkYieldPolicy(opportunityId, "WITHDRAW", true);
        assertFalse(isRestricted);
        assertFalse(isBlockedUnwind);
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/RiskReportRegistry.sol";
import "../src/MarketRegimeGateV2.sol";

contract MarketRegimeGateV2Test is Test {
    RiskReportRegistry public registry;
    MarketRegimeGateV2 public gate;
    uint256 public reporterPrivateKey = 0xA11CE;
    address public reporter;

    function setUp() public {
        reporter = vm.addr(reporterPrivateKey);
        registry = new RiskReportRegistry();
        registry.setReporter(reporter, true);
        gate = new MarketRegimeGateV2(address(registry));
    }

    function _registerMarketReport(uint8 regime, uint16 confidence, uint256 sequence) internal {
        bytes32 reportId = keccak256(abi.encodePacked("report", sequence));
        bytes32 opportunityId = bytes32(0); // global market
        uint256 observedAt = block.timestamp;
        uint256 validUntil = block.timestamp + 300;

        bytes32 hash = registry.getReportHash(
            reportId, opportunityId, regime, 0, confidence, observedAt, validUntil, sequence
        );
        bytes32 ethSignedHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(reporterPrivateKey, ethSignedHash);
        bytes memory sig = abi.encodePacked(r, s, v);

        registry.registerReport(
            reportId, opportunityId, regime, 0, confidence, observedAt, validUntil, sequence, sig
        );
    }

    function testNormalRegimeAllows() public {
        _registerMarketReport(0, 9000, 1); // NORMAL
        (uint8 regime, bool isRestricted, bool isBlocked) = gate.checkMarketPolicy(
            address(0x123), "DEPOSIT", true, false
        );
        assertEq(regime, 0);
        assertFalse(isRestricted);
        assertFalse(isBlocked);
    }

    function testVolatileRegimeRestrictsVerified() public {
        _registerMarketReport(1, 9000, 1); // VOLATILE
        (uint8 regime, bool isRestricted, bool isBlocked) = gate.checkMarketPolicy(
            address(0x123), "DEPOSIT", true, false // verified target
        );
        assertEq(regime, 1);
        assertTrue(isRestricted);
        assertFalse(isBlocked);
    }

    function testVolatileRegimeBlocksUnverified() public {
        _registerMarketReport(1, 9000, 1); // VOLATILE
        (uint8 regime, bool isRestricted, bool isBlocked) = gate.checkMarketPolicy(
            address(0x123), "DEPOSIT", false, false // unverified target
        );
        assertEq(regime, 1);
        assertFalse(isRestricted);
        assertTrue(isBlocked);
    }

    function testPanicRegimeBlocksEverythingExceptUnwind() public {
        _registerMarketReport(2, 9000, 1); // PANIC

        // Normal deposit is blocked
        (, , bool isBlocked) = gate.checkMarketPolicy(address(0x123), "DEPOSIT", true, false);
        assertTrue(isBlocked);

        // Unwind is allowed
        (, bool isRestricted, bool isBlockedUnwind) = gate.checkMarketPolicy(address(0x123), "WITHDRAW", true, true);
        assertFalse(isRestricted);
        assertFalse(isBlockedUnwind);
    }

    function testConfidenceCheckReverts() public {
        _registerMarketReport(0, 5000, 1); // low confidence (50%)
        vm.expectRevert("MarketGate: confidence too low");
        gate.checkMarketPolicy(address(0x123), "DEPOSIT", true, false);
    }
}

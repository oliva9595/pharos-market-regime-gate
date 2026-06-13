// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/RiskReportRegistry.sol";

contract SentinelInvariantTest is Test {
    RiskReportRegistry registry;
    address unauthorized = address(0xBAD);

    function setUp() public {
        registry = new RiskReportRegistry();
    }

    function invariant_unauthorizedAddressNeverBecomesReporter() public view {
        assertFalse(registry.isReporter(unauthorized));
    }

    function invariant_registryOwnerRemainsReporter() public view {
        assertTrue(registry.isReporter(address(this)));
    }

    function invariant_unknownReportSequenceRemainsZero() public view {
        assertEq(registry.latestSequenceNumbers(keccak256("unknown-opportunity")), 0);
    }
}

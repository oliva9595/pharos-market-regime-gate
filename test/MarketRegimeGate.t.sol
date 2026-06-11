// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/MarketRegimeGate.sol";
import "../src/ProtocolRegistry.sol";

contract MarketRegimeGateTest is Test {
    MarketRegimeGate public gate;
    ProtocolRegistry public registry;
    address public verifiedTarget = address(0x111);
    address public unverifiedTarget = address(0x222);

    function setUp() public {
        registry = new ProtocolRegistry();
        gate = new MarketRegimeGate(address(registry));
        registry.setVerified(verifiedTarget, true);
    }

    function testNormalRegime() public view {
        assertTrue(gate.verifyRegime(verifiedTarget, true));
        assertTrue(gate.verifyRegime(unverifiedTarget, false));
    }

    function testVolatileRegime() public {
        gate.setMarketRegime(1); // VOLATILE
        assertTrue(gate.verifyRegime(verifiedTarget, true));
        vm.expectRevert("MarketRegimeGate: volatile regime restricts to verified protocols");
        gate.verifyRegime(unverifiedTarget, false);
    }

    function testPanicRegime() public {
        gate.setMarketRegime(2); // PANIC
        vm.expectRevert("MarketRegimeGate: panic regime active, all executions halted");
        gate.verifyRegime(verifiedTarget, true);
        vm.expectRevert("MarketRegimeGate: panic regime active, all executions halted");
        gate.verifyRegime(unverifiedTarget, false);
    }
}

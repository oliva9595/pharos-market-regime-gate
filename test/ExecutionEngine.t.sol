// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/ExecutionEngine.sol";
import "../src/ProtocolRegistry.sol";
import "../src/SlippageGuard.sol";
import "../src/MarketRegimeGate.sol";

contract MockTarget {
    uint256 public value;
    function setValue(uint256 newVal) external {
        value = newVal;
    }
}

contract ExecutionEngineTest is Test {
    ExecutionEngine public engine;
    ProtocolRegistry public registry;
    SlippageGuard public guard;
    MarketRegimeGate public regimeGate;
    MockTarget public target;

    function setUp() public {
        registry = new ProtocolRegistry();
        guard = new SlippageGuard();
        regimeGate = new MarketRegimeGate(address(registry));
        engine = new ExecutionEngine(address(registry), address(guard), address(regimeGate));
        target = new MockTarget();
    }

    function testCheckTxOk() public {
        bytes memory txData = abi.encodeWithSignature("setValue(uint256)", 42);
        assertTrue(engine.checkTx(address(target), txData, 0));
    }

    function testCheckTxBlacklisted() public {
        registry.setBlacklisted(address(target), true);
        bytes memory txData = abi.encodeWithSignature("setValue(uint256)", 42);
        vm.expectRevert("Registry: Target address is blacklisted");
        engine.checkTx(address(target), txData, 0);
    }

    function testExecuteTxOk() public {
        bytes memory txData = abi.encodeWithSignature("setValue(uint256)", 100);
        engine.executeTx(address(target), txData, 0);
        assertEq(target.value(), 100);
    }

    function testBlockedByPanic() public {
        regimeGate.setMarketRegime(2); // PANIC
        bytes memory txData = abi.encodeWithSignature("setValue(uint256)", 100);
        vm.expectRevert("MarketRegimeGate: panic regime active, all executions halted");
        engine.executeTx(address(target), txData, 0);
    }
}

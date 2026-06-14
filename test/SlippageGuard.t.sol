// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/SlippageGuard.sol";

contract MockRouter {
    function getAmountsOut(uint256 amountIn, address[] calldata /* path */) external pure returns (uint[] memory amounts) {
        amounts = new uint[](2);
        amounts[0] = amountIn;
        amounts[1] = amountIn * 2;
        return amounts;
    }
}

contract SlippageGuardTest is Test {
    SlippageGuard public guard;
    MockRouter public router;
    address public tokenIn = address(0x10);
    address public tokenOut = address(0x20);

    function setUp() public {
        guard = new SlippageGuard();
        router = new MockRouter();
    }

    function testSlippageOk() public {
        address[] memory path = new address[](2);
        path[0] = tokenIn;
        path[1] = tokenOut;

        bytes memory txData = abi.encodeWithSignature(
            "swapExactTokensForTokens(uint256,uint256,address[],address,uint256)",
            100,
            195,
            path,
            address(this),
            block.timestamp + 60
        );

        assertTrue(guard.verifySlippage(address(router), txData, 500));
    }

    function testSlippageTooHigh() public {
        address[] memory path = new address[](2);
        path[0] = tokenIn;
        path[1] = tokenOut;

        bytes memory txData = abi.encodeWithSignature(
            "swapExactTokensForTokens(uint256,uint256,address[],address,uint256)",
            100,
            180,
            path,
            address(this),
            block.timestamp + 60
        );

        vm.expectRevert("SlippageGuard: slippage too high");
        guard.verifySlippage(address(router), txData, 500);
    }

    function testMalformedCalldataReverts() public {
        bytes memory badData = hex"38ed173900000000"; // only 8 bytes, selector + 4 bytes
        vm.expectRevert("SlippageGuard: malformed swap calldata");
        guard.verifySlippage(address(router), badData, 500);
    }

    function testZeroAmountOutMinReverts() public {
        address[] memory path = new address[](2);
        path[0] = tokenIn;
        path[1] = tokenOut;

        bytes memory txData = abi.encodeWithSignature(
            "swapExactTokensForTokens(uint256,uint256,address[],address,uint256)",
            100,
            0, // zero minimum amount
            path,
            address(this),
            block.timestamp + 60
        );

        vm.expectRevert("SlippageGuard: amountOutMin is zero");
        guard.verifySlippage(address(router), txData, 500);
    }

    function testSwapExactETHForTokens() public {
        address[] memory path = new address[](2);
        path[0] = tokenIn;
        path[1] = tokenOut;

        bytes memory txData = abi.encodeWithSignature(
            "swapExactETHForTokens(uint256,address[],address,uint256)",
            195,
            path,
            address(this),
            block.timestamp + 60
        );

        // This will revert if there is an ABI decoding mismatch in SlippageGuard
        assertTrue(guard.verifySlippage(address(router), txData, 500));
    }
}

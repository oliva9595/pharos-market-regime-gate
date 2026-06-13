// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IUniswapV2Router {
    function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts);
}

contract SlippageGuard {
    bytes4 constant SWAP_EXACT_TOKENS_FOR_TOKENS = 0x38ed1739;
    bytes4 constant SWAP_EXACT_ETH_FOR_TOKENS = 0x7ff36ab5;
    bytes4 constant SWAP_EXACT_TOKENS_FOR_ETH = 0x18cbafe5;

    function verifySlippage(
        address target,
        bytes calldata data,
        uint256 maxSlippageBps
    ) external view returns (bool) {
        if (data.length < 4) return true;
        bytes4 selector = bytes4(data[:4]);

        if (selector == SWAP_EXACT_TOKENS_FOR_TOKENS) {
            require(data.length >= 4 + 32 * 5, "SlippageGuard: malformed swap calldata");
            (uint256 amountIn, uint256 amountOutMin, address[] memory path, , ) = abi.decode(
                data[4:],
                (uint256, uint256, address[], address, uint256)
            );
            
            require(amountIn > 0, "SlippageGuard: amountIn is zero");
            require(amountOutMin > 0, "SlippageGuard: amountOutMin is zero");
            require(path.length >= 2, "SlippageGuard: invalid route path");

            try IUniswapV2Router(target).getAmountsOut(amountIn, path) returns (uint[] memory amounts) {
                uint256 expectedOut = amounts[amounts.length - 1];
                uint256 minAllowed = (expectedOut * (10000 - maxSlippageBps)) / 10000;
                require(amountOutMin >= minAllowed, "SlippageGuard: slippage too high");
            } catch {
                revert("SlippageGuard: amounts out fetch failed");
            }
        } else if (selector == SWAP_EXACT_ETH_FOR_TOKENS) {
            require(data.length >= 4 + 32 * 5, "SlippageGuard: malformed swap calldata");
            (, uint256 amountOutMin, address[] memory path, , ) = abi.decode(
                data[4:],
                (uint256, uint256, address[], address, uint256)
            );
            require(amountOutMin > 0, "SlippageGuard: amountOutMin is zero");
            require(path.length >= 2, "SlippageGuard: invalid route path");
        } else if (selector == SWAP_EXACT_TOKENS_FOR_ETH) {
            require(data.length >= 4 + 32 * 5, "SlippageGuard: malformed swap calldata");
            (uint256 amountIn, uint256 amountOutMin, address[] memory path, , ) = abi.decode(
                data[4:],
                (uint256, uint256, address[], address, uint256)
            );
            
            require(amountIn > 0, "SlippageGuard: amountIn is zero");
            require(amountOutMin > 0, "SlippageGuard: amountOutMin is zero");
            require(path.length >= 2, "SlippageGuard: invalid route path");

            try IUniswapV2Router(target).getAmountsOut(amountIn, path) returns (uint[] memory amounts) {
                uint256 expectedOut = amounts[amounts.length - 1];
                uint256 minAllowed = (expectedOut * (10000 - maxSlippageBps)) / 10000;
                require(amountOutMin >= minAllowed, "SlippageGuard: slippage too high");
            } catch {
                revert("SlippageGuard: amounts out fetch failed");
            }
        }
        
        return true;
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./ProtocolRegistry.sol";
import "./SlippageGuard.sol";
import "./MarketRegimeGateV2.sol";
import "./YieldDecayGate.sol";

contract ExecutionEngineV2 is Ownable {
    struct ActionContext {
        address target;
        bytes data;
        uint256 value;
        string actionType;
        bytes32 opportunityId;
        uint256 positionUsd;
        uint256 requestedSlippageBps;
    }

    ProtocolRegistry public registry;
    SlippageGuard public slippageGuard;
    MarketRegimeGateV2 public regimeGate;
    YieldDecayGate public yieldGate;

    uint256 public constant NORMAL_MAX_POSITION_USD = 1_000_000; // $1M
    uint256 public constant NORMAL_MAX_SLIPPAGE_BPS = 100; // 1%
    uint256 public constant RESTRICTED_MAX_POSITION_USD = 250_000; // $250k
    uint256 public constant RESTRICTED_MAX_SLIPPAGE_BPS = 50; // 0.5%

    mapping(address => bool) public authorized;

    event AuthorizedUpdated(address indexed agent, bool status);
    event ExecutionSuccess(address indexed target, uint256 value, string actionType, bytes32 opportunityId);

    modifier onlyAuthorized() {
        require(msg.sender == owner() || authorized[msg.sender], "ExecutionEngine: not authorized");
        _;
    }

    constructor(
        address _registry,
        address _slippageGuard,
        address _regimeGate,
        address _yieldGate
    ) Ownable(msg.sender) {
        registry = ProtocolRegistry(_registry);
        slippageGuard = SlippageGuard(_slippageGuard);
        regimeGate = MarketRegimeGateV2(_regimeGate);
        yieldGate = YieldDecayGate(_yieldGate);
    }

    function setAuthorized(address agent, bool status) external onlyOwner {
        authorized[agent] = status;
        emit AuthorizedUpdated(agent, status);
    }

    function isUnwind(string memory actionType) public pure returns (bool) {
        bytes32 actionHash = keccak256(bytes(actionType));
        return (actionHash == keccak256("WITHDRAW") || actionHash == keccak256("REPAY"));
    }

    // Evaluate policy and return final limits
    function evaluatePolicy(
        ActionContext calldata ctx
    ) public view returns (bool allowed, string memory reason, uint256 maxPosUsd, uint256 maxSlipBps) {
        // 1. Check security registry
        try registry.checkAddress(ctx.target) returns (bool isVerified) {
            // Target is verified or unverified but not blacklisted.
            bool unwind = isUnwind(ctx.actionType);

            // 2. Check market regime gate
            try regimeGate.checkMarketPolicy(ctx.target, ctx.actionType, isVerified, unwind) returns (
                uint8 /* regime */,
                bool marketRestricted,
                bool marketBlocked
            ) {
                if (marketBlocked) {
                    return (false, "MarketGate: blocked by policy", 0, 0);
                }

                // 3. Check yield decay gate
                try yieldGate.checkYieldPolicy(ctx.opportunityId, ctx.actionType, unwind) returns (
                    uint8 /* yieldState */,
                    bool yieldRestricted,
                    bool yieldBlocked
                ) {
                    if (yieldBlocked) {
                        return (false, "YieldGate: blocked by policy", 0, 0);
                    }

                    // Combined limits
                    bool isRestricted = marketRestricted || yieldRestricted;
                    maxPosUsd = isRestricted ? RESTRICTED_MAX_POSITION_USD : NORMAL_MAX_POSITION_USD;
                    maxSlipBps = isRestricted ? RESTRICTED_MAX_SLIPPAGE_BPS : NORMAL_MAX_SLIPPAGE_BPS;

                    // 4. Verify position size
                    if (ctx.positionUsd > maxPosUsd) {
                        return (false, "ExecutionEngine: position size exceeds policy limit", maxPosUsd, maxSlipBps);
                    }

                    // 5. Verify slippage guard
                    if (ctx.requestedSlippageBps > maxSlipBps) {
                        return (false, "ExecutionEngine: requested slippage exceeds policy limit", maxPosUsd, maxSlipBps);
                    }

                    return (true, "", maxPosUsd, maxSlipBps);
                } catch Error(string memory gateReason) {
                    return (false, gateReason, 0, 0);
                } catch {
                    return (false, "YieldGate check failed", 0, 0);
                }
            } catch Error(string memory gateReason) {
                return (false, gateReason, 0, 0);
            } catch {
                return (false, "MarketGate check failed", 0, 0);
            }
        } catch Error(string memory regReason) {
            return (false, regReason, 0, 0);
        } catch {
            return (false, "Registry check failed", 0, 0);
        }
    }

    function checkAction(
        ActionContext calldata ctx
    ) external view returns (bool allowed, string memory reason) {
        (allowed, reason, , ) = evaluatePolicy(ctx);
    }

    function executeAction(
        ActionContext calldata ctx
    ) external payable onlyAuthorized returns (bytes memory) {
        (bool allowed, string memory reason, , uint256 maxSlipBps) = evaluatePolicy(ctx);
        require(allowed, reason);

        // Run actual slippage guard check on-chain
        try slippageGuard.verifySlippage(ctx.target, ctx.data, ctx.value, maxSlipBps) returns (bool ok) {
            require(ok, "ExecutionEngine: slippage verification failed");
        } catch {
            // If slippage check reverts internally, require non-zero limits
            require(ctx.requestedSlippageBps > 0, "ExecutionEngine: invalid slippage check");
        }

        // Call target contract
        (bool success, bytes memory result) = ctx.target.call{value: ctx.value}(ctx.data);
        
        if (success) {
            emit ExecutionSuccess(ctx.target, ctx.value, ctx.actionType, ctx.opportunityId);
            return result;
        } else {
            if (result.length > 0) {
                assembly {
                    let resultData := add(result, 0x20)
                    let resultSize := mload(result)
                    revert(resultData, resultSize)
                }
            } else {
                revert("ExecutionEngine: transaction failed without reason");
            }
        }
    }
}

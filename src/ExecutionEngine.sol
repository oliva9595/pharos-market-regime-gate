// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./ProtocolRegistry.sol";
import "./SlippageGuard.sol";
import "./MarketRegimeGate.sol";

contract ExecutionEngine is Ownable {
    ProtocolRegistry public registry;
    SlippageGuard public slippageGuard;
    MarketRegimeGate public regimeGate;
    uint256 public defaultMaxSlippageBps = 100; // 1% default

    mapping(address => bool) public authorized;

    event AuthorizedUpdated(address indexed agent, bool status);

    modifier onlyAuthorized() {
        require(msg.sender == owner() || authorized[msg.sender], "ExecutionEngine: not authorized");
        _;
    }

    function setAuthorized(address agent, bool status) external onlyOwner {
        authorized[agent] = status;
        emit AuthorizedUpdated(agent, status);
    }

    event ExecutionSuccess(address indexed target, uint256 value, bytes data);
    event ExecutionFailure(address indexed target, uint256 value, bytes data, string reason);

    constructor(address _registry, address _slippageGuard, address _regimeGate) Ownable(msg.sender) {
        registry = ProtocolRegistry(_registry);
        slippageGuard = SlippageGuard(_slippageGuard);
        regimeGate = MarketRegimeGate(_regimeGate);
    }

    function setRegistry(address _registry) external onlyOwner {
        registry = ProtocolRegistry(_registry);
    }

    function setSlippageGuard(address _slippageGuard) external onlyOwner {
        slippageGuard = SlippageGuard(_slippageGuard);
    }

    function setRegimeGate(address _regimeGate) external onlyOwner {
        regimeGate = MarketRegimeGate(_regimeGate);
    }

    function setDefaultMaxSlippageBps(uint256 _bps) external onlyOwner {
        defaultMaxSlippageBps = _bps;
    }

    function checkTx(
        address target,
        bytes calldata data,
        uint256 /* value */
    ) external view returns (bool) {
        bool isVerified = registry.checkAddress(target);
        slippageGuard.verifySlippage(target, data, defaultMaxSlippageBps);
        regimeGate.verifyRegime(target, isVerified);
        return true;
    }

    function executeTx(
        address target,
        bytes calldata data,
        uint256 value
    ) external payable onlyAuthorized returns (bytes memory) {
        bool isVerified = registry.checkAddress(target);
        slippageGuard.verifySlippage(target, data, defaultMaxSlippageBps);
        regimeGate.verifyRegime(target, isVerified);

        (bool success, bytes memory result) = target.call{value: value}(data);
        
        if (success) {
            emit ExecutionSuccess(target, value, data);
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

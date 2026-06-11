// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./ProtocolRegistry.sol";

contract MarketRegimeGate is Ownable {
    enum Regime { NORMAL, VOLATILE, PANIC }

    Regime public currentRegime = Regime.NORMAL;
    ProtocolRegistry public registry;

    event RegimeUpdated(Regime indexed newRegime);
    event RegistryUpdated(address indexed newRegistry);

    constructor(address _registry) Ownable(msg.sender) {
        registry = ProtocolRegistry(_registry);
    }

    function setMarketRegime(uint8 _regime) external onlyOwner {
        require(_regime <= 2, "MarketRegimeGate: invalid regime index");
        currentRegime = Regime(_regime);
        emit RegimeUpdated(Regime(_regime));
    }

    function setRegistry(address _registry) external onlyOwner {
        registry = ProtocolRegistry(_registry);
        emit RegistryUpdated(_registry);
    }

    function verifyRegime(
        address /* target */, 
        bool isVerified
    ) external view returns (bool) {
        if (currentRegime == Regime.PANIC) {
            revert("MarketRegimeGate: panic regime active, all executions halted");
        }
        
        if (currentRegime == Regime.VOLATILE) {
            require(isVerified, "MarketRegimeGate: volatile regime restricts to verified protocols");
        }

        return true;
    }
}

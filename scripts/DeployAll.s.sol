// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/ProtocolRegistry.sol";
import "../src/SlippageGuard.sol";
import "../src/MarketRegimeGate.sol";
import "../src/ExecutionEngine.sol";

contract DeployAll is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PHAROS_DEPLOYER_PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);

        ProtocolRegistry registry = ProtocolRegistry(0xbe713906E4D5ac544C069Cd16B2233C979b8AB5a);
        SlippageGuard guard = new SlippageGuard();
        MarketRegimeGate regimeGate = new MarketRegimeGate(address(registry));
        ExecutionEngine engine = new ExecutionEngine(address(registry), address(guard), address(regimeGate));

        console.log("Reusing ProtocolRegistry at:", address(registry));
        console.log("Deployed SlippageGuard at:", address(guard));
        console.log("Deployed MarketRegimeGate at:", address(regimeGate));
        console.log("Deployed ExecutionEngine at:", address(engine));

        vm.stopBroadcast();
    }
}

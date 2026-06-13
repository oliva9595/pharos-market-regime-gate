// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./RiskReportRegistry.sol";

contract YieldDecayGate is Ownable {
    enum YieldState { HEALTHY, WATCH, DECAYING, EXIT }

    RiskReportRegistry public reportRegistry;
    uint16 public minConfidenceBps = 6000;

    event RegistryUpdated(address indexed newRegistry);
    event MinConfidenceUpdated(uint16 newMinConfidence);

    constructor(address _reportRegistry) Ownable(msg.sender) {
        reportRegistry = RiskReportRegistry(_reportRegistry);
    }

    function setRegistry(address _reportRegistry) external onlyOwner {
        reportRegistry = RiskReportRegistry(_reportRegistry);
        emit RegistryUpdated(_reportRegistry);
    }

    function setMinConfidence(uint16 _minConfidence) external onlyOwner {
        require(_minConfidence <= 10000, "Gate: invalid confidence bps");
        minConfidenceBps = _minConfidence;
        emit MinConfidenceUpdated(_minConfidence);
    }

    // Verify yield decay and return if it is restricted or blocked
    function checkYieldPolicy(
        bytes32 opportunityId,
        string calldata /* actionType */,
        bool isUnwind
    ) external view returns (uint8 yieldState, bool isRestricted, bool isBlocked) {
        // If opportunityId is zero, it's not a yield-specific action
        if (opportunityId == bytes32(0)) {
            return (uint8(YieldState.HEALTHY), false, false);
        }

        // Load latest report
        RiskReportRegistry.RiskReport memory report = reportRegistry.getLatestReport(opportunityId);

        // Validation
        require(report.validUntil > block.timestamp, "YieldGate: report is stale");
        require(report.confidenceBps >= minConfidenceBps, "YieldGate: confidence too low");

        yieldState = report.yieldState;

        if (yieldState == uint8(YieldState.EXIT)) {
            // Exit: allow only unwind
            if (isUnwind) {
                return (yieldState, false, false);
            }
            return (yieldState, false, true); // Blocked
        }

        if (yieldState == uint8(YieldState.DECAYING)) {
            // Decaying: block deposits/borrows/etc., allow unwind
            if (isUnwind) {
                return (yieldState, false, false);
            }
            return (yieldState, false, true); // Blocked
        }

        if (yieldState == uint8(YieldState.WATCH)) {
            // Watch: restricts allocations
            if (isUnwind) {
                return (yieldState, false, false);
            }
            return (yieldState, true, false); // Restricted
        }

        // Healthy: allowed
        return (yieldState, false, false);
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./RiskReportRegistry.sol";

contract MarketRegimeGateV2 is Ownable {
    enum Regime { NORMAL, VOLATILE, PANIC }

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

    // Verify regime and return if it is restricted or blocked
    function checkMarketPolicy(
        address /* target */,
        string calldata /* actionType */,
        bool isVerified,
        bool isUnwind
    ) external view returns (uint8 regime, bool isRestricted, bool isBlocked) {
        // Load latest global market report (opportunityId = bytes32(0))
        RiskReportRegistry.RiskReport memory report = reportRegistry.getLatestReport(bytes32(0));

        // Validation
        require(report.validUntil > block.timestamp, "MarketGate: report is stale");
        require(report.confidenceBps >= minConfidenceBps, "MarketGate: confidence too low");

        regime = report.marketRegime;

        if (regime == uint8(Regime.PANIC)) {
            // Panic: block everything except unwind
            if (isUnwind) {
                return (regime, false, false);
            }
            return (regime, false, true); // Blocked
        }

        if (regime == uint8(Regime.VOLATILE)) {
            // Volatile: requires target to be verified
            if (!isVerified) {
                return (regime, false, true); // Blocked
            }
            // If verified, restricts risk-increasing actions
            if (isUnwind) {
                return (regime, false, false); // fully allowed
            }
            return (regime, true, false); // Restricted
        }

        // Normal: allowed
        return (regime, false, false);
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

contract RiskReportRegistry is Ownable {
    using ECDSA for bytes32;

    struct RiskReport {
        bytes32 reportId;
        bytes32 opportunityId;
        uint8 marketRegime;
        uint8 yieldState;
        uint16 confidenceBps;
        uint256 observedAt;
        uint256 validUntil;
        uint256 sequenceNumber;
    }

    mapping(address => bool) public isReporter;
    mapping(bytes32 => bool) public isReportRegistered;
    
    // Store latest report per opportunityId (use opportunityId = bytes32(0) for global market report)
    mapping(bytes32 => RiskReport) public latestReports;
    // Track sequence numbers per opportunityId to prevent replay/out-of-order
    mapping(bytes32 => uint256) public latestSequenceNumbers;

    bool public paused = false;

    event ReporterStatusUpdated(address indexed reporter, bool status);
    event RiskReportRegistered(
        bytes32 indexed opportunityId,
        bytes32 indexed reportId,
        uint8 marketRegime,
        uint8 yieldState,
        uint256 sequenceNumber,
        uint256 validUntil
    );
    event RegistryPaused(bool status);

    modifier whenNotPaused() {
        require(!paused, "Registry: paused");
        _;
    }

    constructor() Ownable(msg.sender) {
        isReporter[msg.sender] = true;
        emit ReporterStatusUpdated(msg.sender, true);
    }

    function setReporter(address reporter, bool status) external onlyOwner {
        isReporter[reporter] = status;
        emit ReporterStatusUpdated(reporter, status);
    }

    function setPaused(bool _paused) external onlyOwner {
        paused = _paused;
        emit RegistryPaused(_paused);
    }

    // Hash a report in the same way as off-chain
    function getReportHash(
        bytes32 reportId,
        bytes32 opportunityId,
        uint8 marketRegime,
        uint8 yieldState,
        uint16 confidenceBps,
        uint256 observedAt,
        uint256 validUntil,
        uint256 sequenceNumber
    ) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(
            reportId,
            opportunityId,
            marketRegime,
            yieldState,
            confidenceBps,
            observedAt,
            validUntil,
            sequenceNumber
        ));
    }

    // Submit report with keeper signature
    // The signature must be from an authorized reporter
    function registerReport(
        bytes32 reportId,
        bytes32 opportunityId,
        uint8 marketRegime,
        uint8 yieldState,
        uint16 confidenceBps,
        uint256 observedAt,
        uint256 validUntil,
        uint256 sequenceNumber,
        bytes calldata signature
    ) external whenNotPaused {
        require(validUntil > block.timestamp, "Registry: report expired");
        require(observedAt <= block.timestamp, "Registry: observedAt in future");
        require(sequenceNumber > latestSequenceNumbers[opportunityId], "Registry: stale sequence number");
        require(marketRegime <= 2, "Registry: invalid market regime");
        require(yieldState <= 3, "Registry: invalid yield state");
        require(confidenceBps <= 10000, "Registry: invalid confidence bps");

        bytes32 reportHash = getReportHash(
            reportId,
            opportunityId,
            marketRegime,
            yieldState,
            confidenceBps,
            observedAt,
            validUntil,
            sequenceNumber
        );

        require(!isReportRegistered[reportHash], "Registry: report already registered");

        // Verify signature
        bytes32 ethSignedHash = MessageHashUtils.toEthSignedMessageHash(reportHash);
        address signer = ethSignedHash.recover(signature);
        require(isReporter[signer], "Registry: invalid signature from non-reporter");

        // Save
        RiskReport memory report = RiskReport({
            reportId: reportId,
            opportunityId: opportunityId,
            marketRegime: marketRegime,
            yieldState: yieldState,
            confidenceBps: confidenceBps,
            observedAt: observedAt,
            validUntil: validUntil,
            sequenceNumber: sequenceNumber
        });

        latestReports[opportunityId] = report;
        latestSequenceNumbers[opportunityId] = sequenceNumber;
        isReportRegistered[reportHash] = true;

        emit RiskReportRegistered(
            opportunityId,
            reportId,
            marketRegime,
            yieldState,
            sequenceNumber,
            validUntil
        );
    }

    // Get report
    function getLatestReport(bytes32 opportunityId) external view returns (RiskReport memory) {
        RiskReport memory report = latestReports[opportunityId];
        require(report.validUntil > block.timestamp, "Registry: report is stale or missing");
        return report;
    }
}

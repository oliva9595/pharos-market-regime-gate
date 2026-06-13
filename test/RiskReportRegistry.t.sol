// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/RiskReportRegistry.sol";

contract RiskReportRegistryTest is Test {
    RiskReportRegistry public registry;
    uint256 public reporterPrivateKey = 0xA11CE;
    address public reporter;

    function setUp() public {
        reporter = vm.addr(reporterPrivateKey);
        registry = new RiskReportRegistry();
        registry.setReporter(reporter, true);
    }

    function _helperGetSignature(
        bytes32 reportId,
        bytes32 opportunityId,
        uint8 marketRegime,
        uint8 yieldState,
        uint16 confidenceBps,
        uint256 observedAt,
        uint256 validUntil,
        uint256 sequenceNumber,
        uint256 pkey
    ) internal view returns (bytes memory) {
        bytes32 hash = registry.getReportHash(
            reportId,
            opportunityId,
            marketRegime,
            yieldState,
            confidenceBps,
            observedAt,
            validUntil,
            sequenceNumber
        );
        bytes32 ethSignedHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(pkey, ethSignedHash);
        return abi.encodePacked(r, s, v);
    }

    function testRegisterReportSuccess() public {
        bytes32 reportId = keccak256("report1");
        bytes32 opportunityId = keccak256("opp1");
        uint8 marketRegime = 0; // NORMAL
        uint8 yieldState = 0; // HEALTHY
        uint16 confidenceBps = 9500;
        uint256 observedAt = block.timestamp;
        uint256 validUntil = block.timestamp + 300;
        uint256 sequenceNumber = 1;

        bytes memory signature = _helperGetSignature(
            reportId,
            opportunityId,
            marketRegime,
            yieldState,
            confidenceBps,
            observedAt,
            validUntil,
            sequenceNumber,
            reporterPrivateKey
        );

        vm.expectEmit(true, true, false, true);
        emit RiskReportRegistry.RiskReportRegistered(opportunityId, reportId, marketRegime, yieldState, sequenceNumber, validUntil);

        registry.registerReport(
            reportId,
            opportunityId,
            marketRegime,
            yieldState,
            confidenceBps,
            observedAt,
            validUntil,
            sequenceNumber,
            signature
        );

        RiskReportRegistry.RiskReport memory report = registry.getLatestReport(opportunityId);
        assertEq(report.reportId, reportId);
        assertEq(report.marketRegime, marketRegime);
        assertEq(report.yieldState, yieldState);
    }

    function testRegisterReportExpiredReverts() public {
        bytes32 reportId = keccak256("report1");
        bytes32 opportunityId = keccak256("opp1");
        uint256 validUntil = block.timestamp - 1; // expired
        bytes memory sig = "";

        vm.expectRevert("Registry: report expired");
        registry.registerReport(reportId, opportunityId, 0, 0, 9000, block.timestamp, validUntil, 1, sig);
    }

    function testRegisterReportStaleSequenceReverts() public {
        bytes32 reportId1 = keccak256("report1");
        bytes32 opportunityId = keccak256("opp1");
        uint256 validUntil = block.timestamp + 300;

        // Register sequence 2
        bytes memory signature2 = _helperGetSignature(
            reportId1, opportunityId, 0, 0, 9000, block.timestamp, validUntil, 2, reporterPrivateKey
        );
        registry.registerReport(reportId1, opportunityId, 0, 0, 9000, block.timestamp, validUntil, 2, signature2);

        // Try to register sequence 1 (should fail)
        bytes32 reportId2 = keccak256("report2");
        bytes memory signature1 = _helperGetSignature(
            reportId2, opportunityId, 0, 0, 9000, block.timestamp, validUntil, 1, reporterPrivateKey
        );
        vm.expectRevert("Registry: stale sequence number");
        registry.registerReport(reportId2, opportunityId, 0, 0, 9000, block.timestamp, validUntil, 1, signature1);
    }

    function testUnauthorizedReporterFails() public {
        uint256 randomKey = 0xBAD;

        bytes32 reportId = keccak256("report1");
        bytes32 opportunityId = keccak256("opp1");
        uint256 validUntil = block.timestamp + 300;

        bytes memory signature = _helperGetSignature(
            reportId, opportunityId, 0, 0, 9500, block.timestamp, validUntil, 1, randomKey
        );

        vm.expectRevert("Registry: invalid signature from non-reporter");
        registry.registerReport(
            reportId, opportunityId, 0, 0, 9500, block.timestamp, validUntil, 1, signature
        );
    }

    function testPausedBlocksRegistration() public {
        bytes32 reportId = keccak256("report1");
        bytes32 opportunityId = keccak256("opp1");
        uint256 validUntil = block.timestamp + 300;

        bytes memory signature = _helperGetSignature(
            reportId, opportunityId, 0, 0, 9500, block.timestamp, validUntil, 1, reporterPrivateKey
        );

        registry.setPaused(true);

        vm.expectRevert("Registry: paused");
        registry.registerReport(
            reportId, opportunityId, 0, 0, 9500, block.timestamp, validUntil, 1, signature
        );
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract ProtocolRegistry is Ownable {
    mapping(address => bool) public isVerified;
    mapping(address => bool) public isBlacklisted;
    mapping(address => bytes32) public targetMetadataHash;

    event AddressVerified(address indexed addr, bool status, bytes32 metadataHash);
    event AddressBlacklisted(address indexed addr, bool status);

    constructor() Ownable(msg.sender) {}

    function setVerified(address addr, bool status, bytes32 metadataHash) external onlyOwner {
        require(addr != address(0), "Registry: target is zero address");
        if (status) {
            require(!isBlacklisted[addr], "Registry: target is blacklisted");
        }
        isVerified[addr] = status;
        targetMetadataHash[addr] = metadataHash;
        emit AddressVerified(addr, status, metadataHash);
    }

    function setVerified(address addr, bool status) external onlyOwner {
        require(addr != address(0), "Registry: target is zero address");
        if (status) {
            require(!isBlacklisted[addr], "Registry: target is blacklisted");
        }
        isVerified[addr] = status;
        emit AddressVerified(addr, status, bytes32(0));
    }

    function setBlacklisted(address addr, bool status) external onlyOwner {
        require(addr != address(0), "Registry: target is zero address");
        isBlacklisted[addr] = status;
        if (status) {
            isVerified[addr] = false;
        }
        emit AddressBlacklisted(addr, status);
    }

    function checkAddress(address addr) external view returns (bool) {
        require(addr != address(0), "Registry: target is zero address");
        require(!isBlacklisted[addr], "Registry: Target address is blacklisted");
        return isVerified[addr];
    }
}

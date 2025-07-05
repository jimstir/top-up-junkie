// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IAddService {
    function addToService(uint256 serviceId, address user) external;
    function getServiceInfo(uint256 serviceId) external view returns (
        uint256 cost, 
        uint256 interval, 
        bool isActive, 
        uint256 totalSubscribers
    );
}

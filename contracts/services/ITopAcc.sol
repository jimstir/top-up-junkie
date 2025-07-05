// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ITopAcc {
    function joinService(uint256 serviceId) external;
    function getBalance(address user) external view returns (uint256);
    function processRecurringPayment(address user, uint256 serviceId) external;
}

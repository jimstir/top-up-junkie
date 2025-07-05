// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./ITopAcc.sol";

contract AddService is Ownable {
    using SafeERC20 for IERC20;
    
    // USDC address on Sepolia (0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238)
    address public constant USDC_SEPOLIA = 0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238;
    
    // TopAcc contract address
    address public topAccAddress;

    // Service structure
    struct Service {
        uint256 cost;
        uint256 interval;
        bool isActive;
        uint256 totalSubscribers;
    }

    // State variables
    uint256 private _serviceId;
    mapping(address => mapping(uint256 => uint256)) private _userBalances;
    mapping(uint256 => Service) private _services;
    mapping(address => mapping(uint256 => bool)) private _hasJoinedService;

    // Events
    event ServiceRegistered(uint256 indexed serviceId, uint256 cost, uint256 interval);
    event BalanceDeposited(address indexed user, uint256 indexed serviceId, uint256 amount);
    event BalanceDeducted(address indexed user, uint256 indexed serviceId, uint256 amount);
    event ServiceJoined(address indexed user, uint256 indexed serviceId);
    event ServiceStatusToggled(uint256 indexed serviceId, bool isActive);
    event TopAccAddressUpdated(address indexed newTopAccAddress);

    constructor() Ownable() {
        _serviceId = 0;
    }


    function registerService(
        uint256 cost,
        uint256 interval
    ) public virtual onlyOwner returns (uint256) {
        require(cost > 0, "Cost must be greater than 0");
        require(interval > 0, "Interval must be greater than 0");

        _serviceId++;

        _services[_serviceId] = Service({
            cost: cost,
            interval: interval,
            isActive: true,
            totalSubscribers: 0
        });

        emit ServiceRegistered(_serviceId, cost, interval);
        return _serviceId;
    }



    function deductBalance(address user, uint256 serviceId, uint256 amount) public virtual onlyOwner returns (bool) {
        require(serviceId <= _serviceId && serviceId > 0, "Invalid service ID");
        require(_services[serviceId].isActive, "Service is not active");
        require(_userBalances[user][serviceId] >= amount, "Insufficient balance");
        // Request more topUp?
        _userBalances[user][serviceId] -= amount;
        
        emit BalanceDeducted(user, serviceId, amount);
        return true;
    }

    // Join a service using TopAcc balance
    function addToService(uint256 serviceId, address user) public virtual {
        require(serviceId <= _serviceId && serviceId > 0, "Invalid service ID");
        require(_services[serviceId].isActive, "Service is not active");
        
        uint256 cost = _services[serviceId].cost;
        
        // Transfer USDC from TopAcc to this contract
        IERC20 token = IERC20(USDC_SEPOLIA);
        token.safeTransferFrom(msg.sender, address(this), cost);
        
        _userBalances[user][serviceId] += cost;
        _hasJoinedService[user][serviceId] = true;
        _services[serviceId].totalSubscribers++;
        
        emit ServiceJoined(user, serviceId);
    }

    function getUserBalance(address user, uint256 serviceId) public view virtual returns (uint256) {
        require(serviceId <= _serviceId && serviceId > 0, "Invalid service ID");
        return _userBalances[user][serviceId];
    }

    function getServiceInfo(uint256 serviceId) public view virtual returns (
        uint256 cost, 
        uint256 interval, 
        bool isActive,
        uint256 totalSubscribers
    ) {
        require(serviceId <= _serviceId && serviceId > 0, "Invalid service ID");
        
        Service storage service = _services[serviceId];
        return (
            service.cost, 
            service.interval, 
            service.isActive,
            service.totalSubscribers
        );
    }
    
    // Check if a user has joined a specific service
    function hasUserJoined(address user, uint256 serviceId) public view returns (bool) {
        return _hasJoinedService[user][serviceId];
    }

    function toggleServiceActive(uint256 serviceId) public virtual onlyOwner {
        require(serviceId <= _serviceId && serviceId > 0, "Invalid service ID");

        _services[serviceId].isActive = !_services[serviceId].isActive;

        emit ServiceStatusToggled(serviceId, _services[serviceId].isActive);
    }
}

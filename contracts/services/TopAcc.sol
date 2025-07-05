
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@chainlink/contracts/src/v0.8/automation/AutomationCompatible.sol";
import "./IAddService.sol";

contract TopAcc is Ownable, AutomationCompatibleInterface {
    using SafeERC20 for IERC20;
    
    // USDC address on Sepolia
    address public constant USDC_SEPOLIA = 0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238;
    
    // AddService contract address
    address public addServiceAddress;
    
    // User balances in USDC
    mapping(address => uint256) public userBalances;
    
    // Service authorization
    struct ServiceAuthorization {
        bool isAuthorized;
        uint256 maxAmount;
        uint256 interval; // in seconds
        uint256 lastCharge;
    }
    
    // User's service authorizations
    mapping(address => mapping(uint256 => ServiceAuthorization)) public serviceAuthorizations;
    
    // Active users for automation
    address[] public activeUsers;
    
    // Events
    event FundsDeposited(address indexed user, uint256 amount);
    event FundsWithdrawn(address indexed user, uint256 amount);
    event ServiceAuthorized(address indexed user, uint256 indexed serviceId, uint256 maxAmount, uint256 interval);
    event ServiceAuthorizationRevoked(address indexed user, uint256 indexed serviceId);
    event ServiceJoined(address indexed user, uint256 indexed serviceId, uint256 amount);
    event RecurringPaymentProcessed(address indexed user, uint256 indexed serviceId, uint256 amount);
    
    event AutoPayRegistered(address indexed user, uint256 amount, uint256 interval, uint256 service);
    event AutoPayExecuted(address indexed user, uint256 amount, uint256 service);
    event AutoPayDisabled(address indexed user);
    event FundsDeposited(address indexed user, uint256 amount);
    event FundsWithdrawn(address indexed user, uint256 amount);
    event ServiceAuthorized(address indexed user, uint256 indexed serviceId, uint256 maxAmount, uint256 interval);
    event ServiceAuthorizationRevoked(address indexed user, uint256 indexed serviceId);
    event ServiceJoined(address indexed user, uint256 indexed serviceId, uint256 amount);
    
    constructor(address _addServiceAddress) Ownable(msg.sender) {
        require(_addServiceAddress != address(0), "Invalid AddService address");
        addServiceAddress = _addServiceAddress;
    }
    
    // Set the AddService contract address (only owner)
    function setAddServiceAddress(address _addServiceAddress) external onlyOwner {
        require(_addServiceAddress != address(0), "Invalid address");
        addServiceAddress = _addServiceAddress;
    }
    
    // Deposit USDC to the contract
    function depositFunds(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        
        IERC20 usdc = IERC20(USDC_SEPOLIA);
        usdc.safeTransferFrom(msg.sender, address(this), amount);
        
        userBalances[msg.sender] += amount;
        emit FundsDeposited(msg.sender, amount);
    }
    
    // Withdraw USDC from the contract
    function withdrawFunds(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        require(userBalances[msg.sender] >= amount, "Insufficient balance");
        
        userBalances[msg.sender] -= amount;
        
        IERC20 usdc = IERC20(USDC_SEPOLIA);
        usdc.safeTransfer(msg.sender, amount);
        
        emit FundsWithdrawn(msg.sender, amount);
    }
    
    // Authorize and join a service with initial deposit
    function authorizeAndJoinService(uint256 serviceId, uint256 maxAmount, uint256 interval) external {
        require(serviceId > 0, "Invalid service ID");
        require(maxAmount > 0, "Max amount must be greater than 0");
        require(interval > 0, "Interval must be greater than 0");
        
        // Get service info
        IAddService addService = IAddService(addServiceAddress);
        (uint256 cost,, bool isActive, ) = addService.getServiceInfo(serviceId);
        require(isActive, "Service is not active");
        require(maxAmount >= cost, "Max amount must cover at least one interval");
        
        // Check and update user's balance
        require(userBalances[msg.sender] >= cost, "Insufficient balance");
        userBalances[msg.sender] -= cost;
        
        // Approve and join service
        IERC20(USDC_SEPOLIA).approve(addServiceAddress, cost);
        addService.addToService(serviceId, msg.sender);
        
        // Store authorization
        serviceAuthorizations[msg.sender][serviceId] = ServiceAuthorization({
            isAuthorized: true,
            maxAmount: maxAmount,
            interval: interval,
            lastCharge: block.timestamp
        });
        
        // Add to active users if not already present
        bool isActiveUser = false;
        for (uint i = 0; i < activeUsers.length; i++) {
            if (activeUsers[i] == msg.sender) {
                isActiveUser = true;
                break;
            }
        }
        if (!isActiveUser) {
            activeUsers.push(msg.sender);
        }
        
        emit ServiceAuthorized(msg.sender, serviceId, maxAmount, interval);
        emit ServiceJoined(msg.sender, serviceId, cost);
    }
    //Check if address is blacklisted
    function isBlacklisted(uint256 service) public view returns (bool) {
        return _blackList[service];
    }

    // Process recurring payment for a service (can be called by anyone, but only processes if conditions are met)
    function processRecurringPayment(address user, uint256 serviceId) external {
        require(serviceId > 0, "Invalid service ID");
        
        ServiceAuthorization storage auth = serviceAuthorizations[user][serviceId];
        require(auth.isAuthorized, "Service not authorized");
        require(block.timestamp >= auth.lastCharge + auth.interval, "Too soon for next payment");
        
        // Get service cost
        IAddService addService = IAddService(addServiceAddress);
        (uint256 cost,, bool isActive,) = addService.getServiceInfo(serviceId);
        require(isActive, "Service is not active");
        
        // Verify user has sufficient balance and authorization
        require(userBalances[user] >= cost, "Insufficient balance");
        require(cost <= auth.maxAmount, "Service cost exceeds authorized amount");
        
        // Update balance and last charge time
        userBalances[user] -= cost;
        auth.lastCharge = block.timestamp;
        
        // Process payment to service
        IERC20(USDC_SEPOLIA).approve(addServiceAddress, cost);
        addService.addToService(serviceId, user);
        
        emit RecurringPaymentProcessed(user, serviceId, cost);
    }
  
    // Revoke service authorization and stop recurring payments
    function revokeServiceAuthorization(uint256 serviceId) external {
        require(serviceId > 0, "Invalid service ID");
        require(serviceAuthorizations[msg.sender][serviceId].isAuthorized, "Service not authorized");
        
        delete serviceAuthorizations[msg.sender][serviceId];
        
        // Remove from active users if no more authorizations
        bool hasActiveAuthorizations = false;
        for (uint i = 0; i < activeUsers.length; i++) {
            if (activeUsers[i] == msg.sender) {
                // Check if user has any other active authorizations
                for (uint j = 0; j < 100; j++) { // Assuming max 100 services per user
                    if (serviceAuthorizations[msg.sender][j].isAuthorized) {
                        hasActiveAuthorizations = true;
                        break;
                    }
                }
                
                if (!hasActiveAuthorizations) {
                    // Remove from active users
                    activeUsers[i] = activeUsers[activeUsers.length - 1];
                    activeUsers.pop();
                }
                break;
            }
        }
        
        emit ServiceAuthorizationRevoked(msg.sender, serviceId);
    }

    // Disapprove a service after approval - stop autopay
    function disapproveService() public {
        require(autoPayConfigs[msg.sender].isActive, "No active autopay found");
        
        autoPayConfigs[msg.sender].isActive = false;
        
        // Remove from active users array
        for (uint256 i = 0; i < activeAutoPayUsers.length; i++) {
            if (activeAutoPayUsers[i] == msg.sender) {
                activeAutoPayUsers[i] = activeAutoPayUsers[activeAutoPayUsers.length - 1];
                activeAutoPayUsers.pop();
                break;
            }
        }
        
        emit AutoPayDisabled(msg.sender);
    }

    // Chainlink Automation: Check if upkeep is needed
    function checkUpkeep(bytes calldata /* checkData */) external view override returns (bool upkeepNeeded, bytes memory performData) {
        // Check if any users need autopay execution
        address[] memory usersToProcess = new address[](activeAutoPayUsers.length);
        uint256 count = 0;
        
        for (uint256 i = 0; i < activeAutoPayUsers.length; i++) {
            address user = activeAutoPayUsers[i];
            AutoPayConfig memory config = autoPayConfigs[user];
            
            if (config.isActive && 
                block.timestamp >= config.lastPayment + config.interval &&
                _userBalances[user][config.service] >= config.amount) {
                usersToProcess[count] = user;
                count++;
            }
        }
        
        if (count > 0) {
            // Create a properly sized array
            address[] memory finalUsers = new address[](count);
            for (uint256 i = 0; i < count; i++) {
                finalUsers[i] = usersToProcess[i];
            }
            
            upkeepNeeded = true;
            performData = abi.encode(finalUsers);
        } else {
            upkeepNeeded = false;
            performData = "";
        }
    }

    // Chainlink Automation: Perform upkeep
    function performUpkeep(bytes calldata performData) external override {
        address[] memory usersToProcess = abi.decode(performData, (address[]));
        
        for (uint256 i = 0; i < usersToProcess.length; i++) {
            address user = usersToProcess[i];
            AutoPayConfig storage config = autoPayConfigs[user];
            
            // Double-check conditions
            if (config.isActive && 
                block.timestamp >= config.lastPayment + config.interval &&
                _userBalances[user][config.service] >= config.amount) {
                
                // Execute the autopay
                deductBalance(user, config.amount);
                config.lastPayment = block.timestamp;
                
                emit AutoPayExecuted(user, config.amount, config.serviceProvider);
            }
        }
    }

    
    // Get autopay configuration for a user
    function getAutoPayConfig(address user) public view returns (AutoPayConfig memory) {
        return autoPayConfigs[user];
    }
    
    // Get all active autopay users (for debugging)
    function getActiveAutoPayUsers() public view returns (address[] memory) {
        return activeAutoPayUsers;
    }
    
    // Emergency function to pause all autopays (only owner)
    function emergencyPause() public onlyOwner {
        for (uint256 i = 0; i < activeAutoPayUsers.length; i++) {
            autoPayConfigs[activeAutoPayUsers[i]].isActive = false;
        }
        delete activeAutoPayUsers;
    }
    

}

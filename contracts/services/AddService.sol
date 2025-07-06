// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./ITopAcc.sol";

/**
 * @title The interface for Chainlink Automation compatible contracts
 * @notice Contract implements the AutomationCompatibleInterface from Chainlink
 */
interface AutomationCompatibleInterface {
    /**
     * @notice method that is simulated by the keepers to see if any work actually
     * needs to be performed. This method does does not actually need to be
     * executable, and since it is only ever simulated it can consume lots of gas.
     * @dev To ensure that it is never called, you may want to add the
     * cannotExecute modifier from AutomationBase to your implementation of this
     * method.
     * @param checkData specified in the upkeep registration so it is always the
     * same for a registered upkeep. This can easily be broken down into specific
     * arguments using `abi.decode`, so multiple upkeeps can be registered on the
     * same contract and easily differentiated by the contract.
     * @return upkeepNeeded boolean to indicate whether the keeper should call
     * performUpkeep or not.
     * @return performData bytes that the keeper should call performUpkeep with, if
     * upkeep is needed. If you would like to encode data to decode later, try
     * `abi.encode`.
     */
    function checkUpkeep(
        bytes calldata checkData
    ) external returns (bool upkeepNeeded, bytes memory performData);

    /**
     * @notice method that is actually executed by the keepers, via the registry.
     * The data returned by the checkUpkeep simulation will be passed into
     * this method to actually be executed.
     * @dev The input to this method should not be trusted, and the caller of the
     * method should not even be restricted to any single registry. Anyone should
     * be able call it, and the input should be validated, there is no guarantee
     * that the data passed in is the performData returned from checkUpkeep. This
     * could happen due to malicious keepers, racing keepers, or simply a state
     * change while the performUpkeep transaction is waiting for confirmation.
     * Always validate the data passed in.
     * @param performData is the data which was passed back from the checkData
     * simulation. If it is encoded, it can easily be decoded into other types by
     * calling `abi.decode`. This data should not be trusted, and should be
     * validated against the contract's current state.
     */
    function performUpkeep(bytes calldata performData) external;
}

contract AddService is Ownable, AutomationCompatibleInterface {
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

    // Chainlink Automation state variables
    struct DeductionSchedule {
        uint256 nextDeductionTimestamp;
        uint256 amount;
        bool isActive;
        uint256 interval;
    }
    
    // user => serviceId => DeductionSchedule
    mapping(address => mapping(uint256 => DeductionSchedule)) public deductionSchedules;
    
    // Array to keep track of all active schedules for iteration
    struct ScheduleKey {
        address user;
        uint256 serviceId;
    }
    
    ScheduleKey[] public activeSchedules;

    // Events
    event ServiceRegistered(uint256 indexed serviceId, uint256 cost, uint256 interval);
    event BalanceDeposited(address indexed user, uint256 indexed serviceId, uint256 amount);
    event BalanceDeducted(address indexed user, uint256 indexed serviceId, uint256 amount);
    event ServiceJoined(address indexed user, uint256 indexed serviceId);
    event DeductionScheduled(address indexed user, uint256 indexed serviceId, uint256 nextDeduction);
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
        
        _userBalances[user][serviceId] -= amount;
        
        emit BalanceDeducted(user, serviceId, amount);
        return true;
    }
    
    // Schedule automatic deductions for a user's service
    function scheduleDeduction(
        address user,
        uint256 serviceId,
        uint256 amount,
        uint256 intervalInSeconds
    ) external onlyOwner {
        require(serviceId <= _serviceId && serviceId > 0, "Invalid service ID");
        require(_services[serviceId].isActive, "Service is not active");
        require(intervalInSeconds > 0, "Interval must be greater than 0");
        require(amount > 0, "Amount must be greater than 0");
        
        // If this is a new schedule, add it to the activeSchedules array
        if (!deductionSchedules[user][serviceId].isActive) {
            activeSchedules.push(ScheduleKey(user, serviceId));
        }
        
        deductionSchedules[user][serviceId] = DeductionSchedule({
            nextDeductionTimestamp: block.timestamp + intervalInSeconds,
            amount: amount,
            isActive: true,
            interval: intervalInSeconds
        });
        
        emit DeductionScheduled(user, serviceId, block.timestamp + intervalInSeconds);
    }
    
    // Cancel a scheduled deduction
    function cancelScheduledDeduction(address user, uint256 serviceId) external onlyOwner {
        require(deductionSchedules[user][serviceId].isActive, "No active schedule");
        
        // Remove from activeSchedules array
        for (uint256 i = 0; i < activeSchedules.length; i++) {
            if (activeSchedules[i].user == user && activeSchedules[i].serviceId == serviceId) {
                // Swap with the last element and pop
                activeSchedules[i] = activeSchedules[activeSchedules.length - 1];
                activeSchedules.pop();
                break;
            }
        }
        
        delete deductionSchedules[user][serviceId];
    }
    
    // Chainlink Automation: Check if any deductions need to be processed
    function checkUpkeep(
        bytes calldata /* checkData */
    ) external view override returns (bool upkeepNeeded, bytes memory performData) {
        uint256 maxToProcess = 10; // Process up to 10 at a time to avoid gas issues
        address[] memory usersToProcess = new address[](maxToProcess);
        uint256[] memory serviceIds = new uint256[](maxToProcess);
        uint256[] memory amounts = new uint256[](maxToProcess);
        
        uint256 counter = 0;
        
        // Iterate through active schedules to find ones that need processing
        for (uint256 i = 0; i < activeSchedules.length && counter < maxToProcess; i++) {
            ScheduleKey memory key = activeSchedules[i];
            DeductionSchedule memory schedule = deductionSchedules[key.user][key.serviceId];
            
            if (schedule.isActive && block.timestamp >= schedule.nextDeductionTimestamp) {
                // Check if user has sufficient balance
                if (_userBalances[key.user][key.serviceId] >= schedule.amount) {
                    usersToProcess[counter] = key.user;
                    serviceIds[counter] = key.serviceId;
                    amounts[counter] = schedule.amount;
                    counter++;
                }
            }
        }
        
        // If we found any schedules to process, return them
        if (counter > 0) {
            // Trim the arrays to the actual number of items we're processing
            assembly {
                mstore(usersToProcess, counter)
                mstore(serviceIds, counter)
                mstore(amounts, counter)
            }
            return (true, abi.encode(usersToProcess, serviceIds, amounts));
        }
        
        return (false, "");
    }
    
    // Chainlink Automation: Perform the actual deductions
    function performUpkeep(bytes calldata performData) external override {
        (address[] memory users, uint256[] memory serviceIds, uint256[] memory amounts) = 
            abi.decode(performData, (address[], uint256[], uint256[]));
        
        for (uint256 i = 0; i < users.length; i++) {
            address user = users[i];
            uint256 serviceId = serviceIds[i];
            uint256 amount = amounts[i];
            
            // Verify the schedule is still active and ready for processing
            DeductionSchedule storage schedule = deductionSchedules[user][serviceId];
            if (!schedule.isActive || block.timestamp < schedule.nextDeductionTimestamp) {
                continue;
            }
            
            // Verify the user still has sufficient balance
            if (_userBalances[user][serviceId] < amount) {
                // If insufficient balance, deactivate the schedule
                schedule.isActive = false;
                emit BalanceDeducted(user, serviceId, 0); // Emit event with 0 amount to indicate failure
                continue;
            }
            
            // Perform the deduction
            _userBalances[user][serviceId] -= amount;
            
            // Update the next deduction time
            schedule.nextDeductionTimestamp = block.timestamp + schedule.interval;
            
            emit BalanceDeducted(user, serviceId, amount);
        }
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

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockUSDC is ERC20 {
    uint8 private _decimals;
    
    constructor(
        string memory name,
        string memory symbol,
        uint8 decimalUnits,
        uint256 initialSupply
    ) ERC20(name, symbol) {
        _decimals = decimalUnits;
        _mint(msg.sender, initialSupply * (10 ** uint256(decimals())));
    }
    
    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }
    
    // Function to mint tokens (for testing purposes)
    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }
}

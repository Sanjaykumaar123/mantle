// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title RWAUSD
/// @notice Demo-only settlement dollar for Arbitrum Sepolia.
/// @dev Public mint is intentional for testnet demos. Do not deploy this version to production.
contract RWAUSD is ERC20 {
    constructor() ERC20("RWAUSD Demo Dollar", "RWAUSD") {}

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

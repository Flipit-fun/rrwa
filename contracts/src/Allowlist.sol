// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Allowlist
 * @notice Gates who may fund a Raise. Replaces the old "anyone can invest"
 *         behavior with an owner-managed allowlist. There is no automated KYC
 *         check yet — the platform owner approves wallets manually for now.
 *         A real KYC provider can plug in later by having it call
 *         `setAllowed` once a wallet clears verification.
 *
 *         `restricted` defaults to true: gating is ON by default for every
 *         freshly deployed Allowlist. The owner can flip it off if the
 *         platform ever wants an open period.
 */
contract Allowlist is Ownable {
    bool public restricted = true;
    mapping(address => bool) public allowed;

    event AllowedSet(address indexed account, bool allowed);
    event RestrictedSet(bool restricted);

    constructor(address owner_) Ownable(owner_) {}

    /// @notice Approve or revoke a single wallet.
    function setAllowed(address account, bool value) external onlyOwner {
        allowed[account] = value;
        emit AllowedSet(account, value);
    }

    /// @notice Approve or revoke many wallets in one call.
    function setAllowedBatch(address[] calldata accounts, bool value) external onlyOwner {
        for (uint256 i = 0; i < accounts.length; i++) {
            allowed[accounts[i]] = value;
            emit AllowedSet(accounts[i], value);
        }
    }

    /// @notice Turn the gate on/off entirely. On by default.
    function setRestricted(bool value) external onlyOwner {
        restricted = value;
        emit RestrictedSet(value);
    }

    /// @notice True if `account` may fund a raise right now.
    function isAllowed(address account) external view returns (bool) {
        return !restricted || allowed[account];
    }
}

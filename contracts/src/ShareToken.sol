// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

interface IShareHook {
    function onShareTransfer(address from, address to) external;
}

/**
 * @title ShareToken
 * @notice ERC-20 representing pro-rata ownership of a single RRWA asset.
 *         One ShareToken is deployed per Raise. Shares are minted 1:1 against
 *         USDC contributed (so token decimals match USDC = 6).
 *
 *         Every balance change notifies the yield hook (the RentVault) so that
 *         streamed rent yield is settled to both parties before balances move.
 */
contract ShareToken is ERC20 {
    address public immutable minter; // the Raise contract
    IShareHook public hook; // the RentVault (set once by the minter)

    error OnlyMinter();
    error HookAlreadySet();

    constructor(string memory name_, string memory symbol_, address minter_)
        ERC20(name_, symbol_)
    {
        minter = minter_;
    }

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    modifier onlyMinter() {
        if (msg.sender != minter) revert OnlyMinter();
        _;
    }

    /// @notice Wire the yield hook. Called once by the Raise during deployment wiring.
    function setHook(address hook_) external onlyMinter {
        if (address(hook) != address(0)) revert HookAlreadySet();
        hook = IShareHook(hook_);
    }

    /// @notice Mint new shares. Only the Raise contract can mint.
    function mint(address to, uint256 amount) external onlyMinter {
        _mint(to, amount);
    }

    /// @dev Settle streamed yield for both sides before balances change.
    function _update(address from, address to, uint256 value) internal override {
        if (address(hook) != address(0)) {
            hook.onShareTransfer(from, to);
        }
        super._update(from, to, value);
    }
}

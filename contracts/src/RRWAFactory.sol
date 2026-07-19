// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Raise } from "./Raise.sol";

/**
 * @title RRWAFactory
 * @notice Deploys a new Raise per listing and keeps an on-chain registry of
 *         every raise created. The frontend reads this registry to render the
 *         live marketplace, then merges each raise with its off-chain metadata.
 *
 *         Investing is open to anyone — there is no allowlist/KYC gate at
 *         the contract level.
 */
contract RRWAFactory {
    address public immutable usdc;

    address[] public raises;
    mapping(address => bool) public isRaise;

    event RaiseCreated(
        address indexed raise,
        address indexed lister,
        uint256 target,
        uint256 apyBps,
        address shareToken,
        address rentVault,
        string assetName,
        string shareSymbol,
        uint256 minContribution,
        uint256 maxContribution
    );

    error ZeroTarget();
    error ZeroApy();
    error InvalidContributionBounds();

    constructor(address usdc_) {
        usdc = usdc_;
    }

    /**
     * @notice Create a new raise. The caller becomes the lister. After this,
     *         the lister must call `depositRent()` on the raise (funding the
     *         RentVault) before contributions are meaningful.
     *
     *         `minContribution`/`maxContribution` bound how much a single
     *         wallet may put into this raise (0 means "no cap" for either).
     *         Set both to 0 for a raise with no per-wallet limits.
     */
    function createRaise(
        uint256 target,
        uint256 apyBps,
        string calldata assetName,
        string calldata shareSymbol,
        uint256 minContribution,
        uint256 maxContribution
    ) external returns (address raiseAddr) {
        if (target == 0) revert ZeroTarget();
        if (apyBps == 0) revert ZeroApy();
        if (maxContribution > 0 && minContribution > maxContribution) {
            revert InvalidContributionBounds();
        }

        Raise raise = new Raise(
            usdc,
            msg.sender,
            target,
            apyBps,
            assetName,
            shareSymbol,
            minContribution,
            maxContribution
        );
        raiseAddr = address(raise);

        raises.push(raiseAddr);
        isRaise[raiseAddr] = true;

        emit RaiseCreated(
            raiseAddr,
            msg.sender,
            target,
            apyBps,
            address(raise.shareToken()),
            address(raise.rentVault()),
            assetName,
            shareSymbol,
            minContribution,
            maxContribution
        );
    }

    function raisesCount() external view returns (uint256) {
        return raises.length;
    }

    /// @notice Paginated registry read for the frontend.
    function getRaises(uint256 offset, uint256 limit)
        external
        view
        returns (address[] memory page)
    {
        uint256 total = raises.length;
        if (offset >= total) return new address[](0);
        uint256 end = offset + limit;
        if (end > total) end = total;
        page = new address[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            page[i - offset] = raises[i];
        }
    }

    function allRaises() external view returns (address[] memory) {
        return raises;
    }
}

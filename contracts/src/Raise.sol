// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { ShareToken } from "./ShareToken.sol";
import { RentVault } from "./RentVault.sol";
import { Allowlist } from "./Allowlist.sol";

/**
 * @title Raise
 * @notice One crowdfunding raise for a single real-world asset.
 *
 *         Lifecycle:
 *           Raising  — accepting funder contributions until target is reached
 *           Funded   — target reached, awaiting lister withdrawal
 *           Active   — lister withdrew full amount; rent yield is streaming
 *           Matured  — 3-year term elapsed
 *
 *         Rules enforced:
 *           - contributions cannot exceed target (no overfunding)
 *           - lister can only withdraw when raised == target (no partial)
 *           - shares mint 1:1 with USDC contributed (USDC 6 decimals)
 */
contract Raise is ReentrancyGuard {
    using SafeERC20 for IERC20;

    enum State {
        Raising,
        Funded,
        Active,
        Matured
    }

    IERC20 public immutable usdc;
    address public immutable lister;
    uint256 public immutable target; // USDC base units (6 decimals)
    uint256 public immutable apyBps; // fixed APY, basis points
    ShareToken public immutable shareToken;
    RentVault public immutable rentVault;
    Allowlist public immutable allowlist;

    // Per-wallet investment bounds. minContribution applies to each
    // individual `fund()` call; maxContribution caps a wallet's cumulative
    // contribution across all calls. Zero means "no cap" for either.
    uint256 public immutable minContribution;
    uint256 public immutable maxContribution;

    State public state;
    uint256 public raised;
    uint256 public funderCount;
    mapping(address => bool) private hasFunded;
    mapping(address => uint256) public contributed;

    event Funded(address indexed funder, uint256 amount, uint256 raisedAfter);
    event TargetReached(uint256 raised);
    event Withdrawn(address indexed lister, uint256 amount);
    event Matured();

    error NotRaising();
    error ZeroAmount();
    error ExceedsTarget(uint256 remaining);
    error OnlyLister();
    error NotFunded();
    error NotActive();
    error NotMatured();
    error TermNotElapsed();
    error NotAllowlisted();
    error BelowMinContribution(uint256 min);
    error ExceedsMaxContribution(uint256 max);

    constructor(
        address usdc_,
        address lister_,
        uint256 target_,
        uint256 apyBps_,
        string memory assetName,
        string memory shareSymbol,
        address allowlist_,
        uint256 minContribution_,
        uint256 maxContribution_
    ) {
        usdc = IERC20(usdc_);
        lister = lister_;
        target = target_;
        apyBps = apyBps_;
        state = State.Raising;
        allowlist = Allowlist(allowlist_);
        minContribution = minContribution_;
        maxContribution = maxContribution_;

        shareToken = new ShareToken(assetName, shareSymbol, address(this));
        rentVault = new RentVault(usdc_, address(this));

        // wire yield accounting
        shareToken.setHook(address(rentVault));
        rentVault.setShareToken(address(shareToken));
    }

    /// @notice Required upfront rent: target * apyBps * 3 years / 10000.
    function requiredRent() public view returns (uint256) {
        return (target * apyBps * 3) / 10000;
    }

    /**
     * @notice Lister deposits the full 3-year rent into the vault. Must be done
     *         before funders contribute (enforced by the factory flow, and safe
     *         to call here anytime while Raising).
     */
    function depositRent() external nonReentrant {
        if (msg.sender != lister) revert OnlyLister();
        if (state != State.Raising) revert NotRaising();
        rentVault.depositRent(msg.sender, requiredRent());
    }

    /**
     * @notice Contribute `amount` USDC toward the target. Mints shares 1:1.
     *         Reverts if the contribution would exceed the target.
     */
    function fund(uint256 amount) external nonReentrant {
        if (state != State.Raising) revert NotRaising();
        if (amount == 0) revert ZeroAmount();
        if (!allowlist.isAllowed(msg.sender)) revert NotAllowlisted();
        if (minContribution > 0 && amount < minContribution) {
            revert BelowMinContribution(minContribution);
        }

        uint256 remaining = target - raised;
        if (amount > remaining) revert ExceedsTarget(remaining);

        uint256 newTotal = contributed[msg.sender] + amount;
        if (maxContribution > 0 && newTotal > maxContribution) {
            revert ExceedsMaxContribution(maxContribution);
        }
        contributed[msg.sender] = newTotal;

        raised += amount;
        if (!hasFunded[msg.sender]) {
            hasFunded[msg.sender] = true;
            funderCount++;
        }

        usdc.safeTransferFrom(msg.sender, address(this), amount);
        shareToken.mint(msg.sender, amount);

        emit Funded(msg.sender, amount, raised);

        if (raised == target) {
            state = State.Funded;
            emit TargetReached(raised);
        }
    }

    /**
     * @notice Lister withdraws the full raised amount. Only valid once the
     *         target is fully reached. Moves state to Active and starts the
     *         rent yield stream. No partial withdrawals.
     */
    function withdraw() external nonReentrant {
        if (msg.sender != lister) revert OnlyLister();
        if (state != State.Funded) revert NotFunded();

        state = State.Active;
        uint256 amount = raised;
        rentVault.activate();
        usdc.safeTransfer(lister, amount);

        emit Withdrawn(lister, amount);
    }

    /// @notice Flip to Matured once the 3-year stream has fully elapsed.
    function markMatured() external {
        if (state != State.Active) revert NotActive();
        if (block.timestamp < rentVault.endTime()) revert TermNotElapsed();
        state = State.Matured;
        emit Matured();
    }

    /// @notice True once the raise has matured (used by the Marketplace fee logic).
    function isMatured() external view returns (bool) {
        if (state == State.Matured) return true;
        if (state == State.Active && block.timestamp >= rentVault.endTime()) {
            return true;
        }
        return false;
    }

    // ---- views for the frontend ----
    function summary()
        external
        view
        returns (
            State state_,
            uint256 target_,
            uint256 raised_,
            uint256 apyBps_,
            uint256 funderCount_,
            address shareToken_,
            address rentVault_,
            address lister_,
            uint256 minContribution_,
            uint256 maxContribution_
        )
    {
        return (
            state,
            target,
            raised,
            apyBps,
            funderCount,
            address(shareToken),
            address(rentVault),
            lister,
            minContribution,
            maxContribution
        );
    }
}

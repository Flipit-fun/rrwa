// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { ShareToken } from "./ShareToken.sol";

/**
 * @title RentVault
 * @notice Holds the 3 years of rent a lister deposits upfront and streams it
 *         to shareholders as yield, linearly per second, once the raise is
 *         Active. Yield is distributed pro-rata to share balances using a
 *         reward-per-share accumulator, so shares remain freely transferable
 *         and each holder can `claimYield()` their accrued amount at any time.
 *
 *         Total rent = target * apyBps * 3 / 10000 (three years of APY).
 *         Stream duration = 3 years (in seconds).
 */
contract RentVault is ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint256 public constant DURATION = 3 * 365 days;

    IERC20 public immutable usdc;
    address public immutable raise;
    ShareToken public shareToken;

    uint256 public totalRent; // total USDC to be streamed over DURATION
    uint256 public rentRate; // USDC per second (scaled by ACC_PRECISION internally)
    uint256 public startTime; // stream start (activation)
    uint256 public endTime; // startTime + DURATION

    // reward accounting (per share, scaled by ACC_PRECISION)
    uint256 private constant ACC_PRECISION = 1e18;
    uint256 public rewardPerShareStored;
    uint256 public lastUpdateTime;
    uint256 public totalShares; // fixed at activation (== target)

    mapping(address => uint256) public userRewardPerSharePaid;
    mapping(address => uint256) public rewards;

    bool public funded; // rent deposited
    bool public active; // stream started

    event RentDeposited(uint256 amount);
    event Activated(uint256 startTime, uint256 totalShares);
    event YieldClaimed(address indexed account, uint256 amount);

    error OnlyRaise();
    error AlreadyFunded();
    error NotFunded();
    error AlreadyActive();
    error NotActive();
    error NothingToClaim();

    constructor(address usdc_, address raise_) {
        usdc = IERC20(usdc_);
        raise = raise_;
    }

    modifier onlyRaise() {
        if (msg.sender != raise) revert OnlyRaise();
        _;
    }

    /// @notice Set the share token. Called once by the Raise after it deploys the token.
    function setShareToken(address token) external onlyRaise {
        shareToken = ShareToken(token);
    }

    /**
     * @notice Lister deposits the full 3-year rent. Required before the raise
     *         can go live. Pulls `amount` USDC from the lister.
     */
    function depositRent(address from, uint256 amount) external onlyRaise nonReentrant {
        if (funded) revert AlreadyFunded();
        funded = true;
        totalRent = amount;
        usdc.safeTransferFrom(from, address(this), amount);
        emit RentDeposited(amount);
    }

    /**
     * @notice Begin streaming. Called by the Raise when the lister withdraws
     *         (state -> Active). Fixes totalShares and the per-second rate.
     */
    function activate() external onlyRaise {
        if (!funded) revert NotFunded();
        if (active) revert AlreadyActive();
        active = true;
        startTime = block.timestamp;
        endTime = block.timestamp + DURATION;
        lastUpdateTime = block.timestamp;
        totalShares = shareToken.totalSupply();
        rentRate = totalRent / DURATION;
        emit Activated(startTime, totalShares);
    }

    /// @dev Total streamed-per-share up to `block.timestamp`.
    ///      Accrues directly from totalRent/DURATION (not the truncated
    ///      per-second `rentRate`) so the full rent streams out with no dust.
    function rewardPerShare() public view returns (uint256) {
        if (!active || totalShares == 0) return rewardPerShareStored;
        uint256 clampedNow = block.timestamp < endTime ? block.timestamp : endTime;
        if (clampedNow <= lastUpdateTime) return rewardPerShareStored;
        uint256 elapsed = clampedNow - lastUpdateTime;
        return
            rewardPerShareStored
                + (totalRent * elapsed * ACC_PRECISION) / (DURATION * totalShares);
    }

    /// @notice Yield accrued to `account` but not yet claimed, in USDC base units.
    function earned(address account) public view returns (uint256) {
        uint256 balance = active ? shareToken.balanceOf(account) : 0;
        uint256 perShareDelta = rewardPerShare() - userRewardPerSharePaid[account];
        return rewards[account] + (balance * perShareDelta) / ACC_PRECISION;
    }

    function _updateReward(address account) internal {
        rewardPerShareStored = rewardPerShare();
        lastUpdateTime = block.timestamp < endTime ? block.timestamp : endTime;
        if (account != address(0)) {
            rewards[account] = earned(account);
            userRewardPerSharePaid[account] = rewardPerShareStored;
        }
    }

    /**
     * @notice Hook invoked by the ShareToken before any balance change so both
     *         sides of a transfer have their accrued yield settled first.
     */
    function onShareTransfer(address from, address to) external {
        require(msg.sender == address(shareToken), "only share token");
        if (!active) return;
        _updateReward(from);
        if (to != from) _updateReward(to);
    }

    /// @notice Claim all accrued yield for the caller.
    function claimYield() external nonReentrant {
        if (!active) revert NotActive();
        _updateReward(msg.sender);
        uint256 amount = rewards[msg.sender];
        if (amount == 0) revert NothingToClaim();
        rewards[msg.sender] = 0;
        usdc.safeTransfer(msg.sender, amount);
        emit YieldClaimed(msg.sender, amount);
    }
}

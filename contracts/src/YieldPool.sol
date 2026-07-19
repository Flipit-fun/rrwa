// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { Allowlist } from "./Allowlist.sol";

/**
 * @title YieldPool
 * @notice The main RRWA product: deposit USDG and earn a fixed APY, funded by
 *         rent collected across the platform's listed real-world properties.
 *         This replaces per-property crowdfunding as the primary way people
 *         put capital to work — properties back the pool's yield, but a
 *         depositor here does not buy a stake in any single property.
 *
 *         Accounting: simple per-second interest on each depositor's own
 *         principal at a fixed `apyBps`, not a shared pot split pro-rata.
 *         Principal is custodied by this contract and withdrawable anytime.
 *         Yield is paid out of the `treasury` wallet, which must keep this
 *         contract approved to pull USDG — that's what "the Treasury wallet
 *         pays the APY" means operationally.
 *
 *         Investing is gated by an Allowlist (KYC comes later; for now the
 *         platform owner approves wallets manually).
 */
contract YieldPool is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    uint256 public constant SECONDS_PER_YEAR = 365 days;

    IERC20 public immutable usdg;
    Allowlist public immutable allowlist;
    uint256 public immutable apyBps; // fixed APY, basis points (1200 = 12%)

    address public treasury; // pays out yield on claim

    uint256 public totalPrincipal;

    struct Position {
        uint256 principal;
        uint256 accrued; // settled but unclaimed yield
        uint256 lastUpdate;
    }

    mapping(address => Position) public positions;

    event Deposited(address indexed account, uint256 amount, uint256 principalAfter);
    event Withdrawn(address indexed account, uint256 amount, uint256 principalAfter);
    event YieldClaimed(address indexed account, uint256 amount);
    event TreasuryUpdated(address treasury);

    error NotAllowlisted();
    error ZeroAmount();
    error InsufficientPrincipal();
    error NothingToClaim();

    constructor(
        address usdg_,
        address allowlist_,
        address treasury_,
        uint256 apyBps_,
        address owner_
    ) Ownable(owner_) {
        usdg = IERC20(usdg_);
        allowlist = Allowlist(allowlist_);
        treasury = treasury_;
        apyBps = apyBps_;
    }

    function setTreasury(address treasury_) external onlyOwner {
        treasury = treasury_;
        emit TreasuryUpdated(treasury_);
    }

    modifier onlyAllowed() {
        if (!allowlist.isAllowed(msg.sender)) revert NotAllowlisted();
        _;
    }

    /// @dev Settle interest accrued since the position's last update.
    function _settle(address account) internal {
        Position storage p = positions[account];
        if (p.lastUpdate == 0) {
            p.lastUpdate = block.timestamp;
            return;
        }
        uint256 elapsed = block.timestamp - p.lastUpdate;
        if (elapsed > 0 && p.principal > 0) {
            p.accrued += (p.principal * apyBps * elapsed) / (10000 * SECONDS_PER_YEAR);
        }
        p.lastUpdate = block.timestamp;
    }

    /// @notice Deposit `amount` USDG into the pool. Requires allowlist approval.
    function deposit(uint256 amount) external nonReentrant onlyAllowed {
        if (amount == 0) revert ZeroAmount();
        _settle(msg.sender);

        Position storage p = positions[msg.sender];
        p.principal += amount;
        totalPrincipal += amount;

        usdg.safeTransferFrom(msg.sender, address(this), amount);

        emit Deposited(msg.sender, amount, p.principal);
    }

    /// @notice Withdraw `amount` of principal. Does not touch accrued yield.
    function withdraw(uint256 amount) external nonReentrant {
        if (amount == 0) revert ZeroAmount();
        _settle(msg.sender);

        Position storage p = positions[msg.sender];
        if (amount > p.principal) revert InsufficientPrincipal();
        p.principal -= amount;
        totalPrincipal -= amount;

        usdg.safeTransfer(msg.sender, amount);

        emit Withdrawn(msg.sender, amount, p.principal);
    }

    /// @notice Claim all accrued yield. Paid out of the treasury wallet.
    function claimYield() external nonReentrant {
        _settle(msg.sender);

        Position storage p = positions[msg.sender];
        uint256 amount = p.accrued;
        if (amount == 0) revert NothingToClaim();
        p.accrued = 0;

        usdg.safeTransferFrom(treasury, msg.sender, amount);

        emit YieldClaimed(msg.sender, amount);
    }

    /// @notice Yield accrued but not yet claimed, in USDG base units.
    function earned(address account) external view returns (uint256) {
        Position storage p = positions[account];
        uint256 accrued = p.accrued;
        if (p.lastUpdate != 0 && p.principal > 0) {
            uint256 elapsed = block.timestamp - p.lastUpdate;
            accrued += (p.principal * apyBps * elapsed) / (10000 * SECONDS_PER_YEAR);
        }
        return accrued;
    }

    function principalOf(address account) external view returns (uint256) {
        return positions[account].principal;
    }
}

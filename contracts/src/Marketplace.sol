// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { Raise } from "./Raise.sol";
import { RRWAFactory } from "./RRWAFactory.sol";

/**
 * @title Marketplace
 * @notice Secondary market for share positions. A seller lists an amount of a
 *         raise's ShareToken at a USDC price. A buyer pays USDC; the shares
 *         move to the buyer.
 *
 *         Fee: if the raise has NOT matured, 50% of sale proceeds go to the
 *         platform treasury and 50% to the seller (the early-exit penalty).
 *         After maturity the fee is 0% and the seller keeps everything.
 *
 *         The seller must approve this contract to transfer the shares, and
 *         the buyer must approve USDC. Shares are escrowed on listing.
 */
contract Marketplace is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint256 public constant EARLY_EXIT_FEE_BPS = 5000; // 50%

    IERC20 public immutable usdc;
    RRWAFactory public immutable factory;
    address public treasury;

    struct Listing {
        address seller;
        address raise; // the Raise whose shares are being sold
        address shareToken;
        uint256 shareAmount; // shares escrowed
        uint256 price; // total USDC asked
        bool active;
    }

    Listing[] public listings;

    event Listed(
        uint256 indexed id,
        address indexed seller,
        address indexed raise,
        uint256 shareAmount,
        uint256 price
    );
    event Cancelled(uint256 indexed id);
    event Sold(
        uint256 indexed id,
        address indexed buyer,
        uint256 price,
        uint256 fee,
        uint256 toSeller
    );
    event TreasuryUpdated(address treasury);

    error UnknownRaise();
    error ZeroAmount();
    error ZeroPrice();
    error NotSeller();
    error Inactive();
    error CannotBuyOwn();

    constructor(address usdc_, address factory_, address treasury_, address owner_)
        Ownable(owner_)
    {
        usdc = IERC20(usdc_);
        factory = RRWAFactory(factory_);
        treasury = treasury_;
    }

    function setTreasury(address treasury_) external onlyOwner {
        treasury = treasury_;
        emit TreasuryUpdated(treasury_);
    }

    /**
     * @notice List `shareAmount` shares of `raise` for a total `price` in USDC.
     *         Shares are escrowed into this contract. Seller must approve first.
     */
    function list(address raise, uint256 shareAmount, uint256 price)
        external
        nonReentrant
        returns (uint256 id)
    {
        if (!factory.isRaise(raise)) revert UnknownRaise();
        if (shareAmount == 0) revert ZeroAmount();
        if (price == 0) revert ZeroPrice();

        address shareToken = address(Raise(raise).shareToken());

        id = listings.length;
        listings.push(
            Listing({
                seller: msg.sender,
                raise: raise,
                shareToken: shareToken,
                shareAmount: shareAmount,
                price: price,
                active: true
            })
        );

        IERC20(shareToken).safeTransferFrom(msg.sender, address(this), shareAmount);

        emit Listed(id, msg.sender, raise, shareAmount, price);
    }

    /// @notice Seller cancels an active listing and reclaims escrowed shares.
    function cancel(uint256 id) external nonReentrant {
        Listing storage l = listings[id];
        if (!l.active) revert Inactive();
        if (l.seller != msg.sender) revert NotSeller();

        l.active = false;
        IERC20(l.shareToken).safeTransfer(l.seller, l.shareAmount);

        emit Cancelled(id);
    }

    /**
     * @notice Buy a listing. Buyer pays `price` USDC. If the raise has not
     *         matured, 50% goes to treasury and 50% to the seller; otherwise
     *         the seller receives the full price. Escrowed shares go to buyer.
     */
    function buy(uint256 id) external nonReentrant {
        Listing storage l = listings[id];
        if (!l.active) revert Inactive();
        if (l.seller == msg.sender) revert CannotBuyOwn();

        l.active = false;

        bool matured = Raise(l.raise).isMatured();
        uint256 fee = matured ? 0 : (l.price * EARLY_EXIT_FEE_BPS) / 10000;
        uint256 toSeller = l.price - fee;

        // pull full price from buyer
        usdc.safeTransferFrom(msg.sender, address(this), l.price);
        if (fee > 0) usdc.safeTransfer(treasury, fee);
        usdc.safeTransfer(l.seller, toSeller);

        // deliver escrowed shares
        IERC20(l.shareToken).safeTransfer(msg.sender, l.shareAmount);

        emit Sold(id, msg.sender, l.price, fee, toSeller);
    }

    function listingsCount() external view returns (uint256) {
        return listings.length;
    }

    /// @notice Quote the fee split for a listing at the current time.
    function quote(uint256 id)
        external
        view
        returns (uint256 price, uint256 fee, uint256 toSeller, bool matured)
    {
        Listing storage l = listings[id];
        matured = Raise(l.raise).isMatured();
        price = l.price;
        fee = matured ? 0 : (l.price * EARLY_EXIT_FEE_BPS) / 10000;
        toSeller = price - fee;
    }
}

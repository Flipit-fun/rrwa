// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Test } from "forge-std/Test.sol";
import { MockUSDC } from "./mocks/MockUSDC.sol";
import { RRWAFactory } from "../src/RRWAFactory.sol";
import { Raise } from "../src/Raise.sol";
import { ShareToken } from "../src/ShareToken.sol";
import { RentVault } from "../src/RentVault.sol";
import { Marketplace } from "../src/Marketplace.sol";

contract RRWATest is Test {
    MockUSDC usdc;
    RRWAFactory factory;
    Marketplace marketplace;

    address lister = makeAddr("lister");
    address alice = makeAddr("alice");
    address bob = makeAddr("bob");
    address carol = makeAddr("carol");
    address treasury = makeAddr("treasury");
    address platformOwner = makeAddr("platformOwner");

    uint256 constant TARGET = 10_000e6; // $10,000 USDC
    uint256 constant APY_BPS = 950; // 9.5%

    function setUp() public {
        usdc = new MockUSDC();
        factory = new RRWAFactory(address(usdc));
        marketplace = new Marketplace(address(usdc), address(factory), treasury, platformOwner);

        // fund actors
        usdc.mint(lister, 1_000_000e6);
        usdc.mint(alice, 1_000_000e6);
        usdc.mint(bob, 1_000_000e6);
        usdc.mint(carol, 1_000_000e6);
    }

    // ---- helpers ----

    function _createRaise() internal returns (Raise raise) {
        vm.prank(lister);
        address addr = factory.createRaise(TARGET, APY_BPS, "2BHK Apartment Jaipur", "RRWA-JAI");
        raise = Raise(addr);
    }

    function _depositRent(Raise raise) internal {
        uint256 rent = raise.requiredRent();
        vm.startPrank(lister);
        usdc.approve(address(raise.rentVault()), rent);
        raise.depositRent();
        vm.stopPrank();
    }

    function _fund(Raise raise, address funder, uint256 amount) internal {
        vm.startPrank(funder);
        usdc.approve(address(raise), amount);
        raise.fund(amount);
        vm.stopPrank();
    }

    // ---- lifecycle ----

    function test_FullRaiseLifecycle() public {
        Raise raise = _createRaise();

        // rent = 10000 * 950 * 3 / 10000 = 2850 USDC
        assertEq(raise.requiredRent(), (TARGET * APY_BPS * 3) / 10000);
        _depositRent(raise);
        assertTrue(raise.rentVault().funded());

        // partial funding keeps state Raising
        _fund(raise, alice, 6_000e6);
        assertEq(uint256(raise.state()), uint256(Raise.State.Raising));
        assertEq(raise.raised(), 6_000e6);
        assertEq(raise.funderCount(), 1);

        // shares minted 1:1
        assertEq(raise.shareToken().balanceOf(alice), 6_000e6);

        // second funder completes the target -> Funded
        _fund(raise, bob, 4_000e6);
        assertEq(uint256(raise.state()), uint256(Raise.State.Funded));
        assertEq(raise.raised(), TARGET);
        assertEq(raise.funderCount(), 2);

        // lister withdraws full amount -> Active
        uint256 before = usdc.balanceOf(lister);
        vm.prank(lister);
        raise.withdraw();
        assertEq(uint256(raise.state()), uint256(Raise.State.Active));
        assertEq(usdc.balanceOf(lister) - before, TARGET);
        assertTrue(raise.rentVault().active());
    }

    function test_OverfundingRejected() public {
        Raise raise = _createRaise();
        _depositRent(raise);

        _fund(raise, alice, 9_000e6);

        // trying to add more than the $1,000 remaining must revert
        vm.startPrank(bob);
        usdc.approve(address(raise), 2_000e6);
        vm.expectRevert(abi.encodeWithSelector(Raise.ExceedsTarget.selector, 1_000e6));
        raise.fund(2_000e6);
        vm.stopPrank();

        // exact remaining succeeds
        _fund(raise, bob, 1_000e6);
        assertEq(uint256(raise.state()), uint256(Raise.State.Funded));
    }

    function test_WithdrawBeforeFullRejected() public {
        Raise raise = _createRaise();
        _depositRent(raise);
        _fund(raise, alice, 9_999e6);

        vm.prank(lister);
        vm.expectRevert(Raise.NotFunded.selector);
        raise.withdraw();
    }

    function test_OnlyListerCanWithdraw() public {
        Raise raise = _createRaise();
        _depositRent(raise);
        _fund(raise, alice, TARGET);

        vm.prank(alice);
        vm.expectRevert(Raise.OnlyLister.selector);
        raise.withdraw();
    }

    // ---- yield math ----

    function test_YieldMath_SingleHolder() public {
        Raise raise = _createRaise();
        _depositRent(raise);
        _fund(raise, alice, TARGET); // alice owns 100% of shares
        vm.prank(lister);
        raise.withdraw();

        RentVault vault = raise.rentVault();
        uint256 duration = vault.DURATION();
        uint256 totalRent = vault.totalRent();

        // warp halfway through the stream
        vm.warp(block.timestamp + duration / 2);

        uint256 earned = vault.earned(alice);
        // alice should have ~half the total rent (rounding via per-second rate)
        uint256 expected = (vault.rentRate() * (duration / 2));
        assertApproxEqAbs(earned, expected, 1e6);
        assertApproxEqRel(earned, totalRent / 2, 0.01e18);

        // claim pulls USDC
        uint256 before = usdc.balanceOf(alice);
        vm.prank(alice);
        vault.claimYield();
        assertApproxEqAbs(usdc.balanceOf(alice) - before, expected, 1e6);
    }

    function test_YieldMath_ProRataSplit() public {
        Raise raise = _createRaise();
        _depositRent(raise);
        _fund(raise, alice, 7_500e6); // 75%
        _fund(raise, bob, 2_500e6); // 25%
        vm.prank(lister);
        raise.withdraw();

        RentVault vault = raise.rentVault();
        vm.warp(block.timestamp + vault.DURATION());

        uint256 aliceEarned = vault.earned(alice);
        uint256 bobEarned = vault.earned(bob);

        // alice earns ~3x bob
        assertApproxEqRel(aliceEarned, bobEarned * 3, 0.01e18);

        // combined they earn ~all the rent
        assertApproxEqRel(aliceEarned + bobEarned, vault.totalRent(), 0.001e18);
    }

    function test_YieldStopsAtMaturity() public {
        Raise raise = _createRaise();
        _depositRent(raise);
        _fund(raise, alice, TARGET);
        vm.prank(lister);
        raise.withdraw();

        RentVault vault = raise.rentVault();
        // warp well past the term
        vm.warp(block.timestamp + vault.DURATION() + 365 days);

        uint256 earned = vault.earned(alice);
        // capped at total rent (rate * duration), not more
        assertLe(earned, vault.totalRent());
        assertApproxEqRel(earned, vault.totalRent(), 0.001e18);
    }

    // ---- marketplace 50% early-exit fee ----

    function test_EarlyExitFeeSplit_50_50() public {
        Raise raise = _createRaise();
        _depositRent(raise);
        _fund(raise, alice, TARGET);
        vm.prank(lister);
        raise.withdraw(); // Active, not matured

        ShareToken share = raise.shareToken();
        uint256 sellAmount = 1_000e6;
        uint256 price = 1_000e6;

        // alice lists 1000 shares for $1000
        vm.startPrank(alice);
        share.approve(address(marketplace), sellAmount);
        uint256 id = marketplace.list(address(raise), sellAmount, price);
        vm.stopPrank();

        (, uint256 fee, uint256 toSeller, bool matured) = marketplace.quote(id);
        assertFalse(matured);
        assertEq(fee, price / 2);
        assertEq(toSeller, price / 2);

        uint256 sellerBefore = usdc.balanceOf(alice);
        uint256 treasuryBefore = usdc.balanceOf(treasury);

        // bob buys
        vm.startPrank(bob);
        usdc.approve(address(marketplace), price);
        marketplace.buy(id);
        vm.stopPrank();

        // 50/50 split
        assertEq(usdc.balanceOf(alice) - sellerBefore, price / 2);
        assertEq(usdc.balanceOf(treasury) - treasuryBefore, price / 2);
        // shares delivered to bob
        assertEq(share.balanceOf(bob), sellAmount);
    }

    function test_NoFeeAfterMaturity() public {
        Raise raise = _createRaise();
        _depositRent(raise);
        _fund(raise, alice, TARGET);
        vm.prank(lister);
        raise.withdraw();

        RentVault vault = raise.rentVault();
        ShareToken share = raise.shareToken();

        uint256 sellAmount = 1_000e6;
        uint256 price = 1_000e6;

        vm.startPrank(alice);
        share.approve(address(marketplace), sellAmount);
        uint256 id = marketplace.list(address(raise), sellAmount, price);
        vm.stopPrank();

        // warp past maturity
        vm.warp(block.timestamp + vault.DURATION() + 1);

        (, uint256 fee, uint256 toSeller, bool matured) = marketplace.quote(id);
        assertTrue(matured);
        assertEq(fee, 0);
        assertEq(toSeller, price);

        uint256 sellerBefore = usdc.balanceOf(alice);
        uint256 treasuryBefore = usdc.balanceOf(treasury);

        vm.startPrank(bob);
        usdc.approve(address(marketplace), price);
        marketplace.buy(id);
        vm.stopPrank();

        // seller gets everything, treasury nothing
        assertEq(usdc.balanceOf(alice) - sellerBefore, price);
        assertEq(usdc.balanceOf(treasury) - treasuryBefore, 0);
    }

    function test_CancelListingReturnsShares() public {
        Raise raise = _createRaise();
        _depositRent(raise);
        _fund(raise, alice, TARGET);
        vm.prank(lister);
        raise.withdraw();

        ShareToken share = raise.shareToken();
        uint256 sellAmount = 1_000e6;

        vm.startPrank(alice);
        share.approve(address(marketplace), sellAmount);
        uint256 id = marketplace.list(address(raise), sellAmount, 1_000e6);
        assertEq(share.balanceOf(address(marketplace)), sellAmount);
        marketplace.cancel(id);
        vm.stopPrank();

        assertEq(share.balanceOf(alice), TARGET);
        assertEq(share.balanceOf(address(marketplace)), 0);
    }

    // ---- factory registry ----

    function test_FactoryRegistry() public {
        Raise r1 = _createRaise();
        Raise r2 = _createRaise();
        assertEq(factory.raisesCount(), 2);
        assertTrue(factory.isRaise(address(r1)));
        assertTrue(factory.isRaise(address(r2)));

        address[] memory page = factory.getRaises(0, 10);
        assertEq(page.length, 2);
        assertEq(page[0], address(r1));
        assertEq(page[1], address(r2));
    }

    function test_ZeroTargetRejected() public {
        vm.prank(lister);
        vm.expectRevert(RRWAFactory.ZeroTarget.selector);
        factory.createRaise(0, APY_BPS, "X", "X");
    }

    // ---- yield survives share transfer ----

    function test_YieldAccountingAcrossTransfer() public {
        Raise raise = _createRaise();
        _depositRent(raise);
        _fund(raise, alice, TARGET);
        vm.prank(lister);
        raise.withdraw();

        RentVault vault = raise.rentVault();
        ShareToken share = raise.shareToken();

        // stream for a quarter
        vm.warp(block.timestamp + vault.DURATION() / 4);
        uint256 aliceEarnedBefore = vault.earned(alice);
        assertGt(aliceEarnedBefore, 0);

        // alice transfers half her shares to carol
        vm.prank(alice);
        share.transfer(carol, TARGET / 2);

        // alice's already-accrued yield is preserved
        assertApproxEqAbs(vault.earned(alice), aliceEarnedBefore, 1e6);
        // carol starts at zero accrued
        assertEq(vault.earned(carol), 0);

        // stream another quarter: they now split new yield 50/50
        vm.warp(block.timestamp + vault.DURATION() / 4);
        uint256 aliceDelta = vault.earned(alice) - aliceEarnedBefore;
        uint256 carolEarned = vault.earned(carol);
        assertApproxEqRel(aliceDelta, carolEarned, 0.01e18);
    }
}

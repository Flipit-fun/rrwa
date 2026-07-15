// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Test } from "forge-std/Test.sol";
import { MockUSDC } from "./mocks/MockUSDC.sol";
import { RRWAFactory } from "../src/RRWAFactory.sol";
import { Raise } from "../src/Raise.sol";
import { ShareToken } from "../src/ShareToken.sol";
import { RentVault } from "../src/RentVault.sol";
import { Marketplace } from "../src/Marketplace.sol";

/**
 * @notice One continuous end-to-end journey through the whole protocol, in the
 *         order a real deployment would experience it. Unlike the unit tests
 *         (which isolate each rule), this walks a single asset from listing to
 *         maturity, asserting state + balances at every step — including the
 *         time-dependent behavior (yield accrual, maturity fee waiver) that a
 *         manual mainnet test can't exercise because you can't fast-forward
 *         three years on a live chain.
 */
contract FullJourneyTest is Test {
    MockUSDC usdc;
    RRWAFactory factory;
    Marketplace marketplace;

    address lister = makeAddr("lister");
    address alice = makeAddr("alice"); // funder 1
    address bob = makeAddr("bob"); // funder 2
    address carol = makeAddr("carol"); // secondary buyer (early)
    address dave = makeAddr("dave"); // secondary buyer (after maturity)
    address treasury = makeAddr("treasury");
    address owner = makeAddr("owner");

    uint256 constant TARGET = 20_000e6; // $20,000
    uint256 constant APY_BPS = 1000; // 10%

    // Shared across journey steps to keep any single function's stack shallow.
    Raise raise;
    ShareToken share;
    RentVault vault;
    uint256 rent;
    uint256 streamStart;
    uint256 aliceYear1;

    function setUp() public {
        usdc = new MockUSDC();
        factory = new RRWAFactory(address(usdc));
        marketplace =
            new Marketplace(address(usdc), address(factory), treasury, owner);

        usdc.mint(lister, 1_000_000e6);
        usdc.mint(alice, 1_000_000e6);
        usdc.mint(bob, 1_000_000e6);
        usdc.mint(carol, 1_000_000e6);
        usdc.mint(dave, 1_000_000e6);
    }

    function test_FullJourney_ListToMaturity() public {
        _step1_createRaise();
        _step2_secureRent();
        _step3_fundToTarget();
        _step4_withdraw();
        _step5_accrueAndClaimYearOne();
        _step6_earlySaleWithFee();
        _step7_matureAndDrainYield();
        _step8_postMaturityNoFee();
    }

    // STEP 1 — Lister creates a raise via the factory.
    function _step1_createRaise() internal {
        vm.prank(lister);
        address raiseAddr =
            factory.createRaise(TARGET, APY_BPS, "Office Floor, Noida", "RRWA-NOI");
        raise = Raise(raiseAddr);
        share = raise.shareToken();
        vault = raise.rentVault();

        assertEq(factory.raisesCount(), 1);
        assertTrue(factory.isRaise(raiseAddr));
        assertEq(uint256(raise.state()), uint256(Raise.State.Raising));
    }

    // STEP 2 — Lister secures 3 years of rent upfront.
    //          rent = 20000 * 1000 * 3 / 10000 = 6000 USDC
    function _step2_secureRent() internal {
        rent = raise.requiredRent();
        assertEq(rent, 6_000e6);

        vm.startPrank(lister);
        usdc.approve(address(vault), rent);
        raise.depositRent();
        vm.stopPrank();

        assertTrue(vault.funded());
        assertEq(usdc.balanceOf(address(vault)), rent);
    }

    // STEP 3 — Two funders contribute until the target is hit.
    function _step3_fundToTarget() internal {
        // Alice funds $12,000 (60%)
        vm.startPrank(alice);
        usdc.approve(address(raise), 12_000e6);
        raise.fund(12_000e6);
        vm.stopPrank();

        assertEq(uint256(raise.state()), uint256(Raise.State.Raising));
        assertEq(raise.raised(), 12_000e6);
        assertEq(share.balanceOf(alice), 12_000e6); // 1:1 shares

        // A late funder cannot overfund: only $8,000 remains.
        vm.startPrank(bob);
        usdc.approve(address(raise), 10_000e6);
        vm.expectRevert(abi.encodeWithSelector(Raise.ExceedsTarget.selector, 8_000e6));
        raise.fund(10_000e6);
        // Bob funds exactly the remaining $8,000 (40%).
        raise.fund(8_000e6);
        vm.stopPrank();

        assertEq(uint256(raise.state()), uint256(Raise.State.Funded));
        assertEq(raise.raised(), TARGET);
        assertEq(raise.funderCount(), 2);
        assertEq(share.balanceOf(bob), 8_000e6);
        assertEq(share.totalSupply(), TARGET);
    }

    // STEP 4 — Lister withdraws the full amount (no partial). State -> Active.
    function _step4_withdraw() internal {
        uint256 listerBefore = usdc.balanceOf(lister);
        vm.prank(lister);
        raise.withdraw();

        assertEq(uint256(raise.state()), uint256(Raise.State.Active));
        assertEq(usdc.balanceOf(lister) - listerBefore, TARGET);
        assertTrue(vault.active());
        assertEq(vault.totalShares(), TARGET);

        streamStart = block.timestamp;
    }

    // STEP 5 — Yield accrues over time, pro-rata. Warp one year in.
    function _step5_accrueAndClaimYearOne() internal {
        vm.warp(streamStart + 365 days);

        aliceYear1 = vault.earned(alice);
        uint256 bobYear1 = vault.earned(bob);

        // ~1/3 of total rent streamed after 1 of 3 years.
        assertApproxEqRel(aliceYear1 + bobYear1, rent / 3, 0.01e18);
        // Alice (60%) earns ~1.5x Bob (40%).
        assertApproxEqRel(aliceYear1, (bobYear1 * 3) / 2, 0.01e18);

        // Alice claims her year-1 yield.
        uint256 aliceUsdcBefore = usdc.balanceOf(alice);
        vm.prank(alice);
        vault.claimYield();
        assertApproxEqAbs(usdc.balanceOf(alice) - aliceUsdcBefore, aliceYear1, 1e6);
        assertEq(vault.earned(alice), 0);
    }

    // STEP 6 — Alice sells part of her position early. Early exit => 50% fee.
    function _step6_earlySaleWithFee() internal {
        uint256 sellShares = 2_000e6;
        uint256 askPrice = 2_000e6;

        vm.startPrank(alice);
        share.approve(address(marketplace), sellShares);
        uint256 listingId = marketplace.list(address(raise), sellShares, askPrice);
        vm.stopPrank();

        assertEq(share.balanceOf(address(marketplace)), sellShares);

        (, uint256 fee, uint256 toSeller, bool matured) = marketplace.quote(listingId);
        assertFalse(matured);
        assertEq(fee, askPrice / 2);
        assertEq(toSeller, askPrice / 2);

        uint256 aliceProceedsBefore = usdc.balanceOf(alice);
        uint256 treasuryBefore = usdc.balanceOf(treasury);

        vm.startPrank(carol);
        usdc.approve(address(marketplace), askPrice);
        marketplace.buy(listingId);
        vm.stopPrank();

        // 50/50 split, shares delivered to carol
        assertEq(usdc.balanceOf(alice) - aliceProceedsBefore, askPrice / 2);
        assertEq(usdc.balanceOf(treasury) - treasuryBefore, askPrice / 2);
        assertEq(share.balanceOf(carol), sellShares);
        assertEq(share.balanceOf(address(marketplace)), 0);

        // Carol now accrues yield going forward; warp another year.
        vm.warp(block.timestamp + 365 days);
        assertGt(vault.earned(carol), 0);
    }

    // STEP 7 — Fast-forward past the full 3-year term. Yield caps at total.
    function _step7_matureAndDrainYield() internal {
        vm.warp(streamStart + vault.DURATION() + 30 days);

        uint256 aliceFinal = vault.earned(alice);
        uint256 bobFinal = vault.earned(bob);
        uint256 carolFinal = vault.earned(carol);

        vm.prank(alice);
        vault.claimYield();
        vm.prank(bob);
        vault.claimYield();
        vm.prank(carol);
        vault.claimYield();

        // Sum of all yield ever paid ~= total rent (within rounding dust).
        uint256 totalPaid = aliceYear1 + aliceFinal + bobFinal + carolFinal;
        assertApproxEqRel(totalPaid, rent, 0.001e18);
        // Vault drained to (near) zero.
        assertLe(usdc.balanceOf(address(vault)), 1e6);
    }

    // STEP 8 — After maturity, secondary sales carry NO fee.
    function _step8_postMaturityNoFee() internal {
        raise.markMatured();
        assertEq(uint256(raise.state()), uint256(Raise.State.Matured));

        uint256 bobSell = 3_000e6;
        uint256 bobAsk = 3_000e6;
        vm.startPrank(bob);
        share.approve(address(marketplace), bobSell);
        uint256 matureListing = marketplace.list(address(raise), bobSell, bobAsk);
        vm.stopPrank();

        (, uint256 fee2, uint256 toSeller2, bool matured2) = marketplace.quote(matureListing);
        assertTrue(matured2);
        assertEq(fee2, 0);
        assertEq(toSeller2, bobAsk);

        uint256 bobBefore = usdc.balanceOf(bob);
        uint256 treasuryBefore2 = usdc.balanceOf(treasury);

        vm.startPrank(dave);
        usdc.approve(address(marketplace), bobAsk);
        marketplace.buy(matureListing);
        vm.stopPrank();

        // Seller keeps 100%, treasury gets nothing post-maturity.
        assertEq(usdc.balanceOf(bob) - bobBefore, bobAsk);
        assertEq(usdc.balanceOf(treasury) - treasuryBefore2, 0);
        assertEq(share.balanceOf(dave), bobSell);
    }
}

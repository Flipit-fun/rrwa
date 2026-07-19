// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Test } from "forge-std/Test.sol";
import { MockUSDC } from "./mocks/MockUSDC.sol";
import { Allowlist } from "../src/Allowlist.sol";
import { YieldPool } from "../src/YieldPool.sol";

contract YieldPoolTest is Test {
    MockUSDC usdc;
    Allowlist allowlist;
    YieldPool pool;

    address owner = makeAddr("owner");
    address treasury = makeAddr("treasury");
    address alice = makeAddr("alice");
    address bob = makeAddr("bob");

    uint256 constant APY_BPS = 1200; // 12%

    function setUp() public {
        usdc = new MockUSDC();
        allowlist = new Allowlist(owner);
        pool = new YieldPool(address(usdc), address(allowlist), treasury, APY_BPS, owner);

        usdc.mint(alice, 1_000_000e6);
        usdc.mint(bob, 1_000_000e6);
        usdc.mint(treasury, 1_000_000e6);

        vm.prank(treasury);
        usdc.approve(address(pool), type(uint256).max);
    }

    function test_RestrictedByDefault() public {
        assertTrue(allowlist.restricted());

        vm.startPrank(alice);
        usdc.approve(address(pool), 1_000e6);
        vm.expectRevert(YieldPool.NotAllowlisted.selector);
        pool.deposit(1_000e6);
        vm.stopPrank();
    }

    function test_AllowlistedDepositAndWithdraw() public {
        vm.prank(owner);
        allowlist.setAllowed(alice, true);

        vm.startPrank(alice);
        usdc.approve(address(pool), 10_000e6);
        pool.deposit(10_000e6);
        vm.stopPrank();

        assertEq(pool.principalOf(alice), 10_000e6);
        assertEq(pool.totalPrincipal(), 10_000e6);

        vm.prank(alice);
        pool.withdraw(4_000e6);
        assertEq(pool.principalOf(alice), 6_000e6);
        assertEq(usdc.balanceOf(alice), 1_000_000e6 - 6_000e6);
    }

    function test_FlatTwelvePercentApyOverOneYear() public {
        vm.prank(owner);
        allowlist.setAllowed(alice, true);

        vm.startPrank(alice);
        usdc.approve(address(pool), 10_000e6);
        pool.deposit(10_000e6);
        vm.stopPrank();

        vm.warp(block.timestamp + 365 days);

        uint256 earned = pool.earned(alice);
        // 12% of 10,000 over exactly one year = 1,200
        assertApproxEqAbs(earned, 1_200e6, 1e6);

        uint256 aliceBefore = usdc.balanceOf(alice);
        uint256 treasuryBefore = usdc.balanceOf(treasury);
        vm.prank(alice);
        pool.claimYield();

        assertApproxEqAbs(usdc.balanceOf(alice) - aliceBefore, 1_200e6, 1e6);
        assertApproxEqAbs(treasuryBefore - usdc.balanceOf(treasury), 1_200e6, 1e6);
        assertEq(pool.earned(alice), 0);
    }

    function test_WithdrawMoreThanPrincipalReverts() public {
        vm.prank(owner);
        allowlist.setAllowed(alice, true);

        vm.startPrank(alice);
        usdc.approve(address(pool), 1_000e6);
        pool.deposit(1_000e6);
        vm.expectRevert(YieldPool.InsufficientPrincipal.selector);
        pool.withdraw(2_000e6);
        vm.stopPrank();
    }

    function test_TwoDepositorsAccrueIndependently() public {
        vm.startPrank(owner);
        allowlist.setAllowed(alice, true);
        allowlist.setAllowed(bob, true);
        vm.stopPrank();

        vm.startPrank(alice);
        usdc.approve(address(pool), 10_000e6);
        pool.deposit(10_000e6);
        vm.stopPrank();

        vm.warp(block.timestamp + 180 days);

        vm.startPrank(bob);
        usdc.approve(address(pool), 5_000e6);
        pool.deposit(5_000e6);
        vm.stopPrank();

        vm.warp(block.timestamp + 185 days);

        // alice: ~12% of 10,000 for a full year
        assertApproxEqRel(pool.earned(alice), 1_200e6, 0.01e18);
        // bob: ~12% of 5,000 for ~185 days
        uint256 bobExpected = (5_000e6 * APY_BPS * 185 days) / (10000 * 365 days);
        assertApproxEqRel(pool.earned(bob), bobExpected, 0.01e18);
    }

    function test_RestrictedToggleOff() public {
        vm.prank(owner);
        allowlist.setRestricted(false);

        vm.startPrank(alice);
        usdc.approve(address(pool), 1_000e6);
        pool.deposit(1_000e6); // no explicit approval needed now
        vm.stopPrank();

        assertEq(pool.principalOf(alice), 1_000e6);
    }

    function test_OnlyOwnerCanManageAllowlist() public {
        vm.prank(alice);
        vm.expectRevert();
        allowlist.setAllowed(bob, true);
    }
}

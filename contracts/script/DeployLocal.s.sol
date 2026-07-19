// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Script, console2 } from "forge-std/Script.sol";
import { MockUSDC } from "../test/mocks/MockUSDC.sol";
import { RRWAFactory } from "../src/RRWAFactory.sol";
import { Marketplace } from "../src/Marketplace.sol";
import { Raise } from "../src/Raise.sol";
import { Allowlist } from "../src/Allowlist.sol";

/**
 * @notice Local-only deploy + seed for Anvil. Deploys a MockUSDC, the Factory
 *         and Marketplace, mints test USDC to the deployer, and creates a few
 *         sample raises (one funded + active, some still raising) so the app's
 *         /market page renders live data immediately.
 *
 * Run against a running anvil:
 *   forge script script/DeployLocal.s.sol:DeployLocal \
 *     --rpc-url http://127.0.0.1:8545 --broadcast \
 *     --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
 *
 * (that key is Anvil's default account #0 — local only, never use elsewhere)
 */
contract DeployLocal is Script {
    // Anvil default accounts (deterministic).
    uint256 constant PK0 =
        0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;

    function run() external {
        address deployer = vm.addr(PK0);

        vm.startBroadcast(PK0);

        // 1. Mock USDC (6 decimals) + mint a large balance to the deployer.
        MockUSDC usdc = new MockUSDC();
        usdc.mint(deployer, 5_000_000e6);

        // 2. Core protocol.
        Allowlist allowlist = new Allowlist(deployer);
        // Local/dev convenience only: open the gate so any anvil account can
        // fund a raise without a manual allowlist step. Mainnet deploys
        // (Deploy.s.sol) leave `restricted` at its default of true.
        allowlist.setRestricted(false);

        RRWAFactory factory = new RRWAFactory(address(usdc), address(allowlist));
        Marketplace marketplace =
            new Marketplace(address(usdc), address(factory), deployer, deployer);

        // The pooled-yield product has no contract — deposits are plain
        // USDG transfers to the treasury wallet, and withdrawals/yield are
        // paid out manually. Nothing to deploy for it here.

        // 3. Seed sample raises.
        // (a) A raise we fully fund + activate so yield + secondary market work.
        address activeRaise = _createAndActivate(
            factory,
            usdc,
            deployer,
            "2BR Apartment, Los Angeles",
            "RRWA-LAX",
            10_000e6,
            950 // 9.5%
        );

        // (b) A couple of raises still open for funding.
        _createOpen(factory, usdc, deployer, "Retail Shopfront, London", "RRWA-LDN", 25_000e6, 1100);
        _createOpen(factory, usdc, deployer, "Warehouse Unit, Rotterdam", "RRWA-RTM", 40_000e6, 1240);
        // Partially fund one of them for a nicer progress bar.
        address farm =
            _createOpen(factory, usdc, deployer, "Farm Plot, Fresno", "RRWA-FRS", 10_000e6, 1010);
        _depositRentAndFund(farm, usdc, 8_800e6);

        vm.stopBroadcast();

        console2.log("=== RRWA local deployment ===");
        console2.log("MockUSDC:            ", address(usdc));
        console2.log("Allowlist:           ", address(allowlist));
        console2.log("RRWAFactory:         ", address(factory));
        console2.log("Marketplace:         ", address(marketplace));
        console2.log("Treasury (deployer): ", deployer);
        console2.log("Sample active raise: ", activeRaise);
        console2.log("Total raises:        ", factory.raisesCount());
    }

    function _createOpen(
        RRWAFactory factory,
        MockUSDC usdc,
        address deployer,
        string memory name,
        string memory symbol,
        uint256 target,
        uint256 apyBps
    ) internal returns (address raiseAddr) {
        raiseAddr = factory.createRaise(target, apyBps, name, symbol, 0, 0);
        Raise raise = Raise(raiseAddr);
        // secure rent so the raise is genuinely live
        uint256 rent = raise.requiredRent();
        usdc.approve(address(raise.rentVault()), rent);
        raise.depositRent();
    }

    function _depositRentAndFund(address raiseAddr, MockUSDC usdc, uint256 amount) internal {
        Raise raise = Raise(raiseAddr);
        usdc.approve(raiseAddr, amount);
        raise.fund(amount);
    }

    function _createAndActivate(
        RRWAFactory factory,
        MockUSDC usdc,
        address deployer,
        string memory name,
        string memory symbol,
        uint256 target,
        uint256 apyBps
    ) internal returns (address raiseAddr) {
        raiseAddr = _createOpen(factory, usdc, deployer, name, symbol, target, apyBps);
        Raise raise = Raise(raiseAddr);
        // fully fund then withdraw -> Active, yield streaming
        usdc.approve(raiseAddr, target);
        raise.fund(target);
        raise.withdraw();
    }
}

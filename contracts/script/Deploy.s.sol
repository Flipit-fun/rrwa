// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Script, console2 } from "forge-std/Script.sol";
import { RRWAFactory } from "../src/RRWAFactory.sol";
import { Marketplace } from "../src/Marketplace.sol";
import { Allowlist } from "../src/Allowlist.sol";
import { YieldPool } from "../src/YieldPool.sol";

/**
 * @notice Deploys the RRWA core: Allowlist + Factory + Marketplace + the
 *         main YieldPool product (flat 12% APY on USDG deposits).
 *
 * Required env:
 *   PRIVATE_KEY      deployer key (0x...)
 *   USDC_ADDRESS     USDG token on the target chain
 *   TREASURY_ADDRESS platform treasury (receives early-exit fees, pays pool yield)
 *
 * Run:
 *   forge script script/Deploy.s.sol:Deploy \
 *     --rpc-url $RPC_URL --broadcast --private-key $PRIVATE_KEY
 */
contract Deploy is Script {
    uint256 constant POOL_APY_BPS = 1200; // 12%

    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address usdc = vm.envAddress("USDC_ADDRESS");
        address treasury = vm.envAddress("TREASURY_ADDRESS");
        address owner = vm.addr(pk);

        vm.startBroadcast(pk);

        Allowlist allowlist = new Allowlist(owner);
        RRWAFactory factory = new RRWAFactory(usdc, address(allowlist));
        Marketplace marketplace =
            new Marketplace(usdc, address(factory), treasury, owner);
        YieldPool pool =
            new YieldPool(usdc, address(allowlist), treasury, POOL_APY_BPS, owner);

        vm.stopBroadcast();

        console2.log("Allowlist:  ", address(allowlist));
        console2.log("RRWAFactory:", address(factory));
        console2.log("Marketplace:", address(marketplace));
        console2.log("YieldPool:  ", address(pool));
        console2.log("USDC:       ", usdc);
        console2.log("Treasury:   ", treasury);
    }
}

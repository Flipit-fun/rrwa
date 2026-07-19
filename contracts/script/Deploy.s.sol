// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Script, console2 } from "forge-std/Script.sol";
import { RRWAFactory } from "../src/RRWAFactory.sol";
import { Marketplace } from "../src/Marketplace.sol";
import { Allowlist } from "../src/Allowlist.sol";

/**
 * @notice Deploys the RRWA core: Allowlist + Factory + Marketplace.
 *
 *         The pooled-yield product has no contract — depositing means
 *         sending USDG directly to the treasury wallet, and withdrawals /
 *         yield payouts are handled manually by the RRWA team from that
 *         same wallet. Nothing to deploy for that part.
 *
 * Required env:
 *   PRIVATE_KEY      deployer key (0x...)
 *   USDC_ADDRESS     USDG token on the target chain
 *   TREASURY_ADDRESS platform treasury (receives early-exit fees; also the
 *                    pool's deposit destination)
 *
 * Run:
 *   forge script script/Deploy.s.sol:Deploy \
 *     --rpc-url $RPC_URL --broadcast --private-key $PRIVATE_KEY
 */
contract Deploy is Script {
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

        vm.stopBroadcast();

        console2.log("Allowlist:  ", address(allowlist));
        console2.log("RRWAFactory:", address(factory));
        console2.log("Marketplace:", address(marketplace));
        console2.log("USDC:       ", usdc);
        console2.log("Treasury:   ", treasury);
    }
}

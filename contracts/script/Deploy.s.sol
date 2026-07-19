// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Script, console2 } from "forge-std/Script.sol";
import { RRWAFactory } from "../src/RRWAFactory.sol";
import { Marketplace } from "../src/Marketplace.sol";

/**
 * @notice Deploys the RRWA core: Factory + Marketplace. Investing in a
 *         raise is open to anyone — there is no allowlist/KYC gate.
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

        RRWAFactory factory = new RRWAFactory(usdc);
        Marketplace marketplace =
            new Marketplace(usdc, address(factory), treasury, owner);

        vm.stopBroadcast();

        console2.log("RRWAFactory:", address(factory));
        console2.log("Marketplace:", address(marketplace));
        console2.log("USDC:       ", usdc);
        console2.log("Treasury:   ", treasury);
    }
}

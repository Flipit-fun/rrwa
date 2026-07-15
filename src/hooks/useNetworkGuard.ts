"use client";

import { useAccount, useSwitchChain } from "wagmi";
import { CHAIN_ID } from "@/lib/chain";

/**
 * Reports wallet connection + correct-network status and exposes a switch
 * action. Pages use this to gate write actions behind "Connect wallet" and
 * "Switch to Robinhood Chain".
 */
export function useNetworkGuard() {
  const { isConnected, chainId } = useAccount();
  const { switchChain, isPending: switching } = useSwitchChain();

  const wrongNetwork = isConnected && chainId !== CHAIN_ID;

  return {
    isConnected,
    wrongNetwork,
    switching,
    switchToChain: () => switchChain({ chainId: CHAIN_ID }),
    ready: isConnected && !wrongNetwork,
  };
}

import { defineChain } from "viem";

function readEnv(value: string | undefined): string {
  // Missing values are expected before `.env` is filled in. The UI degrades to
  // a "configuration needed" state via isChainConfigured()/areContractsConfigured(),
  // so we don't log a scary error here.
  if (!value || value.trim() === "") return "";
  return value;
}

const envChainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? "0");
const envRpcUrl = readEnv(process.env.NEXT_PUBLIC_RPC_URL);
const chainName = process.env.NEXT_PUBLIC_CHAIN_NAME ?? "Robinhood Chain";
const nativeSymbol = process.env.NEXT_PUBLIC_NATIVE_SYMBOL ?? "ETH";
const nativeDecimals = Number(process.env.NEXT_PUBLIC_NATIVE_DECIMALS ?? "18");
const explorerUrl = process.env.NEXT_PUBLIC_EXPLORER_URL ?? "";

// Fallbacks so the wagmi/viem client is always *constructable*, even before
// `.env` is filled in. When these fallbacks are in use, `isChainConfigured()`
// returns false and the UI shows a "configuration needed" state instead of
// attempting (and failing) real chain reads.
const FALLBACK_CHAIN_ID = 31337; // local anvil default
const FALLBACK_RPC_URL = "http://127.0.0.1:8545";

const chainId = envChainId > 0 ? envChainId : FALLBACK_CHAIN_ID;
const rpcUrl = envRpcUrl || FALLBACK_RPC_URL;

/** Custom viem chain object for Robinhood Chain, driven by env with fallbacks. */
export const robinhoodChain = defineChain({
  id: chainId,
  name: chainName,
  nativeCurrency: {
    name: nativeSymbol,
    symbol: nativeSymbol,
    decimals: nativeDecimals,
  },
  rpcUrls: {
    default: { http: [rpcUrl] },
    public: { http: [rpcUrl] },
  },
  blockExplorers: explorerUrl
    ? { default: { name: `${chainName} Explorer`, url: explorerUrl } }
    : undefined,
});

export const CHAIN_ID = chainId;

/** True when the minimum chain config needed to talk to the network is present. */
export function isChainConfigured(): boolean {
  return envChainId > 0 && !!envRpcUrl;
}

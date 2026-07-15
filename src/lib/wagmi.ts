"use client";

import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { cookieStorage, createStorage } from "wagmi";
import { robinhoodChain } from "./chain";

const projectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "RRWA_PLACEHOLDER";

export const wagmiConfig = getDefaultConfig({
  appName: "RRWA — Robin Real World Assets",
  projectId,
  chains: [robinhoodChain],
  ssr: true,
  // Cookie storage lets us hydrate wallet state on the server without the
  // prerender crashing, and keeps connection state across reloads.
  storage: createStorage({ storage: cookieStorage }),
});

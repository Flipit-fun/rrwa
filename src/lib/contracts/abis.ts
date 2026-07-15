/**
 * Hand-written ABIs matching /contracts. Kept in `as const` form so viem/wagmi
 * infer argument and return types. If you change a contract signature, update
 * the matching entry here (or regenerate from `forge inspect <C> abi`).
 */

export const factoryAbi = [
  {
    type: "function",
    name: "createRaise",
    stateMutability: "nonpayable",
    inputs: [
      { name: "target", type: "uint256" },
      { name: "apyBps", type: "uint256" },
      { name: "assetName", type: "string" },
      { name: "shareSymbol", type: "string" },
    ],
    outputs: [{ name: "raiseAddr", type: "address" }],
  },
  {
    type: "function",
    name: "allRaises",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address[]" }],
  },
  {
    type: "function",
    name: "raisesCount",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "getRaises",
    stateMutability: "view",
    inputs: [
      { name: "offset", type: "uint256" },
      { name: "limit", type: "uint256" },
    ],
    outputs: [{ name: "page", type: "address[]" }],
  },
  {
    type: "function",
    name: "isRaise",
    stateMutability: "view",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "event",
    name: "RaiseCreated",
    inputs: [
      { name: "raise", type: "address", indexed: true },
      { name: "lister", type: "address", indexed: true },
      { name: "target", type: "uint256", indexed: false },
      { name: "apyBps", type: "uint256", indexed: false },
      { name: "shareToken", type: "address", indexed: false },
      { name: "rentVault", type: "address", indexed: false },
      { name: "assetName", type: "string", indexed: false },
      { name: "shareSymbol", type: "string", indexed: false },
    ],
    anonymous: false,
  },
] as const;

export const raiseAbi = [
  {
    type: "function",
    name: "summary",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { name: "state_", type: "uint8" },
      { name: "target_", type: "uint256" },
      { name: "raised_", type: "uint256" },
      { name: "apyBps_", type: "uint256" },
      { name: "funderCount_", type: "uint256" },
      { name: "shareToken_", type: "address" },
      { name: "rentVault_", type: "address" },
      { name: "lister_", type: "address" },
    ],
  },
  {
    type: "function",
    name: "requiredRent",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "depositRent",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
  {
    type: "function",
    name: "fund",
    stateMutability: "nonpayable",
    inputs: [{ name: "amount", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "withdraw",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
  {
    type: "function",
    name: "markMatured",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
  {
    type: "function",
    name: "isMatured",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "shareToken",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "function",
    name: "rentVault",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "function",
    name: "state",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
] as const;

export const rentVaultAbi = [
  {
    type: "function",
    name: "earned",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "claimYield",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
  {
    type: "function",
    name: "totalRent",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "endTime",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "active",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "funded",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

export const shareTokenAbi = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "totalSupply",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "name",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
  {
    type: "function",
    name: "symbol",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
  {
    type: "function",
    name: "allowance",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

export const marketplaceAbi = [
  {
    type: "function",
    name: "list",
    stateMutability: "nonpayable",
    inputs: [
      { name: "raise", type: "address" },
      { name: "shareAmount", type: "uint256" },
      { name: "price", type: "uint256" },
    ],
    outputs: [{ name: "id", type: "uint256" }],
  },
  {
    type: "function",
    name: "buy",
    stateMutability: "nonpayable",
    inputs: [{ name: "id", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "cancel",
    stateMutability: "nonpayable",
    inputs: [{ name: "id", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "listingsCount",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "quote",
    stateMutability: "view",
    inputs: [{ name: "id", type: "uint256" }],
    outputs: [
      { name: "price", type: "uint256" },
      { name: "fee", type: "uint256" },
      { name: "toSeller", type: "uint256" },
      { name: "matured", type: "bool" },
    ],
  },
  {
    type: "function",
    name: "listings",
    stateMutability: "view",
    inputs: [{ name: "", type: "uint256" }],
    outputs: [
      { name: "seller", type: "address" },
      { name: "raise", type: "address" },
      { name: "shareToken", type: "address" },
      { name: "shareAmount", type: "uint256" },
      { name: "price", type: "uint256" },
      { name: "active", type: "bool" },
    ],
  },
] as const;

export const erc20Abi = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "allowance",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "decimals",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
] as const;

/** Raise state enum mirrored from Solidity. */
export enum RaiseState {
  Raising = 0,
  Funded = 1,
  Active = 2,
  Matured = 3,
}

# RRWA Contracts

Solidity 0.8.24 + Foundry. Core contracts for the Robin Real World Assets
crowdfunding marketplace.

## Contracts

| Contract       | Purpose |
| -------------- | ------- |
| `RRWAFactory`  | Deploys one `Raise` per listing and keeps an on-chain registry. |
| `Raise`        | A single asset raise. State machine: `Raising → Funded → Active → Matured`. Mints `ShareToken` 1:1 with USDC contributed. No overfunding, no partial lister withdrawals. |
| `ShareToken`   | ERC-20 per raise (6 decimals to match USDC). Notifies the vault on every transfer so streamed yield is settled before balances move. |
| `RentVault`    | Holds 3 years of rent (`target * apyBps * 3 / 10000`), streamed linearly per second to shareholders pro-rata. `claimYield()` pulls accrued USDC. |
| `Marketplace`  | Secondary market for share positions. 50% early-exit fee to treasury before maturity; 0% after. |

## Setup

Foundry is required. Install it (once) with:

```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

Then install dependencies:

```bash
cd contracts
forge install foundry-rs/forge-std --no-commit
forge install OpenZeppelin/openzeppelin-contracts --no-commit
```

## Test

```bash
forge test -vvv
```

The suite covers: full raise lifecycle, overfunding rejection,
withdraw-before-full rejection, pro-rata yield math, yield accounting across
share transfers, maturity cap, and the 50% early-exit fee split (and 0% after
maturity).

## Deploy

Set `PRIVATE_KEY`, `USDC_ADDRESS`, `TREASURY_ADDRESS`, `RPC_URL` (see the root
`.env.example`), then:

```bash
forge script script/Deploy.s.sol:Deploy --rpc-url $RPC_URL --broadcast --private-key $PRIVATE_KEY
```

Copy the printed `RRWAFactory` and `Marketplace` addresses into the app's
`.env` as `NEXT_PUBLIC_FACTORY_ADDRESS` and `NEXT_PUBLIC_MARKETPLACE_ADDRESS`.
```

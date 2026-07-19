# RRWA Contracts

Solidity 0.8.24 + Foundry. Core contracts for the Robin Real World Assets
crowdfunding marketplace.

The pooled-yield product (deposit USDG, earn a fixed APY) has **no
contract** — depositing means sending USDG directly to the treasury wallet.
Withdrawals and yield payouts are requested through the app and paid out
manually by the RRWA team from that same wallet. There is nothing to deploy
for that part; it's plain off-chain bookkeeping (see `prisma/schema.prisma`:
`PoolDeposit`, `PayoutRequest`).

## Contracts

| Contract       | Purpose |
| -------------- | ------- |
| `RRWAFactory`  | Deploys one `Raise` per listing and keeps an on-chain registry. Investing is open to anyone — no allowlist/KYC gate at the contract level. |
| `Raise`        | A single property raise. State machine: `Raising → Funded → Active → Matured`. Mints `ShareToken` 1:1 with USDC contributed. No overfunding, no partial lister withdrawals. Supports optional per-wallet `minContribution`/`maxContribution` bounds (0 means no cap). |
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
withdraw-before-full rejection, per-wallet min/max contribution bounds,
pro-rata yield math, yield accounting across share transfers, maturity cap,
and the 50% early-exit fee split (and 0% after maturity).

## Deploy

Set `PRIVATE_KEY`, `USDC_ADDRESS`, `TREASURY_ADDRESS`, `RPC_URL` (see the root
`.env.example`), then:

```bash
forge script script/Deploy.s.sol:Deploy --rpc-url $RPC_URL --broadcast --private-key $PRIVATE_KEY
```

Copy the printed addresses into the app's `.env`:
`NEXT_PUBLIC_FACTORY_ADDRESS`, `NEXT_PUBLIC_MARKETPLACE_ADDRESS`.

`TREASURY_ADDRESS` is also the pool's deposit destination — set
`NEXT_PUBLIC_TREASURY_ADDRESS` in the app to the same wallet so deposits and
early-exit fees land in the same place.

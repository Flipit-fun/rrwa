"use client";

import { useCallback } from "react";
import { useAccount } from "wagmi";
import {
  writeContract,
  waitForTransactionReceipt,
  readContract,
} from "wagmi/actions";
import { decodeEventLog, type Address } from "viem";
import { wagmiConfig } from "@/lib/wagmi";
import { factoryAbi, erc20Abi, raiseAbi } from "@/lib/contracts/abis";
import { FACTORY_ADDRESS, USDC_ADDRESS } from "@/lib/contracts/addresses";
import { useToast } from "@/components/Toast";
import { txUrl } from "@/lib/explorer";
import { humanizeError } from "./useTxFlow";
import { requiredRentDeposit } from "@/lib/format";

/**
 * Two-step listing flow:
 *   1) createRaise on the factory -> returns the new raise address (from event)
 *   2) approve USDC for the raise's RentVault, then depositRent
 *
 * The caller drives a stepper off the returned step callbacks.
 */
export function useCreateRaise() {
  const { address } = useAccount();
  const { push, update } = useToast();

  /** Step 1: create the raise. Returns the new raise address. */
  const createRaise = useCallback(
    async (params: {
      target: bigint;
      apyBps: number;
      assetName: string;
      shareSymbol: string;
    }): Promise<Address | null> => {
      if (!FACTORY_ADDRESS) return null;
      const toastId = push({
        kind: "pending",
        title: "Creating your raise",
        message: "Confirm in your wallet.",
      });
      try {
        const hash = await writeContract(wagmiConfig, {
          address: FACTORY_ADDRESS,
          abi: factoryAbi,
          functionName: "createRaise",
          args: [
            params.target,
            BigInt(params.apyBps),
            params.assetName,
            params.shareSymbol,
          ],
        });
        update(toastId, {
          message: "Submitted. Waiting for confirmation.",
          href: txUrl(hash),
        });
        const receipt = await waitForTransactionReceipt(wagmiConfig, { hash });

        // find the RaiseCreated event to get the new address
        let raiseAddr: Address | null = null;
        for (const log of receipt.logs) {
          try {
            const parsed = decodeEventLog({
              abi: factoryAbi,
              data: log.data,
              topics: log.topics,
            });
            if (parsed.eventName === "RaiseCreated") {
              raiseAddr = (parsed.args as { raise: Address }).raise;
              break;
            }
          } catch {
            // not our event; skip
          }
        }

        if (!raiseAddr) {
          // fallback: last raise in the registry belongs to us
          const all = (await readContract(wagmiConfig, {
            address: FACTORY_ADDRESS,
            abi: factoryAbi,
            functionName: "allRaises",
          })) as Address[];
          raiseAddr = all[all.length - 1] ?? null;
        }

        update(toastId, {
          kind: "success",
          title: "Raise created",
          message: "Now secure the rent to make it live.",
          href: txUrl(hash),
        });
        return raiseAddr;
      } catch (err) {
        update(toastId, {
          kind: "error",
          title: "Could not create the raise",
          message: humanizeError(err),
        });
        return null;
      }
    },
    [push, update]
  );

  /** Step 2: approve + deposit 3 years of rent into the raise's vault. */
  const depositRent = useCallback(
    async (raiseAddress: Address): Promise<boolean> => {
      if (!USDC_ADDRESS || !address) return false;

      // read the required rent + the vault address from the raise
      const rentVault = (await readContract(wagmiConfig, {
        address: raiseAddress,
        abi: raiseAbi,
        functionName: "rentVault",
      })) as Address;
      const rent = (await readContract(wagmiConfig, {
        address: raiseAddress,
        abi: raiseAbi,
        functionName: "requiredRent",
      })) as bigint;

      const toastId = push({
        kind: "pending",
        title: "Securing rent",
        message: "Approve USDC for the rent vault.",
      });

      try {
        // approve the vault to pull the rent
        const current = (await readContract(wagmiConfig, {
          address: USDC_ADDRESS,
          abi: erc20Abi,
          functionName: "allowance",
          args: [address, rentVault],
        })) as bigint;

        if (current < rent) {
          const approveHash = await writeContract(wagmiConfig, {
            address: USDC_ADDRESS,
            abi: erc20Abi,
            functionName: "approve",
            args: [rentVault, rent],
          });
          await waitForTransactionReceipt(wagmiConfig, { hash: approveHash });
        }

        update(toastId, { message: "Depositing three years of rent." });

        const depositHash = await writeContract(wagmiConfig, {
          address: raiseAddress,
          abi: raiseAbi,
          functionName: "depositRent",
        });
        update(toastId, { href: txUrl(depositHash) });
        await waitForTransactionReceipt(wagmiConfig, { hash: depositHash });

        update(toastId, {
          kind: "success",
          title: "Your asset is live",
          message: "Rent secured. Funders can contribute now.",
          href: txUrl(depositHash),
        });
        return true;
      } catch (err) {
        update(toastId, {
          kind: "error",
          title: "Could not secure rent",
          message: humanizeError(err),
        });
        return false;
      }
    },
    [address, push, update]
  );

  return { createRaise, depositRent, requiredRentDeposit };
}

"use client";

import { useCallback, useState } from "react";
import { writeContract, waitForTransactionReceipt } from "wagmi/actions";
import type { Abi, Address } from "viem";
import { wagmiConfig } from "@/lib/wagmi";
import { useToast } from "@/components/Toast";
import { txUrl } from "@/lib/explorer";

type WriteArgs = {
  address: Address;
  abi: Abi;
  functionName: string;
  args?: readonly unknown[];
};

/**
 * Runs a single contract write with pending/confirmed/error toasts styled to
 * the design system. Returns a `run` you can await; resolves true on success.
 */
export function useTxFlow() {
  const { push, update } = useToast();
  const [pending, setPending] = useState(false);

  const run = useCallback(
    async (
      tx: WriteArgs,
      labels: { pending: string; success: string }
    ): Promise<boolean> => {
      const toastId = push({
        kind: "pending",
        title: labels.pending,
        message: "Confirm in your wallet, then wait for the network.",
      });
      setPending(true);
      try {
        const hash = await writeContract(wagmiConfig, {
          address: tx.address,
          abi: tx.abi,
          functionName: tx.functionName,
          args: tx.args ?? [],
        });
        update(toastId, {
          message: "Submitted. Waiting for confirmation.",
          href: txUrl(hash),
        });
        await waitForTransactionReceipt(wagmiConfig, { hash });
        update(toastId, {
          kind: "success",
          title: labels.success,
          message: "Confirmed on chain.",
          href: txUrl(hash),
        });
        return true;
      } catch (err: unknown) {
        update(toastId, {
          kind: "error",
          title: "Transaction failed",
          message: humanizeError(err),
        });
        return false;
      } finally {
        setPending(false);
      }
    },
    [push, update]
  );

  return { run, pending };
}

/** Turn a wallet/RPC error into a short, calm, human sentence. No emoji. */
export function humanizeError(err: unknown): string {
  const msg =
    err && typeof err === "object" && "shortMessage" in err
      ? String((err as { shortMessage: unknown }).shortMessage)
      : err instanceof Error
        ? err.message
        : String(err);

  if (/user rejected|rejected the request|denied/i.test(msg)) {
    return "You rejected the request in your wallet.";
  }
  if (/insufficient funds/i.test(msg)) {
    return "Not enough balance to cover this transaction.";
  }
  if (/ExceedsTarget/i.test(msg)) {
    return "That amount would push the raise past its target.";
  }
  if (/NotFunded/i.test(msg)) {
    return "The raise isn't fully funded yet.";
  }
  // trim overly long RPC dumps
  return msg.length > 160 ? msg.slice(0, 157) + "..." : msg;
}

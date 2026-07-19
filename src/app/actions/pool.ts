"use server";

import { prisma } from "@/lib/db";
import {
  recordDepositSchema,
  payoutRequestSchema,
  type RecordDepositInput,
  type PayoutRequestInput,
} from "@/lib/validation";
import type { ActionResult } from "./assets";

/**
 * Record a USDG deposit that was sent directly to the treasury wallet (plain
 * ERC-20 transfer, no pool contract). This is purely a ledger entry — the
 * transfer itself already happened on chain by the time this is called.
 */
export async function recordDeposit(
  input: RecordDepositInput
): Promise<ActionResult<{ id: string }>> {
  const parsed = recordDepositSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    const deposit = await prisma.poolDeposit.create({
      data: {
        depositor: parsed.data.depositor.toLowerCase(),
        amountUsdc: parsed.data.amountUsdc,
        txHash: parsed.data.txHash.toLowerCase(),
      },
    });
    return { ok: true, data: { id: deposit.id } };
  } catch (err) {
    console.error("recordDeposit failed", err);
    return {
      ok: false,
      error:
        "Could not record the deposit. If you already sent the transfer, contact us with your transaction hash.",
    };
  }
}

/** Total USDG deposited by a wallet, from the off-chain deposit ledger. */
export async function getDepositTotal(depositor: string): Promise<bigint> {
  const rows = await prisma.poolDeposit.findMany({
    where: { depositor: depositor.toLowerCase() },
  });
  return rows.reduce((sum, r) => sum + BigInt(r.amountUsdc), 0n);
}

/** A wallet's deposit history, most recent first. */
export async function getDeposits(depositor: string) {
  return prisma.poolDeposit.findMany({
    where: { depositor: depositor.toLowerCase() },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Submit a withdrawal or yield-payout request. No automated payment logic —
 * the RRWA team reviews these manually and pays out from the treasury
 * wallet on their own schedule, then marks the request PAID.
 */
export async function requestPayout(
  input: PayoutRequestInput
): Promise<ActionResult<{ id: string }>> {
  const parsed = payoutRequestSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    const request = await prisma.payoutRequest.create({
      data: {
        requester: parsed.data.requester.toLowerCase(),
        kind: parsed.data.kind,
        amountUsdc: parsed.data.amountUsdc,
        note: parsed.data.note || null,
      },
    });
    return { ok: true, data: { id: request.id } };
  } catch (err) {
    console.error("requestPayout failed", err);
    return { ok: false, error: "Could not submit your request." };
  }
}

/** A wallet's payout request history, most recent first. */
export async function getPayoutRequests(requester: string) {
  return prisma.payoutRequest.findMany({
    where: { requester: requester.toLowerCase() },
    orderBy: { createdAt: "desc" },
  });
}

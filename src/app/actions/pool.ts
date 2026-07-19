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
 * Record a USDG deposit sent directly to a property's dedicated treasury
 * wallet (plain ERC-20 transfer, no pool contract). This is purely a ledger
 * entry — the transfer itself already happened on chain by the time this is
 * called. Scoped to `assetId` so each property's deposits and withdrawal
 * limit are tracked independently.
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
        assetId: parsed.data.assetId,
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

/** Total USDG a wallet has deposited into one specific property. */
export async function getDepositTotal(
  assetId: string,
  depositor: string
): Promise<bigint> {
  const rows = await prisma.poolDeposit.findMany({
    where: { assetId, depositor: depositor.toLowerCase() },
  });
  return rows.reduce((sum, r) => sum + BigInt(r.amountUsdc), 0n);
}

/** Total USDG a wallet has withdrawn (PAID only) from one specific property. */
async function getWithdrawnTotal(
  assetId: string,
  requester: string
): Promise<bigint> {
  const rows = await prisma.payoutRequest.findMany({
    where: {
      assetId,
      requester: requester.toLowerCase(),
      kind: "WITHDRAWAL",
      status: { in: ["REQUESTED", "PAID"] }, // count pending too, so they can't double-request
    },
  });
  return rows.reduce((sum, r) => sum + BigInt(r.amountUsdc), 0n);
}

/** A wallet's deposit history for one property, most recent first. */
export async function getDeposits(assetId: string, depositor: string) {
  return prisma.poolDeposit.findMany({
    where: { assetId, depositor: depositor.toLowerCase() },
    orderBy: { createdAt: "desc" },
  });
}

/** A wallet's full deposit history across every property, most recent first. */
export async function getAllDeposits(depositor: string) {
  return prisma.poolDeposit.findMany({
    where: { depositor: depositor.toLowerCase() },
    include: {
      asset: { select: { id: true, name: true, city: true, region: true, apyBps: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Submit a withdrawal or yield-payout request against one property. No
 * automated payment logic — the RRWA team reviews these manually and pays
 * out from that property's treasury wallet on their own schedule, then
 * marks the request PAID. A withdrawal can never exceed what the requester
 * has actually deposited into this property, minus anything already
 * withdrawn or pending — enforced here, not just in the UI.
 */
export async function requestPayout(
  input: PayoutRequestInput
): Promise<ActionResult<{ id: string }>> {
  const parsed = payoutRequestSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { assetId, requester, kind, amountUsdc, note } = parsed.data;
  const amount = BigInt(amountUsdc);

  if (kind === "WITHDRAWAL") {
    const deposited = await getDepositTotal(assetId, requester);
    const alreadyWithdrawn = await getWithdrawnTotal(assetId, requester);
    const available = deposited - alreadyWithdrawn;
    if (amount > available) {
      return {
        ok: false,
        error: `You can only withdraw up to what you've deposited into this property. Available: ${available.toString()} USDG base units.`,
      };
    }
  }

  try {
    const request = await prisma.payoutRequest.create({
      data: {
        assetId,
        requester: requester.toLowerCase(),
        kind,
        amountUsdc,
        note: note || null,
      },
    });
    return { ok: true, data: { id: request.id } };
  } catch (err) {
    console.error("requestPayout failed", err);
    return { ok: false, error: "Could not submit your request." };
  }
}

/** A wallet's payout request history for one property, most recent first. */
export async function getPayoutRequests(assetId: string, requester: string) {
  return prisma.payoutRequest.findMany({
    where: { assetId, requester: requester.toLowerCase() },
    orderBy: { createdAt: "desc" },
  });
}

/** A wallet's full payout request history across every property. */
export async function getAllPayoutRequests(requester: string) {
  return prisma.payoutRequest.findMany({
    where: { requester: requester.toLowerCase() },
    include: { asset: { select: { id: true, name: true, city: true, region: true } } },
    orderBy: { createdAt: "desc" },
  });
}

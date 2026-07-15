"use server";

import { prisma } from "@/lib/db";
import {
  createAssetSchema,
  linkRaiseSchema,
  type CreateAssetInput,
  type LinkRaiseInput,
} from "@/lib/validation";

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

/**
 * Create off-chain asset metadata. Returns the new asset id, which the
 * listing flow carries into the on-chain steps and then links back via
 * `linkRaiseAddress`.
 */
export async function createAsset(
  input: CreateAssetInput
): Promise<ActionResult<{ id: string }>> {
  const parsed = createAssetSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    const asset = await prisma.asset.create({
      data: {
        name: parsed.data.name,
        city: parsed.data.city,
        region: parsed.data.region,
        description: parsed.data.description,
        assetType: parsed.data.assetType,
        lister: parsed.data.lister.toLowerCase(),
        targetUsdc: parsed.data.targetUsdc,
        apyBps: parsed.data.apyBps,
        coverImageUrl: parsed.data.coverImageUrl || null,
      },
    });
    return { ok: true, data: { id: asset.id } };
  } catch (err) {
    console.error("createAsset failed", err);
    return {
      ok: false,
      error: "Could not save the listing. Check the database connection.",
    };
  }
}

/** Link a freshly created on-chain raise address to its metadata row. */
export async function linkRaiseAddress(
  input: LinkRaiseInput
): Promise<ActionResult<{ id: string }>> {
  const parsed = linkRaiseSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    const asset = await prisma.asset.update({
      where: { id: parsed.data.assetId },
      data: { raiseAddress: parsed.data.raiseAddress.toLowerCase() },
    });
    return { ok: true, data: { id: asset.id } };
  } catch (err) {
    console.error("linkRaiseAddress failed", err);
    return { ok: false, error: "Could not link the raise to its metadata." };
  }
}

"use server";

import { prisma } from "@/lib/db";
import {
  createAssetSchema,
  kycSchema,
  socialsSchema,
  linkRaiseSchema,
  type CreateAssetInput,
  type KycInput,
  type SocialsInput,
  type LinkRaiseInput,
} from "@/lib/validation";

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

/**
 * Step 1 of the listing wizard: save the property details as an application
 * (kybStatus defaults to PENDING). Returns the new asset id, which the wizard
 * carries into the KYC and socials steps, then into the on-chain flow once
 * RRWA approves the application.
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
        streetAddress: parsed.data.streetAddress,
        city: parsed.data.city,
        region: parsed.data.region,
        latitude: parsed.data.latitude ?? null,
        longitude: parsed.data.longitude ?? null,
        bedrooms: parsed.data.bedrooms ?? null,
        bathrooms: parsed.data.bathrooms ?? null,
        areaSqft: parsed.data.areaSqft ?? null,
        sector: parsed.data.sector ?? null,
        tvlMillions: parsed.data.tvlMillions ?? null,
        capacityPct: parsed.data.capacityPct ?? null,
        operatingStatus: parsed.data.operatingStatus ?? "ACTIVE",
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

/**
 * Step 2 of the listing wizard: individual identity KYC for the lister.
 * No automated verification provider is wired up yet — a human on the RRWA
 * team reviews this manually before the listing goes live.
 */
export async function submitKyc(
  input: KycInput
): Promise<ActionResult<{ id: string }>> {
  const parsed = kycSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    const kyc = await prisma.kyc.upsert({
      where: { assetId: parsed.data.assetId },
      create: {
        assetId: parsed.data.assetId,
        fullName: parsed.data.fullName,
        country: parsed.data.country,
        dateOfBirth: new Date(parsed.data.dateOfBirth),
        idType: parsed.data.idType,
        idNumber: parsed.data.idNumber,
        phone: parsed.data.phone,
        email: parsed.data.email,
        residentialAddress: parsed.data.residentialAddress,
        fatherName: parsed.data.fatherName || null,
        motherName: parsed.data.motherName || null,
        maritalStatus: parsed.data.maritalStatus || null,
        emergencyContactName: parsed.data.emergencyContactName || null,
        emergencyContactPhone: parsed.data.emergencyContactPhone || null,
      },
      update: {
        fullName: parsed.data.fullName,
        country: parsed.data.country,
        dateOfBirth: new Date(parsed.data.dateOfBirth),
        idType: parsed.data.idType,
        idNumber: parsed.data.idNumber,
        phone: parsed.data.phone,
        email: parsed.data.email,
        residentialAddress: parsed.data.residentialAddress,
        fatherName: parsed.data.fatherName || null,
        motherName: parsed.data.motherName || null,
        maritalStatus: parsed.data.maritalStatus || null,
        emergencyContactName: parsed.data.emergencyContactName || null,
        emergencyContactPhone: parsed.data.emergencyContactPhone || null,
      },
    });
    return { ok: true, data: { id: kyc.id } };
  } catch (err) {
    console.error("submitKyc failed", err);
    return { ok: false, error: "Could not save your identity details." };
  }
}

/**
 * Step 3 of the listing wizard: social handles, then mark the application as
 * SUBMITTED so the RRWA team picks it up for manual review.
 */
export async function submitSocialsAndFinish(
  input: SocialsInput
): Promise<ActionResult<{ id: string }>> {
  const parsed = socialsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    await prisma.kyc.update({
      where: { assetId: parsed.data.assetId },
      data: {
        xHandle: parsed.data.xHandle || null,
        telegramHandle: parsed.data.telegramHandle || null,
      },
    });
    const asset = await prisma.asset.update({
      where: { id: parsed.data.assetId },
      data: { kybStatus: "SUBMITTED" },
    });
    return { ok: true, data: { id: asset.id } };
  } catch (err) {
    console.error("submitSocialsAndFinish failed", err);
    return { ok: false, error: "Could not submit your application." };
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

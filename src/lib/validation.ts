import { z } from "zod";

export const assetTypeEnum = z.enum([
  "RESIDENTIAL",
  "COMMERCIAL",
  "WAREHOUSE",
  "LAND",
  "OTHER",
]);

/** Maps the listing form's asset-type select to the DB enum. */
export const ASSET_TYPE_LABELS: Record<
  z.infer<typeof assetTypeEnum>,
  string
> = {
  RESIDENTIAL: "Residential property",
  COMMERCIAL: "Commercial property",
  WAREHOUSE: "Warehouse / industrial",
  LAND: "Land / plot",
  OTHER: "Other real-world asset",
};

const addressSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/, "Must be a valid wallet address");

/** Payload for creating asset metadata (before the on-chain raise exists). */
export const createAssetSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(120),
  city: z.string().min(1, "City is required").max(80),
  region: z.string().min(1, "Region is required").max(80),
  description: z.string().min(10, "Add a short description").max(4000),
  assetType: assetTypeEnum,
  lister: addressSchema,
  // USDG base units (6 decimals) as a decimal string (bigint-safe over the wire).
  targetUsdc: z
    .string()
    .regex(/^\d+$/, "Target must be USDG base units")
    .refine((v) => BigInt(v) > 0n, "Target must be greater than zero"),
  apyBps: z
    .number()
    .int()
    .min(1, "APY must be greater than zero")
    .max(10000, "APY cannot exceed 100%"),
  coverImageUrl: z.string().url().optional().or(z.literal("")),
});

export type CreateAssetInput = z.infer<typeof createAssetSchema>;

/** Payload for linking a raise address to an existing asset row. */
export const linkRaiseSchema = z.object({
  assetId: z.string().min(1),
  raiseAddress: addressSchema,
});

export type LinkRaiseInput = z.infer<typeof linkRaiseSchema>;

import { z } from "zod";

export const assetTypeEnum = z.enum([
  "RESIDENTIAL",
  "COMMERCIAL",
  "WAREHOUSE",
  "LAND",
  "INFRASTRUCTURE",
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
  INFRASTRUCTURE: "Infrastructure / RWA fund",
  OTHER: "Other real-world asset",
};

const addressSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/, "Must be a valid wallet address");

/** Step 1: full property details. */
export const propertyDetailsSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(120),
  streetAddress: z.string().min(3, "Street address is required").max(200),
  city: z.string().min(1, "City is required").max(80),
  region: z.string().min(1, "Region / country is required").max(80),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  bedrooms: z.number().int().min(0).max(50).optional(),
  bathrooms: z.number().int().min(0).max(50).optional(),
  areaSqft: z.number().int().min(0).max(10_000_000).optional(),
  // Infrastructure/RWA fund-style listings (funds, not single residential
  // properties) use these instead of bedrooms/bathrooms/sqft.
  sector: z.string().max(80).optional(),
  capacityPct: z.number().int().min(0).max(100).optional(),
  operatingStatus: z.enum(["ACTIVE", "PAUSED", "CLOSED"]).optional(),
  // Per-wallet investment bounds preview (USDG base units as strings).
  minContributionUsdc: z
    .string()
    .regex(/^\d+$/)
    .optional(),
  maxContributionUsdc: z
    .string()
    .regex(/^\d+$/)
    .optional(),
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

export type PropertyDetailsInput = z.infer<typeof propertyDetailsSchema>;

// Kept as an alias — the listing action still calls this "createAsset".
export const createAssetSchema = propertyDetailsSchema;
export type CreateAssetInput = PropertyDetailsInput;

/** Step 2: individual identity KYC. No automated verification provider is
 *  wired up yet — a human on the RRWA team reviews submissions manually. */
export const kycSchema = z.object({
  assetId: z.string().min(1),
  fullName: z.string().min(2, "Full name is required").max(160),
  country: z.string().min(2, "Select a country").max(2),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
    .refine((v) => {
      const age =
        (Date.now() - new Date(v).getTime()) / (1000 * 60 * 60 * 24 * 365.25);
      return age >= 18;
    }, "You must be 18 or older"),
  idType: z.string().min(1, "Select an ID type"),
  idNumber: z.string().min(3, "Enter your ID number").max(60),
  phone: z.string().min(5, "Enter a phone number").max(30),
  email: z.string().email("Enter a valid email"),
  residentialAddress: z.string().min(5, "Enter your residential address").max(300),
  fatherName: z.string().max(160).optional().or(z.literal("")),
  motherName: z.string().max(160).optional().or(z.literal("")),
  maritalStatus: z.string().max(30).optional().or(z.literal("")),
  emergencyContactName: z.string().max(160).optional().or(z.literal("")),
  emergencyContactPhone: z.string().max(30).optional().or(z.literal("")),
});

export type KycInput = z.infer<typeof kycSchema>;

/** Step 3: social handles, then the application is submitted for review. */
export const socialsSchema = z.object({
  assetId: z.string().min(1),
  xHandle: z.string().max(60).optional().or(z.literal("")),
  telegramHandle: z.string().max(60).optional().or(z.literal("")),
});

export type SocialsInput = z.infer<typeof socialsSchema>;

/** Record a USDG transfer sent directly to the treasury wallet. */
export const recordDepositSchema = z.object({
  depositor: addressSchema,
  amountUsdc: z
    .string()
    .regex(/^\d+$/, "Amount must be USDG base units")
    .refine((v) => BigInt(v) > 0n, "Amount must be greater than zero"),
  txHash: z
    .string()
    .regex(/^0x[a-fA-F0-9]{64}$/, "Must be a valid transaction hash"),
});

export type RecordDepositInput = z.infer<typeof recordDepositSchema>;

/** Request a manual withdrawal or yield payout from the treasury. */
export const payoutRequestSchema = z.object({
  requester: addressSchema,
  kind: z.enum(["WITHDRAWAL", "YIELD"]),
  amountUsdc: z
    .string()
    .regex(/^\d+$/, "Amount must be USDG base units")
    .refine((v) => BigInt(v) > 0n, "Amount must be greater than zero"),
  note: z.string().max(500).optional().or(z.literal("")),
});

export type PayoutRequestInput = z.infer<typeof payoutRequestSchema>;

/** Payload for linking a raise address to an existing asset row. */
export const linkRaiseSchema = z.object({
  assetId: z.string().min(1),
  raiseAddress: addressSchema,
});

export type LinkRaiseInput = z.infer<typeof linkRaiseSchema>;

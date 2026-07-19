/**
 * Seeds the RRWA property listings shown on the properties page. Each is a
 * single residential unit rather than an infrastructure fund. APY and terms
 * are placeholders for now — real numbers come from the partnership
 * agreement with each verified asset owner once finalized. No images yet
 * (added in a follow-up); the UI degrades gracefully without a cover photo.
 *
 * Run with: npm run db:seed
 * Requires DATABASE_URL / DIRECT_URL pointed at your Supabase Postgres
 * instance (Project Settings -> Database -> Connection string).
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString =
  process.env.DATABASE_URL ?? process.env.DIRECT_URL ?? "";
// Supabase requires SSL; see the matching note in src/lib/db.ts.
const needsSsl = /supabase\.(co|com)/.test(connectionString);
const adapter = new PrismaPg({
  connectionString,
  ...(needsSsl ? { ssl: { rejectUnauthorized: false } } : {}),
});
const prisma = new PrismaClient({ adapter });

type SeedProperty = {
  name: string;
  city: string;
  region: string;
  description: string;
  assetType: "RESIDENTIAL" | "COMMERCIAL";
  targetUsd: number; // placeholder USD funding target
  minContributionUsd: number;
  maxContributionUsd: number;
  apyBps: number; // placeholder APY, real terms pending partnership agreement
  bedrooms?: number;
  bathrooms?: number;
  areaSqft: number;
  operatingStatus: "ACTIVE" | "PAUSED" | "CLOSED";
  coverImageUrl?: string;
  images?: string[];
  latitude?: number;
  longitude?: number;
  /** Env var name holding this property's dedicated treasury wallet address. */
  treasuryEnvVar: string;
};

// A placeholder lister wallet for seeded demo listings. Replace with the
// verified asset owner's wallet once the partnership agreement is signed.
const DEMO_LISTER = "0x000000000000000000000000000000000000d3";

/** Whole USD -> USDG base units (6 decimals) as a string. */
function usdToUsdgBaseUnits(usd: number): string {
  return (BigInt(Math.round(usd)) * 1_000_000n).toString();
}

const PROPERTIES: SeedProperty[] = [
  {
    name: "1 BR Flat in Dubai",
    city: "Dubai",
    region: "United Arab Emirates",
    description:
      "A one-bedroom flat in Dubai, UAE. Terms below are placeholders pending the final partnership agreement with the asset owner.",
    assetType: "RESIDENTIAL",
    targetUsd: 12_000,
    minContributionUsd: 25,
    maxContributionUsd: 1_000,
    apyBps: 1150,
    bedrooms: 1,
    bathrooms: 1,
    areaSqft: 750,
    operatingStatus: "ACTIVE",
    coverImageUrl: "/properties/dubai/dubai-1.avif",
    images: [
      "/properties/dubai/dubai-1.avif",
      "/properties/dubai/dubai-2.avif",
      "/properties/dubai/dubai-3.avif",
    ],
    latitude: 25.1818,
    longitude: 55.2835,
    treasuryEnvVar: "PROPERTY_TREASURY_DUBAI_ADDRESS",
  },
  {
    name: "1 BHK Villa with Private Pool in Bali",
    city: "Bali",
    region: "Indonesia",
    description:
      "A 1 BHK, 2-bed villa in Bali with a private pool. Full details to follow — terms below are placeholders pending the final partnership agreement with the asset owner.",
    assetType: "RESIDENTIAL",
    targetUsd: 20_000,
    minContributionUsd: 25,
    maxContributionUsd: 1_000,
    apyBps: 1230,
    bedrooms: 2,
    bathrooms: 1,
    areaSqft: 1100,
    operatingStatus: "ACTIVE",
    coverImageUrl: "/properties/bali/bali-1.avif",
    images: [
      "/properties/bali/bali-1.avif",
      "/properties/bali/bali-2.avif",
      "/properties/bali/bali-3.avif",
      "/properties/bali/bali-4.png",
    ],
    latitude: -8.4449177,
    longitude: 115.663738,
    treasuryEnvVar: "PROPERTY_TREASURY_BALI_ADDRESS",
  },
];

async function main() {
  // Wipe existing listings before seeding the new set (removing the old
  // infrastructure-fund demo listings that no longer belong on the site).
  // KYC/Kyc rows and images cascade-delete with their parent Asset.
  const deleted = await prisma.asset.deleteMany({
    where: { raiseAddress: null }, // never touch a listing that's live on chain
  });
  console.log(`Removed ${deleted.count} existing off-chain-only listing(s).`);

  for (const p of PROPERTIES) {
    const treasuryAddress = process.env[p.treasuryEnvVar] ?? null;
    if (!treasuryAddress) {
      console.warn(
        `Warning: ${p.treasuryEnvVar} not set — "${p.name}" will be seeded without a treasury wallet, so investing won't be open for it yet.`
      );
    }

    await prisma.asset.create({
      data: {
        name: p.name,
        city: p.city,
        region: p.region,
        description: p.description,
        assetType: p.assetType,
        lister: DEMO_LISTER,
        targetUsdc: usdToUsdgBaseUnits(p.targetUsd),
        minContributionUsdc: usdToUsdgBaseUnits(p.minContributionUsd),
        maxContributionUsdc: usdToUsdgBaseUnits(p.maxContributionUsd),
        apyBps: p.apyBps,
        bedrooms: p.bedrooms ?? null,
        bathrooms: p.bathrooms ?? null,
        areaSqft: p.areaSqft,
        operatingStatus: p.operatingStatus,
        kybStatus: "APPROVED",
        coverImageUrl: p.coverImageUrl ?? null,
        latitude: p.latitude ?? null,
        longitude: p.longitude ?? null,
        treasuryAddress: treasuryAddress?.toLowerCase() ?? null,
        images: p.images
          ? {
              create: p.images.map((url, i) => ({
                url,
                alt: `${p.name} photo ${i + 1}`,
                sort: i,
              })),
            }
          : undefined,
      },
    });
    console.log(`Seeded "${p.name}" (${p.city}, ${p.region}).`);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });

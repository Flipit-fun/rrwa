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
  assetType: "RESIDENTIAL";
  targetUsd: number; // placeholder USD funding target
  minContributionUsd: number;
  maxContributionUsd: number;
  apyBps: number; // placeholder APY, real terms pending partnership agreement
  bedrooms: number;
  bathrooms: number;
  areaSqft: number;
  operatingStatus: "ACTIVE" | "PAUSED" | "CLOSED";
  coverImageUrl?: string;
  images?: string[];
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
    minContributionUsd: 500,
    maxContributionUsd: 5_000,
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
  },
  {
    name: "Apartment in California",
    city: "Los Angeles",
    region: "United States",
    description:
      "An apartment in California, USA. Full details and photos to follow — terms below are placeholders pending the final partnership agreement with the asset owner.",
    assetType: "RESIDENTIAL",
    targetUsd: 18_000,
    minContributionUsd: 500,
    maxContributionUsd: 5_000,
    apyBps: 980,
    bedrooms: 2,
    bathrooms: 1,
    areaSqft: 900,
    operatingStatus: "ACTIVE",
  },
  {
    name: "Studio Apartment with Kitchenette in Singapore",
    city: "Singapore",
    region: "Singapore",
    description:
      "A studio apartment with an attached kitchenette in Singapore. Full details and photos to follow — terms below are placeholders pending the final partnership agreement with the asset owner.",
    assetType: "RESIDENTIAL",
    targetUsd: 15_000,
    minContributionUsd: 500,
    maxContributionUsd: 5_000,
    apyBps: 1040,
    bedrooms: 0,
    bathrooms: 1,
    areaSqft: 450,
    operatingStatus: "ACTIVE",
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
        bedrooms: p.bedrooms,
        bathrooms: p.bathrooms,
        areaSqft: p.areaSqft,
        operatingStatus: p.operatingStatus,
        kybStatus: "APPROVED",
        coverImageUrl: p.coverImageUrl ?? null,
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

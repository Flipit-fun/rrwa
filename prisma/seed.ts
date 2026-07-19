/**
 * Seeds the RRWA infrastructure/RWA fund listings shown on the properties
 * page — funds backing real-world sectors (energy, logistics, telecom,
 * hospitality, medical leasing, aquaculture, etc.), each with a TVL, fixed
 * APY, and utilization capacity rather than a single residential property's
 * bedrooms/bathrooms. Images are free-to-use Unsplash stock photography
 * matched to each sector, not photos of any specific real facility.
 *
 * Run with: npm run db:seed
 * Requires DATABASE_URL / DIRECT_URL pointed at your Supabase Postgres
 * instance (Project Settings -> Database -> Connection string). This was
 * written and type-checked but not executed against a live DB in this
 * environment, since no Supabase credentials were available here.
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString =
  process.env.DATABASE_URL ?? process.env.DIRECT_URL ?? "";
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

type SeedFund = {
  name: string;
  sector: string;
  city: string;
  region: string;
  description: string;
  assetType: "INFRASTRUCTURE";
  tvlMillions: number;
  apyBps: number;
  capacityPct: number;
  operatingStatus: "ACTIVE" | "PAUSED" | "CLOSED";
  latitude: number;
  longitude: number;
  coverImageUrl: string;
  images: string[];
  lister: string;
};

// A placeholder lister wallet for seeded demo listings. Replace with a real
// operator wallet before going live.
const DEMO_LISTER = "0x000000000000000000000000000000000000d3";

/** TVL in $ millions -> USDG base units (6 decimals) as a string. */
function tvlToUsdgBaseUnits(millions: number): string {
  return (BigInt(Math.round(millions * 1_000_000)) * 1_000_000n).toString();
}

const FUNDS: SeedFund[] = [
  {
    name: "NovaGrid Infrastructure",
    sector: "Renewable Energy",
    city: "Austin",
    region: "United States",
    description:
      "A portfolio of grid-scale battery storage and transmission infrastructure supporting renewable energy integration across Texas. Revenue comes from long-term capacity contracts with regional utilities.",
    assetType: "INFRASTRUCTURE",
    tvlMillions: 425,
    apyBps: 1180,
    capacityPct: 74,
    operatingStatus: "ACTIVE",
    latitude: 30.2672,
    longitude: -97.7431,
    coverImageUrl:
      "https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=1200&q=80",
      "https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=1200&q=80",
    ],
    lister: DEMO_LISTER,
  },
  {
    name: "BluePeak Warehousing",
    sector: "Industrial Storage",
    city: "Memphis",
    region: "United States",
    description:
      "A network of climate-controlled industrial storage facilities serving regional distribution and e-commerce fulfillment tenants under multi-year leases.",
    assetType: "INFRASTRUCTURE",
    tvlMillions: 310,
    apyBps: 960,
    capacityPct: 42,
    operatingStatus: "ACTIVE",
    latitude: 35.1495,
    longitude: -90.0490,
    coverImageUrl:
      "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1200&q=80",
      "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1200&q=80",
    ],
    lister: DEMO_LISTER,
  },
  {
    name: "TerraFiber Networks",
    sector: "Fiber & Telecom",
    city: "Denver",
    region: "United States",
    description:
      "Regional fiber-optic backbone infrastructure leased to telecom carriers and enterprise customers, with revenue backed by long-term dark fiber and lit-service contracts.",
    assetType: "INFRASTRUCTURE",
    tvlMillions: 590,
    apyBps: 1090,
    capacityPct: 81,
    operatingStatus: "ACTIVE",
    latitude: 39.7392,
    longitude: -104.9903,
    coverImageUrl:
      "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=1200&q=80",
      "https://images.unsplash.com/photo-1516937941344-00b4e0337589?w=1200&q=80",
    ],
    lister: DEMO_LISTER,
  },
  {
    name: "UrbanStay Portfolio",
    sector: "Hospitality",
    city: "Lisbon",
    region: "Portugal",
    description:
      "A portfolio of branded short-term rental and boutique hotel properties in high-demand European city centers, generating yield from nightly and extended-stay bookings.",
    assetType: "INFRASTRUCTURE",
    tvlMillions: 810,
    apyBps: 870,
    capacityPct: 63,
    operatingStatus: "ACTIVE",
    latitude: 38.7223,
    longitude: -9.1393,
    coverImageUrl:
      "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80",
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200&q=80",
    ],
    lister: DEMO_LISTER,
  },
  {
    name: "MedSupply Capital",
    sector: "Medical Equipment Leasing",
    city: "Boston",
    region: "United States",
    description:
      "Finances and leases diagnostic and surgical equipment to hospital networks and outpatient clinics, earning yield from multi-year equipment lease payments.",
    assetType: "INFRASTRUCTURE",
    tvlMillions: 460,
    apyBps: 1210,
    capacityPct: 57,
    operatingStatus: "ACTIVE",
    latitude: 42.3601,
    longitude: -71.0589,
    coverImageUrl:
      "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=1200&q=80",
      "https://images.unsplash.com/photo-1580274455191-1c62238fa333?w=1200&q=80",
    ],
    lister: DEMO_LISTER,
  },
  {
    name: "GreenVolt Solar Fund",
    sector: "Solar Infrastructure",
    city: "Phoenix",
    region: "United States",
    description:
      "Owns and operates utility-scale solar generation assets under long-term power purchase agreements with regional grid operators.",
    assetType: "INFRASTRUCTURE",
    tvlMillions: 680,
    apyBps: 1040,
    capacityPct: 69,
    operatingStatus: "ACTIVE",
    latitude: 33.4484,
    longitude: -112.0740,
    coverImageUrl:
      "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=1200&q=80",
      "https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=1200&q=80",
    ],
    lister: DEMO_LISTER,
  },
  {
    name: "CargoLink Logistics",
    sector: "Freight Financing",
    city: "Rotterdam",
    region: "Netherlands",
    description:
      "Finances freight containers and cross-border trucking fleets serving one of Europe's busiest port and logistics corridors, earning yield from freight lease and financing contracts.",
    assetType: "INFRASTRUCTURE",
    tvlMillions: 395,
    apyBps: 1150,
    capacityPct: 51,
    operatingStatus: "ACTIVE",
    latitude: 51.9244,
    longitude: 4.4777,
    coverImageUrl:
      "https://images.unsplash.com/photo-1494412651409-8963ce7935a7?w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1494412651409-8963ce7935a7?w=1200&q=80",
      "https://images.unsplash.com/photo-1605152276897-4f618f831968?w=1200&q=80",
    ],
    lister: DEMO_LISTER,
  },
  {
    name: "AquaHarvest Fisheries",
    sector: "Aquaculture",
    city: "Bergen",
    region: "Norway",
    description:
      "Operates offshore salmon and shellfish aquaculture facilities supplying seafood exporters, with yield generated from harvest contracts and export agreements.",
    assetType: "INFRASTRUCTURE",
    tvlMillions: 275,
    apyBps: 1320,
    capacityPct: 36,
    operatingStatus: "ACTIVE",
    latitude: 60.3913,
    longitude: 5.3221,
    coverImageUrl:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80",
      "https://images.unsplash.com/photo-1584982751601-97dcc096659c?w=1200&q=80",
    ],
    lister: DEMO_LISTER,
  },
];

async function main() {
  for (const f of FUNDS) {
    const existing = await prisma.asset.findFirst({
      where: { name: f.name, city: f.city },
    });
    if (existing) {
      console.log(`Skipping "${f.name}" — already seeded.`);
      continue;
    }

    await prisma.asset.create({
      data: {
        name: f.name,
        sector: f.sector,
        city: f.city,
        region: f.region,
        description: f.description,
        assetType: f.assetType,
        lister: f.lister,
        targetUsdc: tvlToUsdgBaseUnits(f.tvlMillions),
        tvlMillions: f.tvlMillions,
        apyBps: f.apyBps,
        capacityPct: f.capacityPct,
        operatingStatus: f.operatingStatus,
        kybStatus: "APPROVED",
        coverImageUrl: f.coverImageUrl,
        latitude: f.latitude,
        longitude: f.longitude,
        images: {
          create: f.images.map((url, i) => ({
            url,
            alt: `${f.name} photo ${i + 1}`,
            sort: i,
          })),
        },
      },
    });
    console.log(`Seeded "${f.name}" (${f.city}, ${f.region}).`);
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

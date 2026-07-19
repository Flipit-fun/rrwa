/**
 * Seeds the 6 showcase properties for the RRWA marketplace's "side feature"
 * (individual property raises). Images are free-to-use Unsplash stock
 * photography styled to match each market — not actual Airbnb listing photos,
 * since scraping/reusing real Airbnb photos would violate their terms and
 * copyright. Coordinates are approximate, real-world locations for each city
 * so the map on the asset page has something accurate to point at.
 *
 * Run with: npx prisma db seed
 * (requires DATABASE_URL / DIRECT_URL pointed at a real Postgres instance —
 * this was written and type-checked but not executed against a live DB in
 * this environment, since no Postgres was available to connect to.)
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString =
  process.env.DATABASE_URL ?? process.env.DIRECT_URL ?? "";
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

type SeedProperty = {
  name: string;
  city: string;
  region: string;
  description: string;
  assetType: "RESIDENTIAL" | "COMMERCIAL" | "WAREHOUSE" | "LAND" | "OTHER";
  targetUsdc: string; // USDG base units (6 decimals), as string
  apyBps: number;
  latitude: number;
  longitude: number;
  coverImageUrl: string;
  images: string[];
  lister: string;
};

// A placeholder lister wallet for seeded demo listings. Replace with a real
// operator wallet before going live.
const DEMO_LISTER = "0x000000000000000000000000000000000000d3";

const PROPERTIES: SeedProperty[] = [
  {
    name: "Palm Jumeirah Beachfront Villa",
    city: "Dubai",
    region: "United Arab Emirates",
    description:
      "A 5-bedroom beachfront villa on Palm Jumeirah with a private pool, direct beach access, and skyline views of the Dubai Marina. One of the most requested short-term rentals in the city, with strong year-round occupancy from tourism and business travel.",
    assetType: "RESIDENTIAL",
    targetUsdc: "2500000000000", // $2,500,000
    apyBps: 1200,
    latitude: 25.1124,
    longitude: 55.139,
    coverImageUrl:
      "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200&q=80",
      "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=1200&q=80",
      "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200&q=80",
    ],
    lister: DEMO_LISTER,
  },
  {
    name: "Trastevere Rooftop Loft",
    city: "Rome",
    region: "Italy",
    description:
      "A restored 2-bedroom loft in Rome's Trastevere district with a private rooftop terrace overlooking the city's terracotta skyline. Walking distance to the Tiber and the neighborhood's cafes and trattorias, with consistent demand from European city-break travelers.",
    assetType: "RESIDENTIAL",
    targetUsdc: "850000000000", // $850,000
    apyBps: 1150,
    latitude: 41.8896,
    longitude: 12.4692,
    coverImageUrl:
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&q=80",
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200&q=80",
      "https://images.unsplash.com/photo-1503917988258-f87a78e3c995?w=1200&q=80",
    ],
    lister: DEMO_LISTER,
  },
  {
    name: "South Beach Art Deco Condo",
    city: "Miami",
    region: "United States",
    description:
      "A fully furnished 2-bedroom condo in the heart of Miami's South Beach Art Deco district, two blocks from Ocean Drive. Steady bookings from the city's year-round tourism and events calendar make it one of the stronger short-term yield markets in the US.",
    assetType: "RESIDENTIAL",
    targetUsdc: "1200000000000", // $1,200,000
    apyBps: 1100,
    latitude: 25.7827,
    longitude: -80.13,
    coverImageUrl:
      "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200&q=80",
      "https://images.unsplash.com/photo-1531973576160-7125cd663d86?w=1200&q=80",
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80",
    ],
    lister: DEMO_LISTER,
  },
  {
    name: "Uluwatu Cliffside Villa",
    city: "Bali",
    region: "Indonesia",
    description:
      "A 4-bedroom cliffside villa near Uluwatu with an infinity pool overlooking the Indian Ocean. Bali's short-term rental market has grown steadily with the rise of remote work and long-stay travel, keeping occupancy high through most of the year.",
    assetType: "RESIDENTIAL",
    targetUsdc: "950000000000", // $950,000
    apyBps: 1300,
    latitude: -8.8291,
    longitude: 115.0849,
    coverImageUrl:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&q=80",
    ],
    lister: DEMO_LISTER,
  },
  {
    name: "Shibuya Compact City Apartment",
    city: "Tokyo",
    region: "Japan",
    description:
      "A minimalist 1-bedroom apartment steps from Shibuya Crossing, designed for the compact-living style Tokyo travelers expect. Dense foot traffic and a limited short-term rental supply in central wards support strong nightly rates.",
    assetType: "RESIDENTIAL",
    targetUsdc: "700000000000", // $700,000
    apyBps: 1050,
    latitude: 35.6595,
    longitude: 139.7005,
    coverImageUrl:
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=1200&q=80",
      "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200&q=80",
      "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1200&q=80",
    ],
    lister: DEMO_LISTER,
  },
  {
    name: "Le Marais Haussmann Flat",
    city: "Paris",
    region: "France",
    description:
      "A classic Haussmann-style 2-bedroom flat in Le Marais, with original moldings, tall windows, and a balcony over a quiet cobblestone street. One of Paris's most tourist-dense arrondissements, with reliable demand across every season.",
    assetType: "RESIDENTIAL",
    targetUsdc: "1100000000000", // $1,100,000
    apyBps: 1000,
    latitude: 48.8589,
    longitude: 2.3622,
    coverImageUrl:
      "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1200&q=80",
      "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=1200&q=80",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&q=80",
    ],
    lister: DEMO_LISTER,
  },
];

async function main() {
  for (const p of PROPERTIES) {
    const existing = await prisma.asset.findFirst({
      where: { name: p.name, city: p.city },
    });
    if (existing) {
      console.log(`Skipping "${p.name}" — already seeded.`);
      continue;
    }

    await prisma.asset.create({
      data: {
        name: p.name,
        city: p.city,
        region: p.region,
        description: p.description,
        assetType: p.assetType,
        lister: p.lister,
        targetUsdc: p.targetUsdc,
        apyBps: p.apyBps,
        kybStatus: "APPROVED",
        coverImageUrl: p.coverImageUrl,
        latitude: p.latitude,
        longitude: p.longitude,
        images: {
          create: p.images.map((url, i) => ({
            url,
            alt: `${p.name} photo ${i + 1}`,
            sort: i,
          })),
        },
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

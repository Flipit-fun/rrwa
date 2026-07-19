import "server-only";
import { prisma } from "./db";

export type AssetMetadata = {
  id: string;
  raiseAddress: string | null;
  lister: string;
  name: string;
  streetAddress: string | null;
  city: string;
  region: string;
  bedrooms: number | null;
  bathrooms: number | null;
  areaSqft: number | null;
  description: string;
  assetType: string;
  targetUsdc: string;
  apyBps: number;
  kybStatus: string;
  coverImageUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  // Infrastructure/RWA fund-style listings (funds, not single residential
  // properties) surface these instead of bedrooms/bathrooms/sqft.
  sector: string | null;
  tvlMillions: number | null;
  capacityPct: number | null;
  operatingStatus: string;
  images?: { url: string; alt: string | null; sort: number }[];
};

/** Fetch metadata for a set of raise addresses, keyed by lowercase address. */
export async function getMetadataByRaiseAddresses(
  addresses: string[]
): Promise<Record<string, AssetMetadata>> {
  if (addresses.length === 0) return {};
  const lower = addresses.map((a) => a.toLowerCase());
  const rows = await prisma.asset.findMany({
    where: { raiseAddress: { in: lower } },
    include: { images: { orderBy: { sort: "asc" } } },
  });
  const map: Record<string, AssetMetadata> = {};
  for (const r of rows) {
    if (r.raiseAddress) map[r.raiseAddress] = serialize(r);
  }
  return map;
}

/** Fetch a single asset's metadata by its raise address. */
export async function getMetadataByRaiseAddress(
  address: string
): Promise<AssetMetadata | null> {
  const row = await prisma.asset.findUnique({
    where: { raiseAddress: address.toLowerCase() },
    include: { images: { orderBy: { sort: "asc" } } },
  });
  return row ? serialize(row) : null;
}

/** Fetch all seeded assets (used to power the properties showcase). */
export async function getAllAssets(): Promise<AssetMetadata[]> {
  const rows = await prisma.asset.findMany({
    include: { images: { orderBy: { sort: "asc" } } },
    orderBy: { createdAt: "asc" },
  });
  return rows.map(serialize);
}

type AssetRow = {
  id: string;
  raiseAddress: string | null;
  lister: string;
  name: string;
  streetAddress: string | null;
  city: string;
  region: string;
  bedrooms: number | null;
  bathrooms: number | null;
  areaSqft: number | null;
  description: string;
  assetType: string;
  targetUsdc: string;
  apyBps: number;
  kybStatus: string;
  coverImageUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  sector: string | null;
  tvlMillions: number | null;
  capacityPct: number | null;
  operatingStatus: string;
  images?: { url: string; alt: string | null; sort: number }[];
};

function serialize(r: AssetRow): AssetMetadata {
  return {
    id: r.id,
    raiseAddress: r.raiseAddress,
    lister: r.lister,
    name: r.name,
    streetAddress: r.streetAddress,
    city: r.city,
    region: r.region,
    bedrooms: r.bedrooms,
    bathrooms: r.bathrooms,
    areaSqft: r.areaSqft,
    description: r.description,
    assetType: r.assetType,
    targetUsdc: r.targetUsdc,
    apyBps: r.apyBps,
    kybStatus: r.kybStatus,
    coverImageUrl: r.coverImageUrl,
    latitude: r.latitude,
    longitude: r.longitude,
    sector: r.sector,
    tvlMillions: r.tvlMillions,
    capacityPct: r.capacityPct,
    operatingStatus: r.operatingStatus,
    images: r.images,
  };
}

import "server-only";
import { prisma } from "./db";

export type AssetMetadata = {
  id: string;
  raiseAddress: string | null;
  lister: string;
  name: string;
  city: string;
  region: string;
  description: string;
  assetType: string;
  targetUsdc: string;
  apyBps: number;
  kybStatus: string;
  coverImageUrl: string | null;
};

/** Fetch metadata for a set of raise addresses, keyed by lowercase address. */
export async function getMetadataByRaiseAddresses(
  addresses: string[]
): Promise<Record<string, AssetMetadata>> {
  if (addresses.length === 0) return {};
  const lower = addresses.map((a) => a.toLowerCase());
  const rows = await prisma.asset.findMany({
    where: { raiseAddress: { in: lower } },
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
  });
  return row ? serialize(row) : null;
}

type AssetRow = {
  id: string;
  raiseAddress: string | null;
  lister: string;
  name: string;
  city: string;
  region: string;
  description: string;
  assetType: string;
  targetUsdc: string;
  apyBps: number;
  kybStatus: string;
  coverImageUrl: string | null;
};

function serialize(r: AssetRow): AssetMetadata {
  return {
    id: r.id,
    raiseAddress: r.raiseAddress,
    lister: r.lister,
    name: r.name,
    city: r.city,
    region: r.region,
    description: r.description,
    assetType: r.assetType,
    targetUsdc: r.targetUsdc,
    apyBps: r.apyBps,
    kybStatus: r.kybStatus,
    coverImageUrl: r.coverImageUrl,
  };
}

"use server";

import { getAllAssets, type AssetMetadata } from "@/lib/assets";

/** Fetch every seeded property for the showcase/properties page. */
export async function getProperties(): Promise<AssetMetadata[]> {
  try {
    return await getAllAssets();
  } catch (err) {
    console.error("getProperties failed", err);
    return [];
  }
}

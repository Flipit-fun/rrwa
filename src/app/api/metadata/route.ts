import { NextRequest, NextResponse } from "next/server";
import { getMetadataByRaiseAddresses } from "@/lib/assets";

/**
 * GET /api/metadata?addresses=0x..,0x..
 * Returns off-chain metadata keyed by lowercase raise address so the client
 * can merge it with the on-chain registry reads.
 */
export async function GET(req: NextRequest) {
  const param = req.nextUrl.searchParams.get("addresses");
  if (!param) return NextResponse.json({});

  const addresses = param
    .split(",")
    .map((a) => a.trim())
    .filter((a) => /^0x[a-fA-F0-9]{40}$/.test(a));

  try {
    const map = await getMetadataByRaiseAddresses(addresses);
    return NextResponse.json(map);
  } catch (err) {
    console.error("GET /api/metadata failed", err);
    return NextResponse.json(
      { error: "Metadata store unavailable" },
      { status: 503 }
    );
  }
}

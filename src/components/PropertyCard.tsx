import Link from "next/link";
import Image from "next/image";
import { formatUsd, formatApyBps } from "@/lib/format";
import type { AssetMetadata } from "@/lib/assets";

export default function PropertyCard({ property }: { property: AssetMetadata }) {
  return (
    <Link href={`/properties/${property.id}`} className="prop-card">
      {property.coverImageUrl && (
        <div className="prop-card-img">
          <Image
            src={property.coverImageUrl}
            alt={property.name}
            fill
            sizes="(max-width: 700px) 100vw, 33vw"
            style={{ objectFit: "cover" }}
          />
        </div>
      )}
      <div className="prop-card-body">
        <span className="eyebrow">
          {property.city}, {property.region}
        </span>
        <h3>{property.name}</h3>
        <div className="prop-card-stats">
          <div>
            <b>{formatApyBps(property.apyBps)}</b>
            <span>APY</span>
          </div>
          <div>
            <b>{formatUsd(BigInt(property.targetUsdc))}</b>
            <span>Value</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

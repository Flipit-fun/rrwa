import Link from "next/link";
import Image from "next/image";
import { formatUsd, formatApyBps, formatTvlMillions } from "@/lib/format";
import type { AssetMetadata } from "@/lib/assets";

export default function PropertyCard({ property }: { property: AssetMetadata }) {
  const isFund = property.tvlMillions != null;

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
          <span className={`prop-status prop-status-${property.operatingStatus.toLowerCase()}`}>
            {property.operatingStatus === "ACTIVE"
              ? "Active"
              : property.operatingStatus === "PAUSED"
                ? "Paused"
                : "Closed"}
          </span>
        </div>
      )}
      <div className="prop-card-body">
        <span className="eyebrow">{property.sector ?? `${property.city}, ${property.region}`}</span>
        <h3>{property.name}</h3>
        <div className="prop-card-stats">
          <div>
            <b>
              {isFund
                ? formatTvlMillions(property.tvlMillions as number)
                : formatUsd(BigInt(property.targetUsdc))}
            </b>
            <span>TVL</span>
          </div>
          <div>
            <b>{formatApyBps(property.apyBps)}</b>
            <span>APY</span>
          </div>
          {property.capacityPct != null && (
            <div>
              <b>{property.capacityPct}%</b>
              <span>Capacity</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

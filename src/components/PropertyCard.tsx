"use client";

import Link from "next/link";
import Image from "next/image";
import type { Address } from "viem";
import { formatUsd, formatApyBps, progressPct } from "@/lib/format";
import type { AssetMetadata } from "@/lib/assets";
import { useRaise } from "@/hooks/useRaises";

export default function PropertyCard({ property }: { property: AssetMetadata }) {
  const raiseAddress = property.raiseAddress as Address | undefined;
  const { data: raise } = useRaise(raiseAddress);

  const target = raise?.target ?? BigInt(property.targetUsdc);
  const raised = raise?.raised ?? 0n;
  const pct = progressPct(raised, target);
  const isLive = !!raiseAddress;

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
          <span
            className={`prop-status prop-status-${property.operatingStatus.toLowerCase()}`}
          >
            {property.operatingStatus === "ACTIVE"
              ? "Active"
              : property.operatingStatus === "PAUSED"
                ? "Paused"
                : "Closed"}
          </span>
        </div>
      )}
      <div className="prop-card-body">
        <span className="eyebrow">
          {property.sector ?? `${property.city}, ${property.region}`}
        </span>
        <h3>{property.name}</h3>
        <div className="prop-card-stats">
          <div>
            <b>{formatUsd(raised)}</b>
            <span>Invested</span>
          </div>
          <div>
            <b>{formatApyBps(property.apyBps)}</b>
            <span>APY</span>
          </div>
          {isLive ? (
            <div>
              <b>{pct.toFixed(0)}%</b>
              <span>Funded</span>
            </div>
          ) : (
            property.capacityPct != null && (
              <div>
                <b>{property.capacityPct}%</b>
                <span>Capacity</span>
              </div>
            )
          )}
        </div>
      </div>
    </Link>
  );
}

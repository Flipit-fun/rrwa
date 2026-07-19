import Image from "next/image";
import { notFound } from "next/navigation";
import type { Address } from "viem";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import GlitchWord from "@/components/GlitchWord";
import PropertyInvestPanel from "@/components/PropertyInvestPanel";
import PropertyStatsChartClient from "@/components/PropertyStatsChartClient";
import PartnershipNotice from "@/components/PartnershipNotice";
import { getProperties } from "@/app/actions/properties";
import { formatApyBps } from "@/lib/format";

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const properties = await getProperties();
  const property = properties.find((p) => p.id === id);

  if (!property) notFound();

  return (
    <>
      <SiteHeader />
      <main>
        <div className="wrap page">
          <span className="eyebrow">
            {property.sector ? `${property.sector} · ` : ""}
            {property.city}, {property.region}
          </span>
          <h1 style={{ marginBottom: 8 }}>
            <GlitchWord>{property.name}</GlitchWord>
          </h1>
          <span
            className={`prop-status-inline prop-status-${property.operatingStatus.toLowerCase()}`}
          >
            {property.operatingStatus === "ACTIVE"
              ? "Active"
              : property.operatingStatus === "PAUSED"
                ? "Paused"
                : "Closed"}
          </span>

          <PartnershipNotice />

          {property.images && property.images.length > 0 && (
            <div className="prop-gallery">
              {property.images.map((img, i) => (
                <div className="prop-gallery-img" key={img.url + i}>
                  <Image
                    src={img.url}
                    alt={img.alt ?? property.name}
                    fill
                    sizes="(max-width: 700px) 100vw, 50vw"
                    style={{ objectFit: "cover" }}
                    priority={i === 0}
                  />
                </div>
              ))}
            </div>
          )}

          <div className="detail-grid" style={{ marginTop: 40 }}>
            <div>
              <div className="stat-row">
                <div className="stat">
                  <b>{formatApyBps(property.apyBps)}</b>
                  <span>APY</span>
                </div>
                {property.capacityPct != null && (
                  <div className="stat">
                    <b>{property.capacityPct}%</b>
                    <span>Capacity</span>
                  </div>
                )}
                <div className="stat">
                  <b>{property.assetType}</b>
                  <span>Type</span>
                </div>
              </div>

              <p
                style={{
                  color: "var(--body)",
                  lineHeight: 1.8,
                  fontSize: 15,
                  maxWidth: 560,
                  marginTop: 28,
                }}
              >
                {property.description}
              </p>

              <div style={{ marginTop: 32 }}>
                <h3
                  style={{
                    fontFamily: "var(--serif)",
                    fontWeight: 400,
                    fontSize: 22,
                    marginBottom: 14,
                  }}
                >
                  Funding
                </h3>
                <PropertyStatsChartClient
                  raiseAddress={property.raiseAddress as Address | null}
                  targetUsdc={property.targetUsdc}
                />
              </div>
            </div>

            <PropertyInvestPanel property={property} />
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import GlitchWord from "@/components/GlitchWord";
import PropertyMap from "@/components/PropertyMap";
import { getProperties } from "@/app/actions/properties";
import { formatUsd, formatApyBps, formatTvlMillions } from "@/lib/format";

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
          <span className={`prop-status-inline prop-status-${property.operatingStatus.toLowerCase()}`}>
            {property.operatingStatus === "ACTIVE"
              ? "Active"
              : property.operatingStatus === "PAUSED"
                ? "Paused"
                : "Closed"}
          </span>

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
                  <b>
                    {property.tvlMillions != null
                      ? formatTvlMillions(property.tvlMillions)
                      : formatUsd(BigInt(property.targetUsdc))}
                  </b>
                  <span>TVL</span>
                </div>
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

              {property.raiseAddress && (
                <Link
                  href={`/asset/${property.raiseAddress}`}
                  className="btn"
                  style={{ marginTop: 24 }}
                >
                  View raise on the marketplace <span className="arr">→</span>
                </Link>
              )}
            </div>

            <div className="card">
              <h3
                style={{
                  fontFamily: "var(--serif)",
                  fontWeight: 400,
                  fontSize: 22,
                  marginBottom: 14,
                }}
              >
                Location
              </h3>
              {property.latitude != null && property.longitude != null ? (
                <PropertyMap
                  latitude={property.latitude}
                  longitude={property.longitude}
                  label={property.name}
                />
              ) : (
                <p style={{ color: "var(--faint)", fontSize: 14 }}>
                  Location pending.
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

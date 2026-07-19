import Link from "next/link";
import Image from "next/image";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import GlitchWord from "@/components/GlitchWord";
import { getProperties } from "@/app/actions/properties";
import { formatUsd, formatApyBps } from "@/lib/format";

export default async function PropertiesPage() {
  const properties = await getProperties();

  return (
    <>
      <SiteHeader />
      <main>
        <div className="wrap page">
          <div className="page-head">
            <span className="eyebrow">Backing the yield</span>
            <h1>
              The <GlitchWord>properties</GlitchWord> behind the pool.
            </h1>
            <p>
              Rent collected from these listed properties is what funds the
              fixed APY paid out to everyone in the RRWA yield pool. Each one
              can also be crowdfunded individually on the marketplace.
            </p>
          </div>

          {properties.length === 0 ? (
            <div className="state-box">
              <h3>No properties loaded</h3>
              <p>
                The property showcase reads from the database. Make sure{" "}
                <code>DATABASE_URL</code> is set and run{" "}
                <code>npm run db:seed</code> to load the six sample listings.
              </p>
            </div>
          ) : (
            <div className="prop-grid">
              {properties.map((p) => (
                <Link
                  key={p.id}
                  href={`/properties/${p.id}`}
                  className="prop-card"
                >
                  {p.coverImageUrl && (
                    <div className="prop-card-img">
                      <Image
                        src={p.coverImageUrl}
                        alt={p.name}
                        fill
                        sizes="(max-width: 700px) 100vw, 33vw"
                        style={{ objectFit: "cover" }}
                      />
                    </div>
                  )}
                  <div className="prop-card-body">
                    <span className="eyebrow">
                      {p.city}, {p.region}
                    </span>
                    <h3>{p.name}</h3>
                    <div className="prop-card-stats">
                      <div>
                        <b>{formatApyBps(p.apyBps)}</b>
                        <span>APY</span>
                      </div>
                      <div>
                        <b>{formatUsd(BigInt(p.targetUsdc))}</b>
                        <span>Value</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

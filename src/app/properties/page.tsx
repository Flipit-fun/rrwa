import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import GlitchWord from "@/components/GlitchWord";
import PropertyCard from "@/components/PropertyCard";
import { getProperties } from "@/app/actions/properties";

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
                <PropertyCard key={p.id} property={p} />
              ))}
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

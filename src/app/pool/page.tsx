import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import GlitchWord from "@/components/GlitchWord";
import PropertyCard from "@/components/PropertyCard";
import { getProperties } from "@/app/actions/properties";
import { formatApyBps } from "@/lib/format";

export default async function EarnYieldPage() {
  const properties = await getProperties();
  const maxApyBps = properties.length
    ? Math.max(...properties.map((p) => p.apyBps))
    : 0;

  return (
    <>
      <SiteHeader />
      <main>
        <div className="wrap page">
          <div className="page-head">
            <span className="eyebrow">Earn yield</span>
            <h1>
              Pick a property, <GlitchWord>start earning</GlitchWord>.
            </h1>
            <p>
              {properties.length > 0
                ? `Choose from ${properties.length} listed properties, each with its own APY — up to ${formatApyBps(maxApyBps)}. Click one to invest and start earning.`
                : "Properties are on their way — check back shortly."}
            </p>
          </div>

          {properties.length === 0 ? (
            <div className="state-box">
              <h3>No properties available yet</h3>
              <p>Check back shortly.</p>
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

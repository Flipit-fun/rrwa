"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import GlitchWord from "@/components/GlitchWord";
import { createAsset, submitKyc, submitSocialsAndFinish } from "@/app/actions/assets";
import { parseUsdg, parseApyToBps } from "@/lib/format";
import { COUNTRIES, idTypesForCountry } from "@/lib/countries";
import type { z } from "zod";
import { assetTypeEnum } from "@/lib/validation";

type AssetType = z.infer<typeof assetTypeEnum>;

const TYPE_OPTIONS: { value: AssetType; label: string }[] = [
  { value: "RESIDENTIAL", label: "Residential property" },
  { value: "COMMERCIAL", label: "Commercial property" },
  { value: "WAREHOUSE", label: "Warehouse / industrial" },
  { value: "LAND", label: "Land / plot" },
  { value: "OTHER", label: "Other real-world asset" },
];

type Step = 1 | 2 | 3 | 4; // 1 property, 2 KYC, 3 socials, 4 done

export default function ListPage() {
  const { address } = useAccount();

  const [step, setStep] = useState<Step>(1);
  const [error, setError] = useState<string | null>(null);
  const [assetId, setAssetId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [property, setProperty] = useState({
    name: "",
    streetAddress: "",
    city: "",
    region: "",
    bedrooms: "",
    bathrooms: "",
    areaSqft: "",
    assetType: "RESIDENTIAL" as AssetType,
    target: "",
    apy: "",
    minInvestment: "",
    maxInvestment: "",
    description: "",
  });

  const [kyc, setKyc] = useState({
    fullName: "",
    country: "US",
    idType: "PASSPORT",
    dateOfBirth: "",
    idNumber: "",
    phone: "",
    email: "",
    residentialAddress: "",
    fatherName: "",
    motherName: "",
    maritalStatus: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
  });

  const [socials, setSocials] = useState({ xHandle: "", telegramHandle: "" });

  async function onSubmitProperty(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!address) return;

    let target: bigint;
    let apyBps: number;
    try {
      target = parseUsdg(property.target);
      apyBps = parseApyToBps(property.apy);
    } catch {
      setError("Check the target and APY values.");
      return;
    }
    if (target <= 0n) {
      setError("Funding target must be greater than zero.");
      return;
    }
    if (apyBps <= 0 || apyBps > 10000) {
      setError("APY must be between 0 and 100%.");
      return;
    }

    let minContributionUsdc: string | undefined;
    let maxContributionUsdc: string | undefined;
    try {
      minContributionUsdc = property.minInvestment
        ? parseUsdg(property.minInvestment).toString()
        : undefined;
      maxContributionUsdc = property.maxInvestment
        ? parseUsdg(property.maxInvestment).toString()
        : undefined;
    } catch {
      setError("Check the minimum and maximum investment values.");
      return;
    }

    setSubmitting(true);
    const created = await createAsset({
      name: property.name,
      streetAddress: property.streetAddress,
      city: property.city,
      region: property.region,
      bedrooms: property.bedrooms ? Number(property.bedrooms) : undefined,
      bathrooms: property.bathrooms ? Number(property.bathrooms) : undefined,
      areaSqft: property.areaSqft ? Number(property.areaSqft) : undefined,
      minContributionUsdc,
      maxContributionUsdc,
      description: property.description,
      assetType: property.assetType,
      lister: address,
      targetUsdc: target.toString(),
      apyBps,
      coverImageUrl: "",
    });
    setSubmitting(false);

    if (!created.ok) {
      setError(created.error);
      return;
    }
    setAssetId(created.data.id);
    setStep(2);
  }

  async function onSubmitKyc(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!assetId) return;

    setSubmitting(true);
    const result = await submitKyc({ assetId, ...kyc });
    setSubmitting(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }
    setStep(3);
  }

  async function onSubmitSocials(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!assetId) return;

    setSubmitting(true);
    const result = await submitSocialsAndFinish({ assetId, ...socials });
    setSubmitting(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }
    setStep(4);
  }

  const idTypeOptions = idTypesForCountry(kyc.country);

  return (
    <>
      <SiteHeader />
      <main>
        <div className="wrap page">
          <div className="page-head">
            <span className="eyebrow">For listers</span>
            <h1>
              List your <GlitchWord>asset</GlitchWord>.
            </h1>
            <p>
              Tell us about the property, verify your identity, and we&apos;ll
              be in touch to get it live on RRWA. KYC is reviewed manually for
              now — an automated provider is coming later.
            </p>
          </div>

          {step < 4 && (
            <div className="stepper">
              <div className={`stepper-item ${step === 1 ? "active" : step > 1 ? "done" : ""}`}>
                <span className="stepper-num">i.</span>
                <div>
                  <div className="stepper-label">Property details</div>
                  <div className="stepper-sub">Address, photos, terms</div>
                </div>
              </div>
              <div className={`stepper-item ${step === 2 ? "active" : step > 2 ? "done" : ""}`}>
                <span className="stepper-num">ii.</span>
                <div>
                  <div className="stepper-label">Identity (KYC)</div>
                  <div className="stepper-sub">Who you are</div>
                </div>
              </div>
              <div className={`stepper-item ${step === 3 ? "active" : ""}`}>
                <span className="stepper-num">iii.</span>
                <div>
                  <div className="stepper-label">Socials</div>
                  <div className="stepper-sub">X &amp; Telegram, then submit</div>
                </div>
              </div>
            </div>
          )}

          {step === 4 ? (
            <div className="state-box">
              <h3>Application submitted</h3>
              <p>
                We&apos;ll review your property details and identity
                verification, then reach out about next steps. Thanks for
                listing with RRWA.
              </p>
            </div>
          ) : !address ? (
            <div className="state-box">
              <h3>Connect to list</h3>
              <p>Connect your wallet to start a listing application.</p>
              <div style={{ display: "flex", justifyContent: "center" }}>
                <ConnectButton />
              </div>
            </div>
          ) : step === 1 ? (
            <form onSubmit={onSubmitProperty} style={{ maxWidth: 640 }}>
              <div className="field">
                <label htmlFor="f-name">Property name</label>
                <input
                  id="f-name"
                  type="text"
                  placeholder="2BR Apartment, Los Angeles"
                  value={property.name}
                  onChange={(e) => setProperty({ ...property, name: e.target.value })}
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="f-street">Street address</label>
                <input
                  id="f-street"
                  type="text"
                  placeholder="123 Main St, Apt 4B"
                  value={property.streetAddress}
                  onChange={(e) =>
                    setProperty({ ...property, streetAddress: e.target.value })
                  }
                  required
                />
                <div className="hint">
                  Used for our internal review — not shown publicly on the
                  listing page.
                </div>
              </div>

              <div className="field-row">
                <div className="field">
                  <label htmlFor="f-city">City</label>
                  <input
                    id="f-city"
                    type="text"
                    placeholder="Los Angeles"
                    value={property.city}
                    onChange={(e) => setProperty({ ...property, city: e.target.value })}
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="f-region">Region / country</label>
                  <input
                    id="f-region"
                    type="text"
                    placeholder="California, USA"
                    value={property.region}
                    onChange={(e) => setProperty({ ...property, region: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="field-row">
                <div className="field">
                  <label htmlFor="f-bhk">Bedrooms</label>
                  <input
                    id="f-bhk"
                    type="number"
                    min={0}
                    placeholder="2"
                    value={property.bedrooms}
                    onChange={(e) => setProperty({ ...property, bedrooms: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label htmlFor="f-bath">Bathrooms</label>
                  <input
                    id="f-bath"
                    type="number"
                    min={0}
                    placeholder="2"
                    value={property.bathrooms}
                    onChange={(e) => setProperty({ ...property, bathrooms: e.target.value })}
                  />
                </div>
              </div>

              <div className="field">
                <label htmlFor="f-area">Area (sq ft)</label>
                <input
                  id="f-area"
                  type="number"
                  min={0}
                  placeholder="1200"
                  value={property.areaSqft}
                  onChange={(e) => setProperty({ ...property, areaSqft: e.target.value })}
                />
              </div>

              <div className="field-row">
                <div className="field">
                  <label htmlFor="f-target">Funding target (USD)</label>
                  <input
                    id="f-target"
                    type="text"
                    inputMode="decimal"
                    placeholder="10,000"
                    value={property.target}
                    onChange={(e) => setProperty({ ...property, target: e.target.value })}
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="f-apy">APY offered (% p.a.)</label>
                  <input
                    id="f-apy"
                    type="text"
                    inputMode="decimal"
                    placeholder="9.5"
                    value={property.apy}
                    onChange={(e) => setProperty({ ...property, apy: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="field-row">
                <div className="field">
                  <label htmlFor="f-min">Minimum investment (USD, optional)</label>
                  <input
                    id="f-min"
                    type="text"
                    inputMode="decimal"
                    placeholder="500"
                    value={property.minInvestment}
                    onChange={(e) =>
                      setProperty({ ...property, minInvestment: e.target.value })
                    }
                  />
                  <div className="hint">Smallest amount a wallet can invest.</div>
                </div>
                <div className="field">
                  <label htmlFor="f-max">Maximum per wallet (USD, optional)</label>
                  <input
                    id="f-max"
                    type="text"
                    inputMode="decimal"
                    placeholder="5,000"
                    value={property.maxInvestment}
                    onChange={(e) =>
                      setProperty({ ...property, maxInvestment: e.target.value })
                    }
                  />
                  <div className="hint">Caps how much one wallet can put in.</div>
                </div>
              </div>

              <div className="field">
                <label htmlFor="f-type">Asset type</label>
                <select
                  id="f-type"
                  value={property.assetType}
                  onChange={(e) =>
                    setProperty({ ...property, assetType: e.target.value as AssetType })
                  }
                >
                  {TYPE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label htmlFor="f-desc">Description</label>
                <input
                  id="f-desc"
                  type="text"
                  placeholder="A brief description of the property"
                  value={property.description}
                  onChange={(e) =>
                    setProperty({ ...property, description: e.target.value })
                  }
                  required
                />
              </div>

              {error && (
                <div className="banner warn" style={{ marginTop: 8 }}>
                  <span>{error}</span>
                </div>
              )}

              <button className="btn" style={{ marginTop: 8 }} type="submit" disabled={submitting}>
                {submitting ? "Saving..." : "Next: verify identity"} <span className="arr">→</span>
              </button>
            </form>
          ) : step === 2 ? (
            <form onSubmit={onSubmitKyc} style={{ maxWidth: 640 }}>
              <div className="note">
                We verify the identity of every lister before a property goes
                live. This is reviewed by our team — no automated ID checker
                is wired up yet.
              </div>

              <div className="field">
                <label htmlFor="k-name">Full legal name</label>
                <input
                  id="k-name"
                  type="text"
                  value={kyc.fullName}
                  onChange={(e) => setKyc({ ...kyc, fullName: e.target.value })}
                  required
                />
              </div>

              <div className="field-row">
                <div className="field">
                  <label htmlFor="k-country">Country</label>
                  <select
                    id="k-country"
                    value={kyc.country}
                    onChange={(e) =>
                      setKyc({
                        ...kyc,
                        country: e.target.value,
                        idType: idTypesForCountry(e.target.value)[0]?.value ?? "PASSPORT",
                      })
                    }
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="k-dob">Date of birth</label>
                  <input
                    id="k-dob"
                    type="date"
                    value={kyc.dateOfBirth}
                    onChange={(e) => setKyc({ ...kyc, dateOfBirth: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="field-row">
                <div className="field">
                  <label htmlFor="k-idtype">ID type</label>
                  <select
                    id="k-idtype"
                    value={kyc.idType}
                    onChange={(e) => setKyc({ ...kyc, idType: e.target.value })}
                  >
                    {idTypeOptions.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="k-idnum">ID number</label>
                  <input
                    id="k-idnum"
                    type="text"
                    value={kyc.idNumber}
                    onChange={(e) => setKyc({ ...kyc, idNumber: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="field-row">
                <div className="field">
                  <label htmlFor="k-phone">Phone number</label>
                  <input
                    id="k-phone"
                    type="tel"
                    value={kyc.phone}
                    onChange={(e) => setKyc({ ...kyc, phone: e.target.value })}
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="k-email">Email</label>
                  <input
                    id="k-email"
                    type="email"
                    value={kyc.email}
                    onChange={(e) => setKyc({ ...kyc, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="field">
                <label htmlFor="k-addr">Residential address</label>
                <input
                  id="k-addr"
                  type="text"
                  value={kyc.residentialAddress}
                  onChange={(e) => setKyc({ ...kyc, residentialAddress: e.target.value })}
                  required
                />
              </div>

              <div className="field-row">
                <div className="field">
                  <label htmlFor="k-father">Father&apos;s name (optional)</label>
                  <input
                    id="k-father"
                    type="text"
                    value={kyc.fatherName}
                    onChange={(e) => setKyc({ ...kyc, fatherName: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label htmlFor="k-mother">Mother&apos;s name (optional)</label>
                  <input
                    id="k-mother"
                    type="text"
                    value={kyc.motherName}
                    onChange={(e) => setKyc({ ...kyc, motherName: e.target.value })}
                  />
                </div>
              </div>

              <div className="field">
                <label htmlFor="k-marital">Marital status (optional)</label>
                <select
                  id="k-marital"
                  value={kyc.maritalStatus}
                  onChange={(e) => setKyc({ ...kyc, maritalStatus: e.target.value })}
                >
                  <option value="">Prefer not to say</option>
                  <option value="SINGLE">Single</option>
                  <option value="MARRIED">Married</option>
                  <option value="DIVORCED">Divorced</option>
                  <option value="WIDOWED">Widowed</option>
                </select>
              </div>

              <div className="field-row">
                <div className="field">
                  <label htmlFor="k-ec-name">Emergency contact name (optional)</label>
                  <input
                    id="k-ec-name"
                    type="text"
                    value={kyc.emergencyContactName}
                    onChange={(e) =>
                      setKyc({ ...kyc, emergencyContactName: e.target.value })
                    }
                  />
                </div>
                <div className="field">
                  <label htmlFor="k-ec-phone">Emergency contact phone (optional)</label>
                  <input
                    id="k-ec-phone"
                    type="tel"
                    value={kyc.emergencyContactPhone}
                    onChange={(e) =>
                      setKyc({ ...kyc, emergencyContactPhone: e.target.value })
                    }
                  />
                </div>
              </div>

              {error && (
                <div className="banner warn" style={{ marginTop: 8 }}>
                  <span>{error}</span>
                </div>
              )}

              <button className="btn" style={{ marginTop: 8 }} type="submit" disabled={submitting}>
                {submitting ? "Saving..." : "Next: socials"} <span className="arr">→</span>
              </button>
            </form>
          ) : (
            <form onSubmit={onSubmitSocials} style={{ maxWidth: 640 }}>
              <div className="note">
                Optional, but it helps us verify you faster and reach you
                about your application.
              </div>

              <div className="field">
                <label htmlFor="s-x">X (Twitter) handle</label>
                <input
                  id="s-x"
                  type="text"
                  placeholder="@yourhandle"
                  value={socials.xHandle}
                  onChange={(e) => setSocials({ ...socials, xHandle: e.target.value })}
                />
              </div>

              <div className="field">
                <label htmlFor="s-tg">Telegram handle</label>
                <input
                  id="s-tg"
                  type="text"
                  placeholder="@yourhandle"
                  value={socials.telegramHandle}
                  onChange={(e) =>
                    setSocials({ ...socials, telegramHandle: e.target.value })
                  }
                />
              </div>

              {error && (
                <div className="banner warn" style={{ marginTop: 8 }}>
                  <span>{error}</span>
                </div>
              )}

              <button className="btn" style={{ marginTop: 8 }} type="submit" disabled={submitting}>
                {submitting ? "Submitting..." : "Submit application"} <span className="arr">→</span>
              </button>
            </form>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

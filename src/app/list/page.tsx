"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import type { Address } from "viem";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import GlitchWord from "@/components/GlitchWord";
import { ConfigNeeded } from "@/components/States";
import { useNetworkGuard } from "@/hooks/useNetworkGuard";
import { useCreateRaise } from "@/hooks/useCreateRaise";
import { createAsset, linkRaiseAddress } from "@/app/actions/assets";
import { areContractsConfigured } from "@/lib/contracts/addresses";
import {
  parseUsdc,
  parseApyToBps,
  formatUsd,
  requiredRentDeposit,
} from "@/lib/format";
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

type Step = 0 | 1 | 2 | 3; // 0 form, 1 creating, 2 securing rent, 3 done

export default function ListPage() {
  const router = useRouter();
  const { address } = useAccount();
  const guard = useNetworkGuard();
  const { createRaise, depositRent } = useCreateRaise();

  const [step, setStep] = useState<Step>(0);
  const [error, setError] = useState<string | null>(null);
  const [raiseAddr, setRaiseAddr] = useState<Address | null>(null);

  const [form, setForm] = useState({
    name: "",
    city: "",
    region: "",
    description: "",
    assetType: "RESIDENTIAL" as AssetType,
    target: "",
    apy: "",
  });

  function symbolFrom(name: string): string {
    const base = name
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 6);
    return `RRWA${base ? "-" + base : ""}`.slice(0, 11);
  }

  const rentPreview =
    form.target && form.apy
      ? (() => {
          try {
            return formatUsd(
              requiredRentDeposit(parseUsdc(form.target), parseApyToBps(form.apy))
            );
          } catch {
            return null;
          }
        })()
      : null;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!address) return;

    let target: bigint;
    let apyBps: number;
    try {
      target = parseUsdc(form.target);
      apyBps = parseApyToBps(form.apy);
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

    // 1) save metadata off-chain
    const created = await createAsset({
      name: form.name,
      city: form.city,
      region: form.region,
      description: form.description,
      assetType: form.assetType,
      lister: address,
      targetUsdc: target.toString(),
      apyBps,
      coverImageUrl: "",
    });
    if (!created.ok) {
      setError(created.error);
      return;
    }

    // 2) create raise on chain
    setStep(1);
    const addr = await createRaise({
      target,
      apyBps,
      assetName: form.name,
      shareSymbol: symbolFrom(form.name),
    });
    if (!addr) {
      setStep(0);
      setError("The raise wasn't created on chain. Nothing was charged.");
      return;
    }
    setRaiseAddr(addr);

    // link the on-chain address back to the metadata row
    await linkRaiseAddress({ assetId: created.data.id, raiseAddress: addr });

    // 3) deposit rent
    setStep(2);
    const rentOk = await depositRent(addr);
    if (!rentOk) {
      setError(
        "Rent wasn't secured, so the asset isn't live yet. You can retry securing rent from the asset page."
      );
      // still move forward — the raise exists
      setStep(3);
      return;
    }
    setStep(3);
  }

  if (!areContractsConfigured()) {
    return (
      <>
        <SiteHeader />
        <main>
          <div className="wrap page">
            <ConfigNeeded what="Listing" />
          </div>
        </main>
        <SiteFooter />
      </>
    );
  }

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
              Set a funding target and a fixed APY. Three years of rent is
              secured upfront through RRWA — that&apos;s what backs every payout
              to your funders.
            </p>
          </div>

          {step > 0 && (
            <div className="stepper">
              <div
                className={`stepper-item ${step === 1 ? "active" : step > 1 ? "done" : ""}`}
              >
                <span className="stepper-num">i.</span>
                <div>
                  <div className="stepper-label">Create raise</div>
                  <div className="stepper-sub">Deploy the raise on chain</div>
                </div>
              </div>
              <div
                className={`stepper-item ${step === 2 ? "active" : step > 2 ? "done" : ""}`}
              >
                <span className="stepper-num">ii.</span>
                <div>
                  <div className="stepper-label">Secure rent</div>
                  <div className="stepper-sub">Deposit 3 years upfront</div>
                </div>
              </div>
              <div className={`stepper-item ${step === 3 ? "active" : ""}`}>
                <span className="stepper-num">iii.</span>
                <div>
                  <div className="stepper-label">Live</div>
                  <div className="stepper-sub">Open for funding</div>
                </div>
              </div>
            </div>
          )}

          {step === 3 ? (
            <div className="state-box">
              <h3>Your asset is listed</h3>
              <p>
                {raiseAddr
                  ? "Your raise is on chain and ready for funders."
                  : "Your raise was created."}
              </p>
              {raiseAddr && (
                <button
                  className="btn"
                  onClick={() => router.push(`/asset/${raiseAddr}`)}
                >
                  View your asset <span className="arr">→</span>
                </button>
              )}
            </div>
          ) : !guard.isConnected ? (
            <div className="state-box">
              <h3>Connect to list</h3>
              <p>Connect your wallet to create a raise and secure rent.</p>
              <div style={{ display: "flex", justifyContent: "center" }}>
                <ConnectButton />
              </div>
            </div>
          ) : guard.wrongNetwork ? (
            <div className="banner warn">
              <span>RRWA runs on Robinhood Chain. Switch networks to list.</span>
              <button
                className="btn"
                onClick={guard.switchToChain}
                disabled={guard.switching}
              >
                {guard.switching ? "Switching..." : "Switch network"}
              </button>
            </div>
          ) : (
            <form onSubmit={onSubmit} style={{ maxWidth: 640 }}>
              <div className="note">
                Three years of rent is secured upfront through RRWA. This is
                what guarantees your funders&apos; APY — we hold it, and we
                handle every distribution for you.
              </div>

              <div className="field">
                <label htmlFor="f-name">Asset name</label>
                <input
                  id="f-name"
                  type="text"
                  placeholder="2BHK Apartment, Jaipur"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>

              <div className="field-row">
                <div className="field">
                  <label htmlFor="f-city">City</label>
                  <input
                    id="f-city"
                    type="text"
                    placeholder="Jaipur"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="f-region">Region / state</label>
                  <input
                    id="f-region"
                    type="text"
                    placeholder="Rajasthan"
                    value={form.region}
                    onChange={(e) =>
                      setForm({ ...form, region: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="field-row">
                <div className="field">
                  <label htmlFor="f-target">Funding target (USD)</label>
                  <input
                    id="f-target"
                    type="text"
                    inputMode="decimal"
                    placeholder="10,000"
                    value={form.target}
                    onChange={(e) =>
                      setForm({ ...form, target: e.target.value })
                    }
                    required
                  />
                  <div className="hint">
                    You withdraw the full amount once the raise is complete.
                  </div>
                </div>
                <div className="field">
                  <label htmlFor="f-apy">APY offered (% p.a.)</label>
                  <input
                    id="f-apy"
                    type="text"
                    inputMode="decimal"
                    placeholder="9.5"
                    value={form.apy}
                    onChange={(e) => setForm({ ...form, apy: e.target.value })}
                    required
                  />
                  <div className="hint">
                    Paid to funders from your secured rent.
                  </div>
                </div>
              </div>

              <div className="field">
                <label htmlFor="f-type">Asset type</label>
                <select
                  id="f-type"
                  value={form.assetType}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      assetType: e.target.value as AssetType,
                    })
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
                  placeholder="A short description of the asset"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  required
                />
              </div>

              {rentPreview && (
                <div className="note" style={{ borderLeftColor: "var(--blue-deep)" }}>
                  Rent to secure upfront: <b>{rentPreview}</b> (target × APY × 3
                  years). You&apos;ll approve and deposit this in step two.
                </div>
              )}

              {error && (
                <div className="banner warn" style={{ marginTop: 8 }}>
                  <span>{error}</span>
                </div>
              )}

              <button
                className="btn"
                style={{ marginTop: 8 }}
                type="submit"
                disabled={step !== 0}
              >
                Submit listing <span className="arr">→</span>
              </button>
            </form>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

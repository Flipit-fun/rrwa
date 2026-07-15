"use client";

import { useState } from "react";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import GlitchWord from "@/components/GlitchWord";
import RaiseRow from "@/components/RaiseRow";
import { LoadingRows, EmptyState, ErrorState, ConfigNeeded } from "@/components/States";
import { useRaisesWithMeta } from "@/hooks/useRaises";
import { areContractsConfigured } from "@/lib/contracts/addresses";

export default function MarketPage() {
  const [tab, setTab] = useState<"buy" | "list">("buy");
  const { data, isLoading, isError, refetch } = useRaisesWithMeta();

  return (
    <>
      <SiteHeader />
      <main>
        <div className="wrap page">
          <div className="page-head">
            <span className="eyebrow">Marketplace</span>
            <h1>
              Two sides. One <GlitchWord>market</GlitchWord>.
            </h1>
            <p>
              Buy shares in assets raising right now, or list your own and let
              the market fund it.
            </p>
          </div>

          <div className="tabs" role="tablist">
            <button
              className={`tab ${tab === "buy" ? "on" : ""}`}
              onClick={() => setTab("buy")}
            >
              Buy properties
            </button>
            <button
              className={`tab ${tab === "list" ? "on" : ""}`}
              onClick={() => setTab("list")}
            >
              List your asset
            </button>
          </div>

          {tab === "buy" ? (
            <BuyList
              isLoading={isLoading}
              isError={isError}
              refetch={refetch}
              raises={data ?? []}
            />
          ) : (
            <div className="state-box">
              <h3>List a real-world asset</h3>
              <p>
                Set a funding target and a fixed APY, secure three years of rent
                upfront, and let the market fund your asset.
              </p>
              <Link href="/list" className="btn">
                Start a listing <span className="arr">→</span>
              </Link>
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function BuyList({
  isLoading,
  isError,
  refetch,
  raises,
}: {
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
  raises: ReturnType<typeof useRaisesWithMeta>["data"] extends infer T
    ? NonNullable<T>
    : never;
}) {
  if (!areContractsConfigured()) return <ConfigNeeded what="The marketplace" />;
  if (isLoading) return <LoadingRows count={5} />;
  if (isError) {
    return (
      <ErrorState
        message="We couldn't reach the chain to load raises. Check your connection and try again."
        onRetry={refetch}
      />
    );
  }
  if (!raises || raises.length === 0) {
    return (
      <EmptyState
        title="No raises yet"
        message="Nothing is raising right now. Be the first to put a real-world asset on chain."
        ctaHref="/list"
        ctaLabel="List your asset"
      />
    );
  }
  return (
    <div className="plist">
      {raises.map((r) => (
        <RaiseRow key={r.address} raise={r} />
      ))}
    </div>
  );
}

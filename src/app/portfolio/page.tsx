"use client";

import { useState } from "react";
import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import GlitchWord from "@/components/GlitchWord";
import SellShareModal from "@/components/SellShareModal";
import { EmptyState, ErrorState, ConfigNeeded } from "@/components/States";
import { usePortfolio, type Position } from "@/hooks/usePortfolio";
import { useClaimYield } from "@/hooks/useRaiseActions";
import { useNetworkGuard } from "@/hooks/useNetworkGuard";
import { formatUsd, formatApyBps, usdgToNumber } from "@/lib/format";
import { areContractsConfigured } from "@/lib/contracts/addresses";

export default function PortfolioPage() {
  const guard = useNetworkGuard();
  const { data, isLoading, isError, refetch } = usePortfolio();
  const [selling, setSelling] = useState<Position | null>(null);

  return (
    <>
      <SiteHeader />
      <main>
        <div className="wrap page">
          <div className="page-head">
            <span className="eyebrow">Your positions</span>
            <h1>
              Your <GlitchWord>portfolio</GlitchWord>.
            </h1>
            <p>
              Shares you hold, yield you&apos;ve accrued, and a way out whenever
              you want it.
            </p>
          </div>

          {!areContractsConfigured() ? (
            <ConfigNeeded what="Your portfolio" />
          ) : !guard.isConnected ? (
            <div className="state-box">
              <h3>Connect your wallet</h3>
              <p>Connect to see the shares you hold and the yield you&apos;ve earned.</p>
              <div style={{ display: "flex", justifyContent: "center" }}>
                <ConnectButton />
              </div>
            </div>
          ) : isLoading ? (
            <div className="state-box">
              <p>Loading your positions from chain...</p>
            </div>
          ) : isError ? (
            <ErrorState
              message="We couldn't load your positions. Check your connection and try again."
              onRetry={() => refetch()}
            />
          ) : !data || data.length === 0 ? (
            <EmptyState
              title="No positions yet"
              message="You don't hold any shares. Browse the marketplace and fund your first real-world asset."
              ctaHref="/market"
              ctaLabel="Browse assets"
            />
          ) : (
            <PositionList
              positions={data}
              onSell={setSelling}
              onChanged={() => refetch()}
            />
          )}
        </div>
      </main>
      <SiteFooter />

      {selling && (
        <SellShareModal
          raise={selling.address}
          shareToken={selling.shareToken}
          shareBalance={selling.shares}
          assetName={selling.meta?.name ?? "Your position"}
          matured={selling.matured}
          onClose={() => setSelling(null)}
          onListed={() => {
            setSelling(null);
            refetch();
          }}
        />
      )}
    </>
  );
}

function PositionList({
  positions,
  onSell,
  onChanged,
}: {
  positions: Position[];
  onSell: (p: Position) => void;
  onChanged: () => void;
}) {
  const totalShares = positions.reduce((a, p) => a + p.shares, 0n);
  const totalEarned = positions.reduce((a, p) => a + p.earned, 0n);

  return (
    <>
      <div className="stat-row">
        <div className="stat">
          <b>{positions.length}</b>
          <span>Assets held</span>
        </div>
        <div className="stat">
          <b>{formatUsd(totalShares)}</b>
          <span>Total shares</span>
        </div>
        <div className="stat">
          <b>{formatUsd(totalEarned, { cents: true })}</b>
          <span>Accrued yield</span>
        </div>
      </div>

      <div className="pos-list">
        {positions.map((p) => (
          <PositionRow
            key={p.address}
            position={p}
            onSell={() => onSell(p)}
            onChanged={onChanged}
          />
        ))}
      </div>
    </>
  );
}

function PositionRow({
  position,
  onSell,
  onChanged,
}: {
  position: Position;
  onSell: () => void;
  onChanged: () => void;
}) {
  const { claim, pending } = useClaimYield(position.rentVault);
  const name = position.meta?.name ?? "Untitled asset";
  const location = position.meta
    ? `${position.meta.city}, ${position.meta.region}`
    : "";

  return (
    <div className="pos-row">
      <div className="p-name">
        <Link
          href={`/asset/${position.address}`}
          style={{ textDecoration: "none", color: "inherit" }}
        >
          <GlitchWord>{name}</GlitchWord>
        </Link>
        {location && <small>{location}</small>}
      </div>
      <div>
        <div className="stat" style={{ border: "none", padding: 0, margin: 0 }}>
          <b style={{ fontSize: 22 }}>{formatUsd(position.shares)}</b>
          <span>Shares · {formatApyBps(position.apyBps)} APY</span>
        </div>
      </div>
      <div>
        <div className="stat" style={{ border: "none", padding: 0, margin: 0 }}>
          <b style={{ fontSize: 22 }}>
            {formatUsd(position.earned, { cents: true })}
          </b>
          <span>Accrued yield</span>
        </div>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <button
          className="btn"
          disabled={pending || usdgToNumber(position.earned) <= 0}
          onClick={async () => {
            const ok = await claim();
            if (ok) onChanged();
          }}
        >
          {pending ? "..." : "Claim"}
        </button>
        <button className="btn line" onClick={onSell}>
          Sell share
        </button>
      </div>
    </div>
  );
}

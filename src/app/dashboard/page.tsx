"use client";

import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import GlitchWord from "@/components/GlitchWord";
import { EmptyState, ErrorState } from "@/components/States";
import { usePortfolio, type Position } from "@/hooks/usePortfolio";
import { useClaimYield } from "@/hooks/useRaiseActions";
import { useDepositHistory, usePayoutHistory } from "@/hooks/useDashboard";
import { useNetworkGuard } from "@/hooks/useNetworkGuard";
import { formatUsd, formatApyBps, usdgToNumber, weeklyAccruedYield } from "@/lib/format";
import { txUrl } from "@/lib/explorer";

export default function DashboardPage() {
  const guard = useNetworkGuard();
  const portfolio = usePortfolio();
  const deposits = useDepositHistory();
  const payouts = usePayoutHistory();

  const positions = portfolio.data ?? [];
  const totalShares = positions.reduce((a, p) => a + p.shares, 0n);
  const totalEarnedOnChain = positions.reduce((a, p) => a + p.earned, 0n);
  const totalPoolDeposited = (deposits.data ?? []).reduce(
    (sum, d) => sum + BigInt(d.amountUsdc),
    0n
  );
  const totalPoolYieldAccrued = (deposits.data ?? []).reduce((sum, d) => {
    return sum + weeklyAccruedYield(BigInt(d.amountUsdc), d.asset.apyBps, d.createdAt);
  }, 0n);

  return (
    <>
      <SiteHeader />
      <main>
        <div className="wrap page">
          <div className="page-head">
            <span className="eyebrow">Your dashboard</span>
            <h1>
              What you&apos;ve <GlitchWord>earned</GlitchWord>.
            </h1>
            <p>
              Every property you&apos;ve invested in, what you&apos;ve put in,
              and what you&apos;ve earned so far — all in one place.
            </p>
          </div>

          {!guard.isConnected ? (
            <div className="state-box">
              <h3>Connect your wallet</h3>
              <p>Connect to see your positions and earnings.</p>
              <div style={{ display: "flex", justifyContent: "center" }}>
                <ConnectButton />
              </div>
            </div>
          ) : (
            <>
              <div className="stat-row">
                <div className="stat">
                  <b>{positions.length + new Set((deposits.data ?? []).map((d) => d.assetId)).size}</b>
                  <span>Properties invested in</span>
                </div>
                <div className="stat">
                  <b>{formatUsd(totalShares + totalPoolDeposited)}</b>
                  <span>Total invested</span>
                </div>
                <div className="stat">
                  <b>
                    {formatUsd(totalEarnedOnChain + totalPoolYieldAccrued, {
                      cents: true,
                    })}
                  </b>
                  <span>Earned so far</span>
                </div>
              </div>

              <section style={{ marginTop: 56 }}>
                <h2 className="dash-sec-title">Your properties</h2>
                {portfolio.isLoading ? (
                  <div className="state-box">
                    <p>Loading your positions...</p>
                  </div>
                ) : portfolio.isError ? (
                  <ErrorState
                    message="We couldn't load your positions. Check your connection and try again."
                    onRetry={() => portfolio.refetch()}
                  />
                ) : positions.length === 0 ? (
                  <EmptyState
                    title="No properties yet"
                    message="You haven't invested in any property. Pick one and start earning."
                    ctaHref="/pool"
                    ctaLabel="Browse properties"
                  />
                ) : (
                  <div className="pos-list">
                    {positions.map((p) => (
                      <DashboardPositionRow key={p.address} position={p} />
                    ))}
                  </div>
                )}
              </section>

              <section style={{ marginTop: 56 }}>
                <h2 className="dash-sec-title">Your property investments</h2>
                {deposits.isLoading ? (
                  <div className="state-box">
                    <p>Loading deposit history...</p>
                  </div>
                ) : !deposits.data || deposits.data.length === 0 ? (
                  <div className="state-box">
                    <h3>No investments yet</h3>
                    <p>
                      Amounts sent directly to a property&apos;s treasury
                      wallet will show up here.
                    </p>
                  </div>
                ) : (
                  <div className="dash-table">
                    <div className="dash-table-head cols-5">
                      <span>Property</span>
                      <span>Date</span>
                      <span>Amount</span>
                      <span>Yield so far</span>
                      <span>Transaction</span>
                    </div>
                    {deposits.data.map((d) => (
                      <div className="dash-table-row cols-5" key={d.id}>
                        <span>
                          <Link href={`/properties/${d.assetId}`}>
                            {d.asset.name}
                          </Link>
                        </span>
                        <span>{new Date(d.createdAt).toLocaleDateString()}</span>
                        <span>{formatUsd(BigInt(d.amountUsdc))}</span>
                        <span>
                          {formatUsd(
                            weeklyAccruedYield(BigInt(d.amountUsdc), d.asset.apyBps, d.createdAt),
                            { cents: true }
                          )}
                        </span>
                        <span>
                          {txUrl(d.txHash) ? (
                            <a href={txUrl(d.txHash)} target="_blank" rel="noopener noreferrer">
                              View
                            </a>
                          ) : (
                            <code style={{ fontSize: 12 }}>
                              {d.txHash.slice(0, 10)}…
                            </code>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section style={{ marginTop: 56, marginBottom: 40 }}>
                <h2 className="dash-sec-title">Withdrawal &amp; yield requests</h2>
                {payouts.isLoading ? (
                  <div className="state-box">
                    <p>Loading requests...</p>
                  </div>
                ) : !payouts.data || payouts.data.length === 0 ? (
                  <div className="state-box">
                    <h3>No requests yet</h3>
                    <p>
                      Requests to withdraw or claim yield from a property will
                      show up here.
                    </p>
                    <Link href="/pool" className="btn line">
                      Go to properties <span className="arr">→</span>
                    </Link>
                  </div>
                ) : (
                  <div className="dash-table">
                    <div className="dash-table-head cols-5">
                      <span>Property</span>
                      <span>Date</span>
                      <span>Type</span>
                      <span>Amount</span>
                      <span>Status</span>
                    </div>
                    {payouts.data.map((r) => (
                      <div className="dash-table-row cols-5" key={r.id}>
                        <span>
                          <Link href={`/properties/${r.assetId}`}>
                            {r.asset.name}
                          </Link>
                        </span>
                        <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                        <span>{r.kind === "WITHDRAWAL" ? "Withdrawal" : "Yield"}</span>
                        <span>{formatUsd(BigInt(r.amountUsdc))}</span>
                        <span className={`dash-status dash-status-${r.status.toLowerCase()}`}>
                          {r.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function DashboardPositionRow({ position }: { position: Position }) {
  const { claim, pending } = useClaimYield(position.rentVault);
  const name = position.meta?.name ?? "Untitled property";
  const location = position.meta
    ? `${position.meta.city}, ${position.meta.region}`
    : "";

  return (
    <div className="pos-row">
      <div className="p-name">
        <Link
          href={`/properties/${position.meta?.id ?? position.address}`}
          style={{ textDecoration: "none", color: "inherit" }}
        >
          <GlitchWord>{name}</GlitchWord>
        </Link>
        {location && <small>{location}</small>}
      </div>
      <div>
        <div className="stat" style={{ border: "none", padding: 0, margin: 0 }}>
          <b style={{ fontSize: 22 }}>{formatUsd(position.shares)}</b>
          <span>Invested · {formatApyBps(position.apyBps)} APY</span>
        </div>
      </div>
      <div>
        <div className="stat" style={{ border: "none", padding: 0, margin: 0 }}>
          <b style={{ fontSize: 22 }}>
            {formatUsd(position.earned, { cents: true })}
          </b>
          <span>Earned so far</span>
        </div>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <button
          className="btn"
          disabled={pending || usdgToNumber(position.earned) <= 0}
          onClick={() => claim()}
        >
          {pending ? "..." : "Claim"}
        </button>
      </div>
    </div>
  );
}

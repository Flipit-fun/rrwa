"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import type { Address } from "viem";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import GlitchWord from "@/components/GlitchWord";
import { EmptyState, ErrorState, ConfigNeeded } from "@/components/States";
import { useRaise } from "@/hooks/useRaises";
import {
  useUsdcPosition,
  useSharePosition,
  useFund,
  useWithdraw,
  useClaimYield,
} from "@/hooks/useRaiseActions";
import { useNetworkGuard } from "@/hooks/useNetworkGuard";
import {
  formatUsd,
  formatApyBps,
  progressPct,
  usdcToNumber,
} from "@/lib/format";
import { RaiseState } from "@/lib/contracts/abis";
import { areContractsConfigured } from "@/lib/contracts/addresses";
import { useAccount } from "wagmi";

export default function AssetDetailPage() {
  const params = useParams();
  const id = (Array.isArray(params.id) ? params.id[0] : params.id) as
    | Address
    | undefined;

  const { data: raise, isLoading, isError, refetch } = useRaise(id);

  return (
    <>
      <SiteHeader />
      <main>
        <div className="wrap page">
          {!areContractsConfigured() ? (
            <ConfigNeeded what="This asset" />
          ) : isLoading ? (
            <DetailSkeleton />
          ) : isError || !raise ? (
            <ErrorState
              message="We couldn't load this asset from the chain. It may not exist, or the network is unreachable."
              onRetry={() => refetch()}
            />
          ) : (
            <AssetDetail raise={raise} onChanged={() => refetch()} />
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function DetailSkeleton() {
  return (
    <div className="detail-grid">
      <div>
        <div className="skeleton" style={{ height: 48, width: "70%" }} />
        <div
          className="skeleton"
          style={{ height: 16, width: "40%", marginTop: 16 }}
        />
        <div
          className="skeleton"
          style={{ height: 120, width: "100%", marginTop: 32 }}
        />
      </div>
      <div className="card">
        <div className="skeleton" style={{ height: 200, width: "100%" }} />
      </div>
    </div>
  );
}

function AssetDetail({
  raise,
  onChanged,
}: {
  raise: NonNullable<ReturnType<typeof useRaise>["data"]>;
  onChanged: () => void;
}) {
  const { address } = useAccount();
  const guard = useNetworkGuard();
  const [amount, setAmount] = useState("");

  const { balance } = useUsdcPosition(raise.address);
  const { shares, earned } = useSharePosition(
    raise.shareToken,
    raise.rentVault
  );
  const { fund, pending: funding } = useFund(raise.address);
  const { withdraw, pending: withdrawing } = useWithdraw(raise.address);
  const { claim, pending: claiming } = useClaimYield(raise.rentVault);

  const name = raise.meta?.name ?? "Untitled asset";
  const location = raise.meta
    ? `${raise.meta.city}, ${raise.meta.region}`
    : "Location pending";
  const pct = progressPct(raise.raised, raise.target);
  const remaining = raise.target - raise.raised;
  const isLister =
    address && address.toLowerCase() === raise.lister.toLowerCase();

  const shareBalance = (shares.data as bigint | undefined) ?? 0n;
  const earnedAmount = (earned.data as bigint | undefined) ?? 0n;
  const usdcBalance = (balance.data as bigint | undefined) ?? 0n;

  async function onFund() {
    const ok = await fund(amount);
    if (ok) {
      setAmount("");
      onChanged();
    }
  }

  return (
    <div className="detail-grid">
      <div>
        <span className="eyebrow">{location}</span>
        <h1 style={{ marginBottom: 8 }}>
          <GlitchWord>{name}</GlitchWord>
        </h1>

        <div className="stat-row">
          <div className="stat">
            <b>{formatApyBps(raise.apyBps)}</b>
            <span>APY</span>
          </div>
          <div className="stat">
            <b>{formatUsd(raise.target)}</b>
            <span>Target</span>
          </div>
          <div className="stat">
            <b>{raise.funderCount}</b>
            <span>Funders</span>
          </div>
        </div>

        <div style={{ margin: "28px 0" }}>
          <div className="p-fund">
            <div className="thin-bar">
              <i
                className={raise.state !== RaiseState.Raising ? "done" : ""}
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="nums" style={{ marginTop: 12 }}>
              <b>{formatUsd(raise.raised)}</b> raised of{" "}
              {formatUsd(raise.target)} · {pct.toFixed(0)}%
            </div>
          </div>
        </div>

        {raise.meta?.description && (
          <p
            style={{
              color: "var(--body)",
              lineHeight: 1.8,
              fontSize: 15,
              maxWidth: 520,
            }}
          >
            {raise.meta.description}
          </p>
        )}
      </div>

      {/* action card */}
      <div className="card">
        {!guard.isConnected ? (
          <>
            <h3
              style={{
                fontFamily: "var(--serif)",
                fontWeight: 400,
                fontSize: 26,
                marginBottom: 10,
              }}
            >
              Connect to continue
            </h3>
            <p
              style={{
                color: "var(--body)",
                fontSize: 14,
                lineHeight: 1.6,
                marginBottom: 20,
              }}
            >
              Connect your wallet to fund this raise or manage your position.
            </p>
            <ConnectButton />
          </>
        ) : guard.wrongNetwork ? (
          <WrongNetwork guard={guard} />
        ) : (
          <>
            {raise.state === RaiseState.Raising && (
              <>
                <h3
                  style={{
                    fontFamily: "var(--serif)",
                    fontWeight: 400,
                    fontSize: 26,
                    marginBottom: 6,
                  }}
                >
                  Fund this asset
                </h3>
                <p
                  style={{
                    color: "var(--faint)",
                    fontSize: 13,
                    marginBottom: 20,
                  }}
                >
                  {formatUsd(remaining)} left to reach target · shares mint 1:1
                </p>
                <div className="field">
                  <label htmlFor="amount">Amount (USDC)</label>
                  <input
                    id="amount"
                    inputMode="decimal"
                    placeholder="1,000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                  <div className="hint">
                    Wallet balance: {formatUsd(usdcBalance)}
                  </div>
                </div>
                <button
                  className="btn"
                  style={{ width: "100%", justifyContent: "center" }}
                  disabled={funding || !amount}
                  onClick={onFund}
                >
                  {funding ? "Working..." : "Approve & fund"}
                </button>
              </>
            )}

            {raise.state === RaiseState.Funded && isLister && (
              <>
                <h3
                  style={{
                    fontFamily: "var(--serif)",
                    fontWeight: 400,
                    fontSize: 26,
                    marginBottom: 10,
                  }}
                >
                  Fully funded
                </h3>
                <p
                  style={{
                    color: "var(--body)",
                    fontSize: 14,
                    lineHeight: 1.6,
                    marginBottom: 20,
                  }}
                >
                  Your raise hit its target. Withdraw the full{" "}
                  {formatUsd(raise.raised)} in one go. This starts the rent
                  stream for your funders.
                </p>
                <button
                  className="btn"
                  style={{ width: "100%", justifyContent: "center" }}
                  disabled={withdrawing}
                  onClick={async () => {
                    const ok = await withdraw();
                    if (ok) onChanged();
                  }}
                >
                  {withdrawing ? "Working..." : "Withdraw full amount"}
                </button>
              </>
            )}

            {raise.state === RaiseState.Funded && !isLister && (
              <div>
                <h3
                  style={{
                    fontFamily: "var(--serif)",
                    fontWeight: 400,
                    fontSize: 26,
                    marginBottom: 10,
                  }}
                >
                  Target reached
                </h3>
                <p style={{ color: "var(--body)", fontSize: 14, lineHeight: 1.6 }}>
                  This raise is fully funded and awaiting the lister&apos;s
                  withdrawal. Yield begins streaming once they withdraw.
                </p>
              </div>
            )}

            {(raise.state === RaiseState.Active ||
              raise.state === RaiseState.Matured) && (
              <>
                <h3
                  style={{
                    fontFamily: "var(--serif)",
                    fontWeight: 400,
                    fontSize: 26,
                    marginBottom: 16,
                  }}
                >
                  Your position
                </h3>
                <div className="fee-row">
                  <span>Shares held</span>
                  <b>{formatUsd(shareBalance)}</b>
                </div>
                <div className="fee-row">
                  <span>Accrued yield</span>
                  <b>{formatUsd(earnedAmount, { cents: true })}</b>
                </div>
                <button
                  className="btn"
                  style={{
                    width: "100%",
                    justifyContent: "center",
                    marginTop: 18,
                  }}
                  disabled={claiming || usdcToNumber(earnedAmount) <= 0}
                  onClick={async () => {
                    const ok = await claim();
                    if (ok) {
                      earned.refetch?.();
                      onChanged();
                    }
                  }}
                >
                  {claiming ? "Working..." : "Claim yield"}
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function WrongNetwork({
  guard,
}: {
  guard: ReturnType<typeof useNetworkGuard>;
}) {
  return (
    <>
      <h3
        style={{
          fontFamily: "var(--serif)",
          fontWeight: 400,
          fontSize: 26,
          marginBottom: 10,
        }}
      >
        Wrong network
      </h3>
      <p
        style={{
          color: "var(--body)",
          fontSize: 14,
          lineHeight: 1.6,
          marginBottom: 20,
        }}
      >
        RRWA runs on Robinhood Chain. Switch networks to continue.
      </p>
      <button
        className="btn"
        style={{ width: "100%", justifyContent: "center" }}
        disabled={guard.switching}
        onClick={guard.switchToChain}
      >
        {guard.switching ? "Switching..." : "Switch to Robinhood Chain"}
      </button>
    </>
  );
}

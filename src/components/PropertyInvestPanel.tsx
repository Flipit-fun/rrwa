"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import type { Address } from "viem";
import { useRaise } from "@/hooks/useRaises";
import {
  useUsdgPosition,
  useSharePosition,
  useFund,
  useWithdraw,
  useClaimYield,
} from "@/hooks/useRaiseActions";
import { useNetworkGuard } from "@/hooks/useNetworkGuard";
import { formatUsd, progressPct, usdgToNumber } from "@/lib/format";
import { RaiseState } from "@/lib/contracts/abis";
import type { AssetMetadata } from "@/lib/assets";

/**
 * Per-property investing panel — deposit into a single property's Raise the
 * same way the pooled yield page works, but scoped to one property. Shows
 * real on-chain raised/remaining/min/max instead of any fixed-up numbers.
 */
export default function PropertyInvestPanel({
  property,
}: {
  property: AssetMetadata;
}) {
  const raiseAddress = property.raiseAddress as Address | undefined;
  const { data: raise, isLoading, refetch } = useRaise(raiseAddress);
  const guard = useNetworkGuard();
  const { address } = useAccount();
  const [amount, setAmount] = useState("");

  const { balance } = useUsdgPosition(raiseAddress);
  const { shares, earned } = useSharePosition(
    raise?.shareToken,
    raise?.rentVault
  );
  const { fund, pending: funding } = useFund(raiseAddress);
  const { withdraw, pending: withdrawing } = useWithdraw(raiseAddress);
  const { claim, pending: claiming } = useClaimYield(raise?.rentVault);

  if (!raiseAddress) {
    // No on-chain raise yet — show the preview terms honestly, no invented numbers.
    return (
      <div className="card">
        <h3 style={{ fontFamily: "var(--serif)", fontWeight: 400, fontSize: 22, marginBottom: 10 }}>
          Not open for investment yet
        </h3>
        <p style={{ color: "var(--body)", fontSize: 14, lineHeight: 1.6, marginBottom: 16 }}>
          This listing hasn&apos;t been put on chain yet. Here are the terms
          it&apos;s expected to open with once it does.
        </p>
        <div className="fee-row">
          <span>Fixed APY</span>
          <b>{(property.apyBps / 100).toFixed(1)}%</b>
        </div>
        {property.minContributionUsdc && (
          <div className="fee-row">
            <span>Minimum investment</span>
            <b>{formatUsd(BigInt(property.minContributionUsdc))}</b>
          </div>
        )}
        {property.maxContributionUsdc && (
          <div className="fee-row">
            <span>Maximum per wallet</span>
            <b>{formatUsd(BigInt(property.maxContributionUsdc))}</b>
          </div>
        )}
      </div>
    );
  }

  if (isLoading || !raise) {
    return (
      <div className="card">
        <div className="skeleton" style={{ height: 180, width: "100%" }} />
      </div>
    );
  }

  const pct = progressPct(raise.raised, raise.target);
  const remaining = raise.target - raise.raised;
  const shareBalance = (shares.data as bigint | undefined) ?? 0n;
  const earnedAmount = (earned.data as bigint | undefined) ?? 0n;
  const usdgBalance = (balance.data as bigint | undefined) ?? 0n;
  const isLister =
    address && address.toLowerCase() === raise.lister.toLowerCase();

  async function onFund() {
    const ok = await fund(amount);
    if (ok) {
      setAmount("");
      refetch();
      shares.refetch?.();
      balance.refetch?.();
    }
  }

  return (
    <div className="card">
      <div className="fee-row">
        <span>Invested so far</span>
        <b>{formatUsd(raise.raised)}</b>
      </div>
      <div className="fee-row">
        <span>Remaining to target</span>
        <b>{formatUsd(remaining)}</b>
      </div>
      <div className="thin-bar" style={{ margin: "12px 0 18px" }}>
        <i
          className={raise.state !== RaiseState.Raising ? "done" : ""}
          style={{ width: `${pct}%` }}
        />
      </div>

      {!guard.isConnected ? (
        <>
          <h3 style={{ fontFamily: "var(--serif)", fontWeight: 400, fontSize: 22, marginBottom: 10 }}>
            Connect to invest
          </h3>
          <ConnectButton />
        </>
      ) : guard.wrongNetwork ? (
        <>
          <p style={{ color: "var(--body)", fontSize: 14, marginBottom: 14 }}>
            RRWA runs on Robinhood Chain. Switch networks to continue.
          </p>
          <button
            className="btn"
            style={{ width: "100%", justifyContent: "center" }}
            disabled={guard.switching}
            onClick={guard.switchToChain}
          >
            {guard.switching ? "Switching..." : "Switch network"}
          </button>
        </>
      ) : raise.state === RaiseState.Raising ? (
        <>
          <div className="field">
            <label htmlFor="p-amount">Amount (USDG)</label>
            <input
              id="p-amount"
              inputMode="decimal"
              placeholder="1,000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <div className="hint">
              Wallet balance: {formatUsd(usdgBalance)}
              {raise.minContribution > 0n &&
                ` · min ${formatUsd(raise.minContribution)}`}
              {raise.maxContribution > 0n &&
                ` · max ${formatUsd(raise.maxContribution)} per wallet`}
            </div>
          </div>
          <button
            className="btn"
            style={{ width: "100%", justifyContent: "center" }}
            disabled={funding || !amount}
            onClick={onFund}
          >
            {funding ? "Working..." : "Approve & invest"}
          </button>
        </>
      ) : raise.state === RaiseState.Funded && isLister ? (
        <button
          className="btn"
          style={{ width: "100%", justifyContent: "center" }}
          disabled={withdrawing}
          onClick={async () => {
            const ok = await withdraw();
            if (ok) refetch();
          }}
        >
          {withdrawing ? "Working..." : "Withdraw full amount"}
        </button>
      ) : raise.state === RaiseState.Funded ? (
        <p style={{ color: "var(--body)", fontSize: 14, lineHeight: 1.6 }}>
          Fully funded, awaiting the lister&apos;s withdrawal. Yield begins
          once they withdraw.
        </p>
      ) : (
        <>
          <div className="fee-row">
            <span>Your shares</span>
            <b>{formatUsd(shareBalance)}</b>
          </div>
          <div className="fee-row">
            <span>Accrued yield</span>
            <b>{formatUsd(earnedAmount, { cents: true })}</b>
          </div>
          <button
            className="btn"
            style={{ width: "100%", justifyContent: "center", marginTop: 14 }}
            disabled={claiming || usdgToNumber(earnedAmount) <= 0}
            onClick={async () => {
              const ok = await claim();
              if (ok) {
                earned.refetch?.();
                refetch();
              }
            }}
          >
            {claiming ? "Working..." : "Claim yield"}
          </button>
        </>
      )}
    </div>
  );
}

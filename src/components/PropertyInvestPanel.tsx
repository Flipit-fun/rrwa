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
import {
  useUsdgBalance,
  useDepositTotal,
  useDepositToTreasury,
  usePayoutRequest,
} from "@/hooks/useTreasuryPool";
import { useNetworkGuard } from "@/hooks/useNetworkGuard";
import { formatUsd, progressPct, usdgToNumber } from "@/lib/format";
import { RaiseState } from "@/lib/contracts/abis";
import type { AssetMetadata } from "@/lib/assets";

/**
 * Per-property investing panel. Two modes:
 *   - On-chain raise (property.raiseAddress set): fund/withdraw/claim via
 *     the Raise contract, same as before.
 *   - Manual treasury (property.treasuryAddress set, no raise): invest by
 *     sending USDG directly to that property's dedicated wallet. Withdrawals
 *     and yield are requested and paid out manually by the RRWA team, capped
 *     server-side at what was actually deposited into this property.
 */
export default function PropertyInvestPanel({
  property,
}: {
  property: AssetMetadata;
}) {
  const raiseAddress = property.raiseAddress as Address | undefined;

  if (raiseAddress) {
    return <OnChainRaisePanel raiseAddress={raiseAddress} />;
  }
  if (property.treasuryAddress) {
    return (
      <ManualTreasuryPanel
        property={property}
        treasuryAddress={property.treasuryAddress as Address}
      />
    );
  }

  return (
    <div className="card">
      <h3 style={{ fontFamily: "var(--serif)", fontWeight: 400, fontSize: 22, marginBottom: 10 }}>
        Not open for investment yet
      </h3>
      <p style={{ color: "var(--body)", fontSize: 14, lineHeight: 1.6, marginBottom: 16 }}>
        This listing hasn&apos;t been assigned a treasury wallet yet. Here are
        the terms it&apos;s expected to open with.
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

function ManualTreasuryPanel({
  property,
  treasuryAddress,
}: {
  property: AssetMetadata;
  treasuryAddress: Address;
}) {
  const guard = useNetworkGuard();
  const balance = useUsdgBalance();
  const depositTotal = useDepositTotal(property.id);
  const { deposit, pending: depositing } = useDepositToTreasury(property.id, treasuryAddress);
  const { submit: submitPayout, pending: submittingPayout } = usePayoutRequest(property.id);

  const [mode, setMode] = useState<"invest" | "request">("invest");
  const [amount, setAmount] = useState("");
  const [requestKind, setRequestKind] = useState<"WITHDRAWAL" | "YIELD">("WITHDRAWAL");
  const [note, setNote] = useState("");
  const [requestSent, setRequestSent] = useState(false);

  const myBalance = (balance.data as bigint | undefined) ?? 0n;
  const myDeposited = depositTotal.data ?? 0n;
  const min = property.minContributionUsdc ? BigInt(property.minContributionUsdc) : 0n;
  const max = property.maxContributionUsdc ? BigInt(property.maxContributionUsdc) : 0n;

  async function onInvest() {
    const ok = await deposit(amount);
    if (ok) {
      setAmount("");
      balance.refetch?.();
      depositTotal.refetch?.();
    }
  }

  async function onRequestPayout() {
    const ok = await submitPayout(requestKind, amount, note);
    if (ok) {
      setAmount("");
      setNote("");
      setRequestSent(true);
    }
  }

  return (
    <div className="card">
      <div className="fee-row">
        <span>Your investment in this property</span>
        <b>{formatUsd(myDeposited)}</b>
      </div>
      {myDeposited > 0n && (
        <p style={{ fontSize: 12.5, color: "var(--faint)", marginTop: -4, marginBottom: 4 }}>
          Yield accrues weekly — check your{" "}
          <a href="/dashboard">dashboard</a> for the running total.
        </p>
      )}

      {!guard.isConnected ? (
        <>
          <h3 style={{ fontFamily: "var(--serif)", fontWeight: 400, fontSize: 22, marginTop: 16, marginBottom: 10 }}>
            Connect to invest
          </h3>
          <ConnectButton />
        </>
      ) : guard.wrongNetwork ? (
        <>
          <p style={{ color: "var(--body)", fontSize: 14, marginTop: 16, marginBottom: 14 }}>
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
      ) : (
        <>
          <div className="tabs" role="tablist" style={{ marginTop: 20, marginBottom: 16 }}>
            <button
              className={`tab ${mode === "invest" ? "on" : ""}`}
              onClick={() => setMode("invest")}
            >
              Invest
            </button>
            <button
              className={`tab ${mode === "request" ? "on" : ""}`}
              onClick={() => setMode("request")}
            >
              Withdraw / claim yield
            </button>
          </div>

          {mode === "invest" ? (
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
                  Wallet balance: {formatUsd(myBalance)}
                  {min > 0n && ` · min ${formatUsd(min)}`}
                  {max > 0n && ` · max ${formatUsd(max)} per wallet`}
                </div>
              </div>
              <button
                className="btn"
                style={{ width: "100%", justifyContent: "center" }}
                disabled={depositing || !amount}
                onClick={onInvest}
              >
                {depositing ? "Working..." : "Invest in this property"}
              </button>
            </>
          ) : requestSent ? (
            <div className="state-box" style={{ padding: 24 }}>
              <h3 style={{ fontSize: 20 }}>Request submitted</h3>
              <p>
                We&apos;ll review it and send your payout manually — usually
                within 1&ndash;2 hours.
              </p>
              <button className="btn line" onClick={() => setRequestSent(false)}>
                Submit another request
              </button>
            </div>
          ) : (
            <>
              <div className="field">
                <label htmlFor="req-kind">Request type</label>
                <select
                  id="req-kind"
                  value={requestKind}
                  onChange={(e) => setRequestKind(e.target.value as "WITHDRAWAL" | "YIELD")}
                >
                  <option value="WITHDRAWAL">Withdraw principal</option>
                  <option value="YIELD">Claim yield</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="req-amount">Amount (USDG)</label>
                <input
                  id="req-amount"
                  inputMode="decimal"
                  placeholder="1,000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                {requestKind === "WITHDRAWAL" && (
                  <div className="hint">
                    You can withdraw up to {formatUsd(myDeposited)} — only what
                    you&apos;ve invested in this property.
                  </div>
                )}
              </div>
              <div className="field">
                <label htmlFor="req-note">Note (optional)</label>
                <input
                  id="req-note"
                  type="text"
                  placeholder="Anything we should know"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
              <p style={{ fontSize: 12.5, color: "var(--faint)", marginBottom: 14 }}>
                Payouts are reviewed and sent manually — typically within
                1&ndash;2 hours.
              </p>
              <button
                className="btn"
                style={{ width: "100%", justifyContent: "center" }}
                disabled={submittingPayout || !amount}
                onClick={onRequestPayout}
              >
                {submittingPayout ? "Working..." : "Submit request"}
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
}

function OnChainRaisePanel({
  raiseAddress,
}: {
  raiseAddress: Address;
}) {
  const { data: raise, isLoading, refetch } = useRaise(raiseAddress);
  const guard = useNetworkGuard();
  const { address } = useAccount();
  const [amount, setAmount] = useState("");

  const { balance } = useUsdgPosition(raiseAddress);
  const { shares, earned } = useSharePosition(raise?.shareToken, raise?.rentVault);
  const { fund, pending: funding } = useFund(raiseAddress);
  const { withdraw, pending: withdrawing } = useWithdraw(raiseAddress);
  const { claim, pending: claiming } = useClaimYield(raise?.rentVault);

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
  const isLister = address && address.toLowerCase() === raise.lister.toLowerCase();

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

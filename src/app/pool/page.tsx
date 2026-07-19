"use client";

import { useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import GlitchWord from "@/components/GlitchWord";
import { ConfigNeeded } from "@/components/States";
import { useNetworkGuard } from "@/hooks/useNetworkGuard";
import {
  usePoolApyBps,
  usePoolTotalPrincipal,
  usePoolPosition,
  usePoolDeposit,
  usePoolWithdraw,
  usePoolClaimYield,
} from "@/hooks/useYieldPool";
import { isPoolConfigured } from "@/lib/contracts/addresses";
import { formatUsd, formatApyBps, usdgToNumber } from "@/lib/format";

export default function PoolPage() {
  const guard = useNetworkGuard();
  const { data: apyBps } = usePoolApyBps();
  const { data: totalPrincipal } = usePoolTotalPrincipal();
  const { principal, earned, balance, isAllowed } = usePoolPosition();
  const { deposit, pending: depositing } = usePoolDeposit();
  const { withdraw, pending: withdrawing } = usePoolWithdraw();
  const { claim, pending: claiming } = usePoolClaimYield();

  const [mode, setMode] = useState<"deposit" | "withdraw">("deposit");
  const [amount, setAmount] = useState("");

  const apy = typeof apyBps === "bigint" ? Number(apyBps) : 1200;
  const myPrincipal = (principal.data as bigint | undefined) ?? 0n;
  const myEarned = (earned.data as bigint | undefined) ?? 0n;
  const myBalance = (balance.data as bigint | undefined) ?? 0n;
  const allowed = (isAllowed.data as boolean | undefined) ?? false;
  const pool = (totalPrincipal as bigint | undefined) ?? 0n;

  async function onSubmit() {
    if (mode === "deposit") {
      const ok = await deposit(amount);
      if (ok) {
        setAmount("");
        principal.refetch?.();
        balance.refetch?.();
      }
    } else {
      const ok = await withdraw(amount);
      if (ok) {
        setAmount("");
        principal.refetch?.();
        balance.refetch?.();
      }
    }
  }

  if (!isPoolConfigured()) {
    return (
      <>
        <SiteHeader />
        <main>
          <div className="wrap page">
            <ConfigNeeded what="The yield pool" />
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
            <span className="eyebrow">The main event</span>
            <h1>
              Earn <GlitchWord>{`${formatApyBps(apy)} APY`}</GlitchWord> on
              USDG.
            </h1>
            <p>
              Deposit USDG on Robinhood Chain and earn a fixed {formatApyBps(apy)}{" "}
              annual yield, funded by rent collected across the real-world
              properties RRWA has on the platform. Paid out from our Treasury
              wallet — no lockups, withdraw your principal whenever you want.
            </p>
          </div>

          <div className="stat-row">
            <div className="stat">
              <b>{formatApyBps(apy)}</b>
              <span>Fixed APY</span>
            </div>
            <div className="stat">
              <b>{formatUsd(pool)}</b>
              <span>Total in the pool</span>
            </div>
            <div className="stat">
              <b>USDG</b>
              <span>Robinhood Chain</span>
            </div>
          </div>

          <div className="detail-grid" style={{ marginTop: 40 }}>
            <div>
              <h3
                style={{
                  fontFamily: "var(--serif)",
                  fontWeight: 400,
                  fontSize: 26,
                  marginBottom: 12,
                }}
              >
                How the yield is backed
              </h3>
              <p style={{ color: "var(--body)", lineHeight: 1.8, fontSize: 15, maxWidth: 520 }}>
                RRWA lists real-world properties — the six on our marketplace
                today, and more over time. Rent collected from those
                properties flows into our Treasury wallet, which pays out the
                fixed {formatApyBps(apy)} yield to everyone in the pool. You
                aren&apos;t buying a stake in any single property; you&apos;re
                earning a rate backed by all of them together.
              </p>
              <p style={{ color: "var(--body)", lineHeight: 1.8, fontSize: 15, maxWidth: 520, marginTop: 16 }}>
                Investing is currently limited to approved wallets while we
                roll out KYC. If your wallet isn&apos;t allowlisted yet, reach
                out and we&apos;ll get you set up.
              </p>
            </div>

            <div className="card">
              {!guard.isConnected ? (
                <>
                  <h3 style={{ fontFamily: "var(--serif)", fontWeight: 400, fontSize: 26, marginBottom: 10 }}>
                    Connect to invest
                  </h3>
                  <p style={{ color: "var(--body)", fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
                    Connect your wallet to deposit USDG and start earning.
                  </p>
                  <ConnectButton />
                </>
              ) : guard.wrongNetwork ? (
                <>
                  <h3 style={{ fontFamily: "var(--serif)", fontWeight: 400, fontSize: 26, marginBottom: 10 }}>
                    Wrong network
                  </h3>
                  <p style={{ color: "var(--body)", fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
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
              ) : !allowed ? (
                <>
                  <h3 style={{ fontFamily: "var(--serif)", fontWeight: 400, fontSize: 26, marginBottom: 10 }}>
                    Wallet not approved yet
                  </h3>
                  <p style={{ color: "var(--body)", fontSize: 14, lineHeight: 1.6 }}>
                    We&apos;re rolling out investor access gradually while KYC
                    is finalized. Your wallet isn&apos;t on the allowlist yet
                    — contact the RRWA team to get approved.
                  </p>
                </>
              ) : (
                <>
                  <div className="fee-row">
                    <span>Your principal</span>
                    <b>{formatUsd(myPrincipal)}</b>
                  </div>
                  <div className="fee-row">
                    <span>Accrued yield</span>
                    <b>{formatUsd(myEarned, { cents: true })}</b>
                  </div>
                  {usdgToNumber(myEarned) > 0 && (
                    <button
                      className="btn line"
                      style={{ width: "100%", justifyContent: "center", marginTop: 12 }}
                      disabled={claiming}
                      onClick={async () => {
                        const ok = await claim();
                        if (ok) earned.refetch?.();
                      }}
                    >
                      {claiming ? "Working..." : "Claim yield"}
                    </button>
                  )}

                  <div className="tabs" role="tablist" style={{ marginTop: 24, marginBottom: 16 }}>
                    <button
                      className={`tab ${mode === "deposit" ? "on" : ""}`}
                      onClick={() => setMode("deposit")}
                    >
                      Deposit
                    </button>
                    <button
                      className={`tab ${mode === "withdraw" ? "on" : ""}`}
                      onClick={() => setMode("withdraw")}
                    >
                      Withdraw
                    </button>
                  </div>

                  <div className="field">
                    <label htmlFor="pool-amount">Amount (USDG)</label>
                    <input
                      id="pool-amount"
                      inputMode="decimal"
                      placeholder="1,000"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                    <div className="hint">
                      {mode === "deposit"
                        ? `Wallet balance: ${formatUsd(myBalance)}`
                        : `Deposited principal: ${formatUsd(myPrincipal)}`}
                    </div>
                  </div>

                  <button
                    className="btn"
                    style={{ width: "100%", justifyContent: "center" }}
                    disabled={depositing || withdrawing || !amount}
                    onClick={onSubmit}
                  >
                    {depositing || withdrawing
                      ? "Working..."
                      : mode === "deposit"
                        ? "Approve & deposit"
                        : "Withdraw"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

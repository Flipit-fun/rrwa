"use client";

import { useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import GlitchWord from "@/components/GlitchWord";
import { ConfigNeeded } from "@/components/States";
import { useNetworkGuard } from "@/hooks/useNetworkGuard";
import {
  useUsdgBalance,
  useDepositTotal,
  useDepositToTreasury,
  usePayoutRequest,
} from "@/hooks/useTreasuryPool";
import { isPoolConfigured } from "@/lib/contracts/addresses";
import { formatUsd, formatApyBps } from "@/lib/format";

const POOL_APY_BPS = 1200; // fixed 12% — no contract; this is the rate we pay out manually.

export default function PoolPage() {
  const guard = useNetworkGuard();
  const balance = useUsdgBalance();
  const depositTotal = useDepositTotal();
  const { deposit, pending: depositing } = useDepositToTreasury();
  const { submit: submitPayout, pending: submittingPayout } = usePayoutRequest();

  const [mode, setMode] = useState<"deposit" | "request">("deposit");
  const [amount, setAmount] = useState("");
  const [requestKind, setRequestKind] = useState<"WITHDRAWAL" | "YIELD">("WITHDRAWAL");
  const [note, setNote] = useState("");
  const [requestSent, setRequestSent] = useState(false);

  const myBalance = (balance.data as bigint | undefined) ?? 0n;
  const myDeposited = depositTotal.data ?? 0n;

  async function onDeposit() {
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
              Earn <GlitchWord>{`${formatApyBps(POOL_APY_BPS)} APY`}</GlitchWord>{" "}
              on USDG.
            </h1>
            <p>
              Send USDG to RRWA&apos;s treasury wallet and earn a fixed{" "}
              {formatApyBps(POOL_APY_BPS)} annual yield, funded by rent
              collected across the real-world properties RRWA has on the
              platform. There&apos;s no pool contract — deposits, withdrawals,
              and yield are all handled directly with our team.
            </p>
          </div>

          <div className="stat-row">
            <div className="stat">
              <b>{formatApyBps(POOL_APY_BPS)}</b>
              <span>Fixed APY</span>
            </div>
            <div className="stat">
              <b>USDG</b>
              <span>Robinhood Chain</span>
            </div>
            <div className="stat">
              <b>Manual</b>
              <span>Withdrawals &amp; payouts</span>
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
                How this works
              </h3>
              <p style={{ color: "var(--body)", lineHeight: 1.8, fontSize: 15, maxWidth: 520 }}>
                Depositing sends USDG directly to RRWA&apos;s treasury wallet
                — there&apos;s no pool smart contract holding funds in
                escrow. We track what you&apos;ve sent and pay out yield and
                withdrawals manually, on our own schedule.
              </p>
              <p style={{ color: "var(--body)", lineHeight: 1.8, fontSize: 15, maxWidth: 520, marginTop: 16 }}>
                To withdraw your principal or claim yield, submit a request
                below. Our team reviews it and sends the payout from the
                treasury wallet — this isn&apos;t instant or automatic.
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
              ) : (
                <>
                  <div className="fee-row">
                    <span>Your recorded deposits</span>
                    <b>{formatUsd(myDeposited)}</b>
                  </div>

                  <div className="tabs" role="tablist" style={{ marginTop: 24, marginBottom: 16 }}>
                    <button
                      className={`tab ${mode === "deposit" ? "on" : ""}`}
                      onClick={() => setMode("deposit")}
                    >
                      Deposit
                    </button>
                    <button
                      className={`tab ${mode === "request" ? "on" : ""}`}
                      onClick={() => setMode("request")}
                    >
                      Withdraw / claim yield
                    </button>
                  </div>

                  {mode === "deposit" ? (
                    <>
                      <div className="field">
                        <label htmlFor="pool-amount">Amount (USDG)</label>
                        <input
                          id="pool-amount"
                          inputMode="decimal"
                          placeholder="1,000"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                        />
                        <div className="hint">Wallet balance: {formatUsd(myBalance)}</div>
                      </div>
                      <button
                        className="btn"
                        style={{ width: "100%", justifyContent: "center" }}
                        disabled={depositing || !amount}
                        onClick={onDeposit}
                      >
                        {depositing ? "Working..." : "Send USDG to treasury"}
                      </button>
                    </>
                  ) : requestSent ? (
                    <div className="state-box" style={{ padding: 24 }}>
                      <h3 style={{ fontSize: 20 }}>Request submitted</h3>
                      <p>
                        We&apos;ll review it and send your payout from the
                        treasury wallet manually.
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
                          onChange={(e) =>
                            setRequestKind(e.target.value as "WITHDRAWAL" | "YIELD")
                          }
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
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

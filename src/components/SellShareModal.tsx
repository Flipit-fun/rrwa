"use client";

import { useState } from "react";
import type { Address } from "viem";
import { useListShares } from "@/hooks/useMarketplace";
import {
  formatUsd,
  parseUsdc,
  usdcToNumber,
} from "@/lib/format";

interface SellShareModalProps {
  raise: Address;
  shareToken: Address;
  shareBalance: bigint;
  assetName: string;
  matured: boolean;
  onClose: () => void;
  onListed: () => void;
}

/**
 * Sell a share position on the secondary marketplace. Before maturity, the
 * modal shows the 50% early-exit fee math explicitly before the user confirms.
 */
export default function SellShareModal({
  raise,
  shareToken,
  shareBalance,
  assetName,
  matured,
  onClose,
  onListed,
}: SellShareModalProps) {
  const { listShares } = useListShares();
  const [sharesStr, setSharesStr] = useState("");
  const [priceStr, setPriceStr] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  let price = 0n;
  try {
    price = priceStr ? parseUsdc(priceStr) : 0n;
  } catch {
    /* handled on submit */
  }

  const feeBps = matured ? 0 : 5000;
  const fee = (price * BigInt(feeBps)) / 10000n;
  const net = price - fee;

  async function onConfirm() {
    setErr(null);
    let shareAmount: bigint;
    try {
      shareAmount = parseUsdc(sharesStr);
      const p = parseUsdc(priceStr);
      if (shareAmount <= 0n || p <= 0n) {
        setErr("Enter a share amount and a price.");
        return;
      }
      if (shareAmount > shareBalance) {
        setErr("You don't hold that many shares.");
        return;
      }
    } catch {
      setErr("Check the amounts you entered.");
      return;
    }

    setBusy(true);
    const ok = await listShares({ raise, shareToken, shareAmount, price });
    setBusy(false);
    if (ok) onListed();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Sell your share</h3>
        <p style={{ color: "var(--body)", fontSize: 14, lineHeight: 1.6 }}>
          {assetName}
        </p>

        <div className="field" style={{ marginTop: 20 }}>
          <label htmlFor="s-shares">Shares to sell</label>
          <input
            id="s-shares"
            inputMode="decimal"
            placeholder="1,000"
            value={sharesStr}
            onChange={(e) => setSharesStr(e.target.value)}
          />
          <div className="hint">You hold {formatUsd(shareBalance)} shares</div>
        </div>

        <div className="field">
          <label htmlFor="s-price">Asking price (USDC)</label>
          <input
            id="s-price"
            inputMode="decimal"
            placeholder="1,000"
            value={priceStr}
            onChange={(e) => setPriceStr(e.target.value)}
          />
        </div>

        <div className="fee-math">
          {!matured ? (
            <>
              <div className="fee-row">
                <span>Sale price</span>
                <b>{formatUsd(price)}</b>
              </div>
              <div className="fee-row penalty">
                <span>Early-exit fee (50%)</span>
                <b>−{formatUsd(fee)}</b>
              </div>
              <div className="fee-row net">
                <span>You receive</span>
                <b>{formatUsd(net)}</b>
              </div>
              <p
                style={{
                  color: "var(--faint)",
                  fontSize: 12.5,
                  lineHeight: 1.6,
                  marginTop: 12,
                }}
              >
                This raise hasn&apos;t matured, so an early exit carries a 50%
                platform fee. Hold to maturity and you keep the full price.
              </p>
            </>
          ) : (
            <>
              <div className="fee-row net">
                <span>You receive</span>
                <b>{formatUsd(price)}</b>
              </div>
              <p
                style={{
                  color: "var(--faint)",
                  fontSize: 12.5,
                  lineHeight: 1.6,
                  marginTop: 12,
                }}
              >
                This raise has matured — no early-exit fee. You keep the full
                sale price.
              </p>
            </>
          )}
        </div>

        {err && (
          <div className="banner warn" style={{ marginTop: 16 }}>
            <span>{err}</span>
          </div>
        )}

        <div className="modal-actions">
          <button className="btn line" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button
            className="btn"
            onClick={onConfirm}
            disabled={busy || usdcToNumber(price) <= 0}
          >
            {busy ? "Working..." : "List for sale"}
          </button>
        </div>
      </div>
    </div>
  );
}

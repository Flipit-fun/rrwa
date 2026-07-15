"use client";

import Link from "next/link";
import GlitchWord from "./GlitchWord";
import { formatUsd, formatApyBps, progressPct } from "@/lib/format";
import { RaiseState } from "@/lib/contracts/abis";
import type { RaiseWithMeta } from "@/hooks/useRaises";

export default function RaiseRow({ raise }: { raise: RaiseWithMeta }) {
  const name = raise.meta?.name ?? "Untitled asset";
  const location = raise.meta
    ? `${raise.meta.city}, ${raise.meta.region}`
    : "Location pending";

  const pct = progressPct(raise.raised, raise.target);
  const isFull =
    raise.state === RaiseState.Funded ||
    raise.state === RaiseState.Active ||
    raise.state === RaiseState.Matured;

  const statusLabel =
    raise.state === RaiseState.Raising
      ? "Raising"
      : raise.state === RaiseState.Funded
        ? "Funded"
        : raise.state === RaiseState.Active
          ? "Active"
          : "Matured";

  return (
    <Link
      href={`/asset/${raise.address}`}
      className="prow"
      style={{ textDecoration: "none", color: "inherit" }}
    >
      <div className="p-name">
        <GlitchWord>{name}</GlitchWord>
        <small>{location}</small>
      </div>
      <div className="p-apy">
        {formatApyBps(raise.apyBps)}
        <small>APY</small>
      </div>
      <div className="p-fund">
        <small>Raised</small>
        <div className="thin-bar">
          <i
            className={isFull ? "done" : ""}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="nums">
          <b>{formatUsd(raise.raised)}</b> of {formatUsd(raise.target)} ·{" "}
          {raise.funderCount} funders
        </div>
      </div>
      <div className={`p-status ${isFull ? "full" : "open"}`}>
        {statusLabel}
      </div>
      <span className={`btn ${isFull ? "quiet" : ""}`}>
        {raise.state === RaiseState.Raising ? "Fund" : "View"}
      </span>
    </Link>
  );
}

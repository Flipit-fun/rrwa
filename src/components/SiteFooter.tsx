"use client";

import Link from "next/link";

interface FooterProps {
  onReplayIntro?: () => void;
}

export default function SiteFooter({ onReplayIntro }: FooterProps) {
  return (
    <footer>
      <div className="wrap foot">
        <a className="wordmark" href="#">
          RRWA<em>.</em>
        </a>
        <div className="foot-links">
          <Link href="/pool">Earn yield</Link>
          <Link href="/market">Marketplace</Link>
          <Link href="/list">List</Link>
          <Link href="/portfolio">Portfolio</Link>
          <Link href="/dashboard">Dashboard</Link>
          {onReplayIntro && (
            <button
              onClick={onReplayIntro}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--body)",
                textDecoration: "none",
                fontSize: "13.5px",
                transition: "color 0.15s",
                fontFamily: "var(--sans)",
              }}
            >
              Replay intro
            </button>
          )}
        </div>
        <small>Robin Real World Assets — built on Robinhood Chain</small>
      </div>
    </footer>
  );
}

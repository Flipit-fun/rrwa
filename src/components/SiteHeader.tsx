"use client";

import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function SiteHeader() {
  return (
    <header>
      <div className="wrap nav">
        <Link className="wordmark" href="/">
          RRWA<em>.</em>
        </Link>
        <nav className="nav-links">
          <Link href="/pool">Earn yield</Link>
          <Link href="/market">Marketplace</Link>
          <Link href="/list">List your asset</Link>
          <Link href="/portfolio">Portfolio</Link>
          <Link href="/dashboard">Dashboard</Link>
          <a
            href="https://x.com/TryRobinRWA"
            target="_blank"
            rel="noopener noreferrer"
            className="nav-x-link"
            aria-label="RRWA on X"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>
          <ConnectButton
            showBalance={false}
            accountStatus="address"
            chainStatus="icon"
          />
        </nav>
      </div>
    </header>
  );
}

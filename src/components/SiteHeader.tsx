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
          <Link href="/properties">Properties</Link>
          <Link href="/market">Marketplace</Link>
          <Link href="/list">List your asset</Link>
          <Link href="/portfolio">Portfolio</Link>
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

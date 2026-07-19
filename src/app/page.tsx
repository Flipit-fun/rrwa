"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import FlowField from "@/components/FlowField";
import Intro from "@/components/Intro";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ScrollReveal from "@/components/ScrollReveal";
import GlitchWord from "@/components/GlitchWord";
import MarketPreview from "@/components/MarketPreview";

const INTRO_FLAG = "rrwa_intro_seen";

export default function Home() {
  // Intro shows once per browser. We start hidden to avoid a flash before we
  // can read localStorage, then reveal on mount if it hasn't been seen.
  const [showIntro, setShowIntro] = useState(false);

  useEffect(() => {
    // This runs in a real browser, so localStorage is available here.
    try {
      if (!localStorage.getItem(INTRO_FLAG)) {
        setShowIntro(true);
      }
    } catch {
      // private mode / storage disabled — just skip the intro
    }
  }, []);

  const handleCloseIntro = useCallback(() => {
    setShowIntro(false);
    try {
      localStorage.setItem(INTRO_FLAG, "1");
    } catch {
      /* ignore */
    }
  }, []);

  const handleReplayIntro = useCallback(() => {
    setShowIntro(true);
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  return (
    <>
      <FlowField />
      {showIntro && <Intro onClose={handleCloseIntro} />}
      <ScrollReveal />

      <SiteHeader />

      <main>
        {/* Hero */}
        <div className="wrap hero">
          <span className="eyebrow rv">
            Robin Real World Assets — on Robinhood Chain
          </span>
          <h1 className="rv">
            Earn 12% APY
            <br />
            backed by <GlitchWord>real estate</GlitchWord>.
          </h1>
          <p className="sub rv">
            Deposit USDG and earn a fixed 12% annual yield, funded by rent
            collected across real-world properties RRWA has listed — no
            picking individual properties, no lockups.
          </p>
          <div className="hero-cta rv">
            <Link href="/pool" className="btn">
              Start earning <span className="arr">→</span>
            </Link>
            <Link href="/properties" className="btn line">
              See the properties
            </Link>
          </div>
          <div className="hero-foot rv">
            <div className="hf">
              <b>12%</b>
              <span>Fixed APY</span>
            </div>
            <div className="hf">
              <b>6</b>
              <span>Properties listed</span>
            </div>
            <div className="hf">
              <b>USDG</b>
              <span>Deposit &amp; earn</span>
            </div>
            <div className="hf">
              <b>On chain</b>
              <span>Robinhood Chain</span>
            </div>
          </div>
        </div>

        {/* Marketplace preview (live from chain) — the individual-property side */}
        <section id="market">
          <div className="wrap">
            <div className="sec-head rv">
              <span className="eyebrow">Also on RRWA</span>
              <h2>
                Prefer one property? <GlitchWord>Fund it directly</GlitchWord>.
              </h2>
              <p>
                Alongside the yield pool, each listed property can still be
                crowdfunded individually and traded on the secondary market.
                Investing is limited to approved wallets while KYC rolls out.
              </p>
            </div>
            <MarketPreview />
          </div>
        </section>

        {/* How it works */}
        <section id="how">
          <div className="wrap">
            <div className="sec-head rv">
              <span className="eyebrow">How it works</span>
              <h2>
                From listing to payout,
                <br />
                in three <GlitchWord>movements</GlitchWord>.
              </h2>
            </div>
            <div className="steps">
              <div className="step rv">
                <span className="step-k">i.</span>
                <h3>List &amp; secure</h3>
                <p>
                  Post your asset with a funding target and a fixed APY. Three
                  years of rent is secured upfront through RRWA — the foundation
                  that backs every payout to funders.
                </p>
              </div>
              <div className="step rv">
                <span className="step-k">ii.</span>
                <h3>Raise &amp; withdraw</h3>
                <p>
                  Funders contribute dollars until the target is hit. When the
                  raise is fully complete, the lister withdraws the entire amount
                  in one go. No partial withdrawals, no surprises.
                </p>
              </div>
              <div className="step rv">
                <span className="step-k">iii.</span>
                <h3>Earn &amp; exit</h3>
                <p>
                  Funders receive APY from the secured rent, distributed by RRWA.
                  Any share of any property can be sold back to the marketplace,
                  whenever its holder chooses.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Two sides */}
        <section id="sides">
          <div className="wrap">
            <div className="sec-head rv">
              <span className="eyebrow">Pick your side</span>
              <h2>
                List an asset,
                <br />
                or <GlitchWord>fund one</GlitchWord>.
              </h2>
            </div>
            <div className="sides">
              <div className="side rv">
                <span className="eyebrow">For listers</span>
                <h3>Raise capital against your asset.</h3>
                <p>
                  Turn a property into working capital without a bank in the
                  middle. You set the terms.
                </p>
                <ul>
                  <li>Set your own funding target and APY</li>
                  <li>Withdraw 100% once fully funded</li>
                  <li>Three years of rent secured through RRWA</li>
                  <li>RRWA handles all funder payouts for you</li>
                </ul>
                <Link href="/list" className="btn">
                  Start a listing <span className="arr">→</span>
                </Link>
              </div>
              <div className="side rv">
                <span className="eyebrow">For funders</span>
                <h3>Own real assets, earn real rent.</h3>
                <p>
                  Buy into properties from as little as one share. Your yield
                  comes from rent, not speculation.
                </p>
                <ul>
                  <li>Fund in dollars, own a tradable share</li>
                  <li>Fixed APY, backed by secured rent</li>
                  <li>Payouts distributed by RRWA</li>
                  <li>Sell your share on the marketplace anytime</li>
                </ul>
                <Link href="/market" className="btn line">
                  Browse assets
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Exit */}
        <section id="exit">
          <div className="wrap">
            <div className="exit-grid rv">
              <div>
                <span className="eyebrow">Selling shares</span>
                <h2>
                  Need out? The market will{" "}
                  <GlitchWord>buy you out</GlitchWord>.
                </h2>
                <p>
                  Ownership on RRWA is liquid. If you want to back out of a raise
                  or sell your share of a property, list it on the marketplace
                  and another funder takes your place. Early exits carry a 50%
                  platform fee — long-term holders keep the full upside.
                </p>
              </div>
              <div className="fee">
                <b>50%</b>
                <span>
                  Platform fee on early exits
                  <br />
                  Hold to maturity, pay nothing
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter onReplayIntro={handleReplayIntro} />
    </>
  );
}

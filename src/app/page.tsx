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
            Own a piece of
            <br />
            the <GlitchWord>real world</GlitchWord>.
          </h1>
          <p className="sub rv">
            A marketplace where real assets are funded by real people. List a
            property to raise capital — or fund one, and earn a fixed APY paid
            from rent secured through RRWA.
          </p>
          <div className="hero-cta rv">
            <Link href="/market" className="btn">
              Browse assets <span className="arr">→</span>
            </Link>
            <Link href="/list" className="btn line">
              List your asset
            </Link>
          </div>
          <div className="hero-foot rv">
            <div className="hf">
              <b>3 yrs</b>
              <span>Rent secured</span>
            </div>
            <div className="hf">
              <b>1:1</b>
              <span>USDG to shares</span>
            </div>
            <div className="hf">
              <b>50%</b>
              <span>Early-exit fee</span>
            </div>
            <div className="hf">
              <b>On chain</b>
              <span>Robinhood Chain</span>
            </div>
          </div>
        </div>

        {/* Marketplace preview (live from chain) */}
        <section id="market">
          <div className="wrap">
            <div className="sec-head rv">
              <span className="eyebrow">Marketplace</span>
              <h2>
                Two sides. One <GlitchWord>market</GlitchWord>.
              </h2>
              <p>
                Buy shares in assets raising right now, or list your own and let
                the market fund it.
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

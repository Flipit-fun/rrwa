"use client";

import { useState, useCallback, useEffect } from "react";
import GlitchWord from "./GlitchWord";

interface IntroProps {
  onClose: () => void;
}

export default function Intro({ onClose }: IntroProps) {
  const [cur, setCur] = useState(0);
  const [gone, setGone] = useState(false);
  const total = 3;

  const closeIntro = useCallback(() => {
    setGone(true);
    setTimeout(() => onClose(), 500);
  }, [onClose]);

  const nextSlide = useCallback(() => {
    if (cur === total - 1) {
      closeIntro();
    } else {
      setCur((c) => c + 1);
    }
  }, [cur, closeIntro]);

  const prevSlide = useCallback(() => {
    if (cur > 0) setCur((c) => c - 1);
  }, [cur]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (gone) return;
      if (e.key === "ArrowRight" || e.key === "Enter") nextSlide();
      if (e.key === "ArrowLeft") prevSlide();
      if (e.key === "Escape") closeIntro();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [gone, nextSlide, prevSlide, closeIntro]);

  return (
    <div
      id="intro"
      role="dialog"
      aria-label="Introduction to RRWA"
      className={gone ? "gone" : ""}
    >
      <div className="intro-top">
        <a className="wordmark" href="#">
          RRWA<em>.</em>
        </a>
        <button className="skip" onClick={closeIntro}>
          Skip
        </button>
      </div>

      <div className="slides">
        {/* Slide 1 */}
        <div className={`slide ${cur === 0 ? "active" : ""}`}>
          <div className="slide-inner">
            <span className="slide-k">01 — What is RRWA</span>
            <h2>
              The real world,
              <br />
              made <GlitchWord>fundable</GlitchWord>.
            </h2>
            <p>
              Robin Real World Assets is a marketplace on Robinhood Chain where
              real assets — an <GlitchWord>apartment</GlitchWord>, a{" "}
              <GlitchWord>shopfront</GlitchWord>, a{" "}
              <GlitchWord>warehouse</GlitchWord> — are funded collectively and
              owned in shares. Real property. Real rent. On chain.
            </p>
          </div>
        </div>

        {/* Slide 2 */}
        <div className={`slide ${cur === 1 ? "active" : ""}`}>
          <div className="slide-inner">
            <span className="slide-k">02 — How a raise works</span>
            <h2>
              Set a target.
              <br />
              Get <GlitchWord>fully funded</GlitchWord>.
            </h2>
            <p>
              A lister posts an asset with a funding target and a fixed APY per
              annum. Funders contribute in dollars until the target is reached —
              and once the raise is complete, the lister withdraws the full
              amount. Three years of rent is secured upfront through RRWA, and
              every payout to funders flows through us.
            </p>
            <div className="slide-terms">
              <div className="term">
                <b>$10,000</b>
                <span>Example target</span>
              </div>
              <div className="term">
                <b>9.5%</b>
                <span>APY, set by lister</span>
              </div>
              <div className="term">
                <b>3 years</b>
                <span>Rent secured</span>
              </div>
            </div>
          </div>
        </div>

        {/* Slide 3 */}
        <div className={`slide ${cur === 2 ? "active" : ""}`}>
          <div className="slide-inner">
            <span className="slide-k">03 — Ownership &amp; exit</span>
            <h2>
              Your share is yours.
              <br />
              <GlitchWord>Sell it anytime</GlitchWord>.
            </h2>
            <p>
              Every contribution becomes a tradable share of the asset. Hold it
              and collect yield from secured rent — or sell your share on the
              marketplace whenever you choose. Early exits carry a 50% platform
              fee; the full upside belongs to those who stay.
            </p>
          </div>
        </div>
      </div>

      <div className="intro-bottom">
        <div className="progress-line" role="tablist" aria-label="Intro progress">
          {Array.from({ length: total }).map((_, i) => (
            <button
              key={i}
              className={`pl ${i <= cur ? "on" : ""}`}
              onClick={() => setCur(i)}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
        <div className="intro-nav">
          <button
            className="nav-txt"
            onClick={prevSlide}
            style={{ visibility: cur === 0 ? "hidden" : "visible" }}
          >
            Back
          </button>
          <button className="btn" onClick={nextSlide}>
            {cur === total - 1 ? "Enter RRWA" : "Next"}{" "}
            <span className="arr">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}

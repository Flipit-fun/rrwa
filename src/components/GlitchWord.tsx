"use client";

interface GlitchWordProps {
  children: string;
  as?: "span" | "a";
  href?: string;
}

/**
 * The signature italic word that glitches to upright on hover (the `.iw`
 * treatment from the original design). Ghost layers are driven by the
 * `data-text` attribute; motion is disabled under prefers-reduced-motion via
 * globals.css.
 */
export default function GlitchWord({
  children,
  as = "span",
  href,
}: GlitchWordProps) {
  if (as === "a") {
    return (
      <a className="iw" href={href} data-text={children}>
        {children}
      </a>
    );
  }
  return (
    <span className="iw" data-text={children}>
      {children}
    </span>
  );
}

"use client";

import Link from "next/link";

export function LoadingRows({ count = 3 }: { count?: number }) {
  return (
    <div className="plist" aria-busy="true">
      {Array.from({ length: count }).map((_, i) => (
        <div className="prow" key={i}>
          <div className="p-name">
            <div className="skeleton" style={{ height: 22, width: "60%" }} />
            <div
              className="skeleton"
              style={{ height: 12, width: "40%", marginTop: 8 }}
            />
          </div>
          <div className="skeleton" style={{ height: 22, width: 48 }} />
          <div>
            <div className="skeleton" style={{ height: 3, width: "100%" }} />
            <div
              className="skeleton"
              style={{ height: 12, width: "70%", marginTop: 10 }}
            />
          </div>
          <div className="skeleton" style={{ height: 12, width: 60 }} />
          <div className="skeleton" style={{ height: 36, width: 80 }} />
        </div>
      ))}
    </div>
  );
}

export function EmptyState({
  title,
  message,
  ctaHref,
  ctaLabel,
}: {
  title: string;
  message: string;
  ctaHref?: string;
  ctaLabel?: string;
}) {
  return (
    <div className="state-box">
      <h3>{title}</h3>
      <p>{message}</p>
      {ctaHref && ctaLabel && (
        <Link href={ctaHref} className="btn">
          {ctaLabel} <span className="arr">→</span>
        </Link>
      )}
    </div>
  );
}

export function ErrorState({
  title = "Something went sideways",
  message,
  onRetry,
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="state-box">
      <h3>{title}</h3>
      <p>{message}</p>
      {onRetry && (
        <button className="btn line" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

export function ConfigNeeded({ what }: { what: string }) {
  return (
    <div className="banner warn">
      <span>
        {what} isn&apos;t configured yet. Add the required values to your{" "}
        <code>.env</code> and reload.
      </span>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useRaisesWithMeta } from "@/hooks/useRaises";
import { areContractsConfigured } from "@/lib/contracts/addresses";
import RaiseRow from "./RaiseRow";
import { LoadingRows, EmptyState, ErrorState, ConfigNeeded } from "./States";

/** Live marketplace preview for the landing page — shows the first few raises. */
export default function MarketPreview() {
  const { data, isLoading, isError, refetch } = useRaisesWithMeta();

  if (!areContractsConfigured()) {
    return <ConfigNeeded what="The marketplace" />;
  }

  if (isLoading) return <LoadingRows count={3} />;

  if (isError) {
    return (
      <ErrorState
        message="We couldn't reach the chain to load raises. Check your network connection and try again."
        onRetry={() => refetch()}
      />
    );
  }

  const raises = data ?? [];

  if (raises.length === 0) {
    return (
      <EmptyState
        title="No raises yet"
        message="Nothing is raising right now. Be the first to put a real-world asset on chain."
        ctaHref="/list"
        ctaLabel="List your asset"
      />
    );
  }

  const preview = raises.slice(0, 4);

  return (
    <>
      <div className="plist">
        {preview.map((r) => (
          <RaiseRow key={r.address} raise={r} />
        ))}
      </div>
      <div style={{ marginTop: 32 }}>
        <Link href="/market" className="btn line">
          See the full marketplace <span className="arr">→</span>
        </Link>
      </div>
    </>
  );
}

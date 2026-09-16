"use client";

import { useLinkStatus } from "next/link";

/**
 * A pending dot for a `<Link>` whose destination cannot show a route-level
 * fallback — the month arrows on Despesas only change `?mes=`, so the segment
 * never unmounts and `loading.tsx` may not re-fire.
 *
 * Must be rendered inside the `<Link>` it reports on. The dot occupies its
 * space at all times and only becomes visible while pending, so it can never
 * nudge the arrow beside it; the 120ms delay lives in the `link-pending`
 * utility so a fast month change does not flash.
 */
export default function LinkPending() {
  const { pending } = useLinkStatus();

  return <span aria-hidden="true" className="link-pending" data-pending={pending} />;
}

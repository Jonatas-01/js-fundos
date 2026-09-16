/**
 * A placeholder block standing in for content that has not arrived yet.
 *
 * Deliberately dumb: it carries no size of its own, because a skeleton is only
 * honest if it is sized from the real block it replaces. Callers pass the same
 * height the finished element will have, so the swap does not move the page.
 *
 * Always `aria-hidden` — the loading state is announced once, by the
 * `role="status"` line in the route's `loading.tsx`, not by every bar.
 */
export default function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`skeleton ${className}`} />;
}

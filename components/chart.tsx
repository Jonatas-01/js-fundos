"use client";

import { useEffect, useState } from "react";

/** Recharts animates on mount by default; that is decorative, so it goes. */
export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return reduced;
}

type ShapeProps = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fill?: string;
  /** Set on segments stacked against each other in the same column. */
  stacked?: boolean;
};

/**
 * Square-cornered columns outlined in the same black as every border on the
 * page. Recharts' default bar ignores a stroke on a stacked series, and the
 * outline is what makes a flat fill read as a block rather than a smear, so the
 * shape is drawn here instead.
 */
export function Segment({
  x = 0,
  y = 0,
  width = 0,
  height = 0,
  fill,
  stacked = false,
}: ShapeProps) {
  if (height <= 0 || width <= 0) return null;

  // Columns get narrower as a range grows. A fixed 2px outline would eventually
  // be wider than the column itself, so it thins with the column rather than
  // swallowing it — a fixed width here made a whole chart disappear once its
  // range passed roughly three months.
  const sw = Math.min(2, width / 3, height);

  // An SVG stroke straddles its path, so where the edge is drawn decides what
  // happens at a boundary.
  //
  // Standalone columns inset the top and bottom edges, keeping the outline off
  // the baseline and out of the neighbouring column.
  //
  // Stacked segments do the opposite: their edges sit exactly on the box, so
  // the boundary between two segments is painted by both of them in the same
  // place and reads as one line. Insetting instead puts the two strokes
  // side by side, which is what made shared edges look half again as thick.
  const top = stacked ? y : y + sw / 2;
  const boxHeight = stacked ? height : height - sw / 2;

  return (
    <rect
      x={x + sw / 2}
      y={top}
      width={width - sw}
      height={boxHeight}
      fill={fill}
      stroke="var(--line)"
      strokeWidth={sw}
    />
  );
}

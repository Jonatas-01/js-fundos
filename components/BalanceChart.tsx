"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCents, formatDate } from "@/lib/money";
import type { Deposit, Fund } from "@/app/page";

/**
 * One column per day, whose height is the running balance — so the chart reads
 * as growth at a glance, with nothing to decode.
 *
 * The split behind that number (what was already saved versus what went in
 * that day) is detail rather than headline, so it stays out of the way until a
 * column is clicked.
 */
type Column = {
  key: string;
  label: string;
  /** Balance carried into the day. */
  carried: number;
  /** Deposited during the day. */
  added: number;
  /** Balance at the end of the day — the full column height. */
  total: number;
};

function parseISO(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function toISO(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${m}-${d}`;
}

/** How many days of history the chart shows at once. */
const WINDOW_DAYS = 25;

/**
 * One column per calendar day for the last {@link WINDOW_DAYS} days, ending
 * today. Days with no deposit are kept and carry the balance forward, so the
 * x-axis is a real timeline: a pause in saving reads as flat columns rather
 * than being squeezed out of existence.
 *
 * Anything saved before the window is not lost — it becomes the carried
 * balance of the first visible column, so column height is always the true
 * running total, never just the window's own deposits.
 *
 * The range ends at today rather than at the last deposit; otherwise the final
 * column would imply the fund was last worth something weeks ago.
 */
function buildColumns(deposits: Deposit[], locale: string): Column[] {
  if (deposits.length === 0) return [];

  const added = new Map<string, number>();
  for (const d of deposits) {
    added.set(d.occurred_on, (added.get(d.occurred_on) ?? 0) + d.amount_cents);
  }

  const times = deposits.map((d) => parseISO(d.occurred_on).getTime());
  const first = new Date(Math.min(...times));

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  // Deposits cannot be future-dated, but clock skew across devices could still
  // land one past midnight here; take whichever is later so the loop ends.
  const last = new Date(Math.max(Math.max(...times), today.getTime()));

  const windowStart = new Date(today);
  windowStart.setDate(windowStart.getDate() - (WINDOW_DAYS - 1));
  // A short history starts at the first deposit: padding empty days before it
  // would invent a stretch of saving that never happened.
  const start = first > windowStart ? first : windowStart;
  const startKey = toISO(start);

  // Fold everything before the window into the opening balance. ISO dates sort
  // lexicographically, so a string compare is the whole test.
  let running = 0;
  for (const d of deposits) {
    if (d.occurred_on < startKey) running += d.amount_cents;
  }

  const dayMonth = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
  });

  const columns: Column[] = [];
  const cursor = new Date(start);

  while (cursor <= last) {
    const key = toISO(cursor);
    const inDay = added.get(key) ?? 0;

    columns.push({
      key,
      label: dayMonth.format(cursor),
      carried: running,
      added: inDay,
      total: running + inDay,
    });

    running += inDay;
    cursor.setDate(cursor.getDate() + 1);
  }

  return columns;
}

/** Recharts animates on mount by default; that is decorative, so it goes. */
function useReducedMotion() {
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
};

/**
 * Square-cornered columns outlined in the same black as every border on the
 * page. Recharts' default bar ignores a stroke on a stacked series, and the
 * outline is what makes the two flat fills read as blocks rather than as a
 * gradient, so the shape is drawn here instead.
 *
 * The stroke is drawn inset by half its width: an SVG stroke straddles the
 * path, so without the inset the outline would hang over the baseline and the
 * neighbouring column.
 */
function Segment({ x = 0, y = 0, width = 0, height = 0, fill }: ShapeProps) {
  if (height <= 0 || width <= 0) return null;

  // Daily columns get narrower as the history grows. A fixed 2px outline would
  // eventually be wider than the column itself, so it thins with the column
  // rather than swallowing it — a fixed width here made the whole chart
  // disappear once the range passed roughly three months.
  const sw = Math.min(2, width / 3, height);

  return (
    <rect
      x={x + sw / 2}
      y={y + sw / 2}
      width={width - sw}
      height={height - sw / 2}
      fill={fill}
      stroke="var(--line)"
      strokeWidth={sw}
    />
  );
}

type BreakdownProps = {
  active?: boolean;
  payload?: { payload: Column }[];
  fund: Fund;
};

/**
 * Opened by clicking (or tapping) a column. Shows the two parts that make up
 * the column's height, then the height itself, so the arithmetic is visible
 * rather than implied by two stacked colours.
 */
function Breakdown({ active, payload, fund }: BreakdownProps) {
  const column = payload?.[0]?.payload;
  if (!active || !column) return null;

  const rows: [string, number][] = [
    ["Acumulado", column.carried],
    ["Depositado", column.added],
    ["Saldo", column.total],
  ];

  return (
    <div
      className="border-[3px] border-line bg-surface px-3 py-2 text-xs font-semibold text-foreground"
      style={{ boxShadow: "var(--shadow-hard-sm)" }}
    >
      <p className="mb-1.5 font-bold uppercase">
        {formatDate(column.key, fund.locale)}
      </p>
      <dl className="space-y-1">
        {rows.map(([label, cents], i) => (
          <div
            key={label}
            className={
              i === rows.length - 1
                ? "flex justify-between gap-6 border-t-2 border-line pt-1 font-bold"
                : "flex justify-between gap-6"
            }
          >
            <dt>{label}</dt>
            <dd className="tabular-nums">
              {formatCents(cents, fund.currency, fund.locale)}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export default function BalanceChart({
  deposits,
  fund,
}: {
  deposits: Deposit[];
  fund: Fund;
}) {
  const reducedMotion = useReducedMotion();
  // Stable identity matters: Recharts restarts its entrance animation whenever
  // `data` changes, and a fresh array every render leaves the bars frozen at
  // height 0 forever.
  const data = useMemo(
    () => buildColumns(deposits, fund.locale),
    [deposits, fund.locale],
  );

  if (data.length === 0) return null;

  const latest = data[data.length - 1].total;
  // Keep the goal line in frame so the remaining gap is always visible, with
  // headroom for the value sitting on the last column's cap.
  const max = Math.max(fund.goal_cents, latest) * 1.12;

  const compact = new Intl.NumberFormat(fund.locale, {
    notation: "compact",
    maximumFractionDigits: 1,
  });

  return (
    <section className="card overflow-hidden" aria-labelledby="growth-heading">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b-[3px] border-line bg-surface-soft px-5 py-4">
        <h2 id="growth-heading" className="eyebrow">
          Crescimento
        </h2>
        <p className="text-xs font-bold text-muted">
          Toque numa coluna para ver os detalhes
        </p>
      </div>

      {/* The columns encode the balance; this table is the same reading for
          anyone who cannot see them. */}
      <table className="sr-only">
        <caption>
          Saldo acumulado por dia nos últimos {WINDOW_DAYS} dias, com meta de{" "}
          {formatCents(fund.goal_cents, fund.currency, fund.locale)}.
        </caption>
        <thead>
          <tr>
            <th scope="col">Dia</th>
            <th scope="col">Depositado</th>
            <th scope="col">Saldo</th>
          </tr>
        </thead>
        <tbody>
          {data.map((c) => (
            <tr key={c.key}>
              <th scope="row">{formatDate(c.key, fund.locale)}</th>
              <td>{formatCents(c.added, fund.currency, fund.locale)}</td>
              <td>{formatCents(c.total, fund.currency, fund.locale)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="p-5">
        <div className="h-56 w-full" aria-hidden="true">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid stroke="var(--line)" strokeOpacity={0.25} vertical={false} />

              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fontWeight: 700, fill: "var(--foreground)" }}
                tickLine={false}
                axisLine={{ stroke: "var(--line)", strokeWidth: 3 }}
                minTickGap={8}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={[0, max]}
                width={60}
                tick={{ fontSize: 11, fontWeight: 700, fill: "var(--foreground)" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => compact.format(v / 100)}
              />

              {/* Click rather than hover: the chart is read on phones, where
                  there is no hover, and the breakdown is opt-in detail. */}
              <Tooltip
                trigger="click"
                cursor={{ fill: "var(--surface-hover)", fillOpacity: 0.6 }}
                content={<Breakdown fund={fund} />}
              />

              <ReferenceLine
                y={fund.goal_cents}
                stroke="var(--goal)"
                strokeDasharray="6 4"
                strokeWidth={3}
                label={{
                  value: "META",
                  position: "insideTopRight",
                  fontSize: 11,
                  fontWeight: 800,
                  fill: "var(--goal)",
                }}
              />

              <Bar
                dataKey="total"
                fill="var(--accent)"
                maxBarSize={28}
                isAnimationActive={!reducedMotion}
                shape={<Segment />}
              >
                {/* Only the latest column is labelled — a number on every column
                    goes unread, and the axis and breakdown carry the rest. */}
                <LabelList
                  position="top"
                  offset={8}
                  fontSize={11}
                  fontWeight={800}
                  fill="var(--foreground)"
                  valueAccessor={(entry, index) =>
                    index === data.length - 1
                      ? formatCents(
                          (entry.payload as Column).total,
                          fund.currency,
                          fund.locale,
                        )
                      : ""
                  }
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}

"use client";

import { useEffect, useState } from "react";
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
 * One column per period, stacked into two parts: what the fund was already
 * worth when the period opened, and what was put in during it. Column height
 * is the running balance, so the chart reads as growth, while the solid cap
 * shows the period's own contribution without needing a second axis.
 */
type Column = {
  key: string;
  label: string;
  /** Balance carried into the period. */
  carried: number;
  /** Deposited during the period. */
  added: number;
  /** Balance at the end of the period — the full column height. */
  total: number;
};

const DAY_MS = 86_400_000;

function parseISO(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function toISO(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${m}-${d}`;
}

/** Monday of the week `date` falls in. */
function weekStart(date: Date): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}

/**
 * A short history reads better week by week; past ~ten weeks the columns would
 * crowd, so it rolls up to months. Empty periods are kept either way — a month
 * where nothing was saved is part of the story, and dropping it would make the
 * spacing lie about time.
 */
function buildColumns(deposits: Deposit[], locale: string): Column[] {
  if (deposits.length === 0) return [];

  const times = deposits.map((d) => parseISO(d.occurred_on).getTime());
  const first = new Date(Math.min(...times));
  const last = new Date(Math.max(...times));
  const byWeek = (last.getTime() - first.getTime()) / DAY_MS <= 70;

  const bucketOf = (date: Date) =>
    byWeek
      ? weekStart(date)
      : new Date(date.getFullYear(), date.getMonth(), 1);

  const added = new Map<string, number>();
  for (const d of deposits) {
    const key = toISO(bucketOf(parseISO(d.occurred_on)));
    added.set(key, (added.get(key) ?? 0) + d.amount_cents);
  }

  const month = new Intl.DateTimeFormat(locale, { month: "short" });
  const dayMonth = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
  });
  const spansYears = first.getFullYear() !== last.getFullYear();

  const columns: Column[] = [];
  const cursor = bucketOf(first);
  let running = 0;

  while (cursor <= last) {
    const key = toISO(cursor);
    const inPeriod = added.get(key) ?? 0;
    const year = String(cursor.getFullYear()).slice(2);

    columns.push({
      key,
      label: byWeek
        ? dayMonth.format(cursor)
        : spansYears && cursor.getMonth() === 0
          ? `${month.format(cursor)} '${year}`
          : month.format(cursor),
      carried: running,
      added: inPeriod,
      total: running + inPeriod,
    });

    running += inPeriod;
    if (byWeek) cursor.setDate(cursor.getDate() + 7);
    else cursor.setMonth(cursor.getMonth() + 1);
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
  const sw = 2;
  if (height <= sw || width <= sw) return null;

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

/**
 * Two series, so identity never rests on colour alone: the key is always on
 * screen, and the tooltip names both parts again.
 */
function LegendKey({
  fill,
  children,
}: {
  fill: string;
  children: React.ReactNode;
}) {
  return (
    <span className="flex items-center gap-1.5 text-xs font-bold text-foreground">
      <span
        aria-hidden="true"
        className="size-3 border-2 border-line"
        style={{ background: fill }}
      />
      {children}
    </span>
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
  const data = buildColumns(deposits, fund.locale);

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
        <div className="flex items-center gap-3">
          <LegendKey fill="var(--chart-carried)">Acumulado</LegendKey>
          <LegendKey fill="var(--accent)">Depositado</LegendKey>
        </div>
      </div>

      {/* The columns encode the balance; this table is the same reading for
          anyone who cannot see them. */}
      <table className="sr-only">
        <caption>
          Saldo acumulado por período, com meta de{" "}
          {formatCents(fund.goal_cents, fund.currency, fund.locale)}.
        </caption>
        <thead>
          <tr>
            <th scope="col">Período a partir de</th>
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

              <Tooltip
                cursor={{ fill: "var(--surface-hover)", fillOpacity: 0.6 }}
                contentStyle={{
                  borderRadius: 0,
                  border: "3px solid var(--line)",
                  background: "var(--surface)",
                  color: "var(--foreground)",
                  fontSize: 12,
                  fontWeight: 600,
                  boxShadow: "var(--shadow-hard-sm)",
                }}
                labelStyle={{ color: "var(--foreground)", fontWeight: 700 }}
                labelFormatter={(_label, items) => {
                  const key = items?.[0]?.payload?.key;
                  return key ? formatDate(String(key), fund.locale) : "";
                }}
                formatter={(value, name) => [
                  formatCents(Number(value), fund.currency, fund.locale),
                  name === "added" ? "Depositado" : "Acumulado",
                ]}
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
                dataKey="carried"
                stackId="balance"
                fill="var(--chart-carried)"
                maxBarSize={28}
                isAnimationActive={!reducedMotion}
                shape={<Segment />}
              />
              <Bar
                dataKey="added"
                stackId="balance"
                fill="var(--accent)"
                maxBarSize={28}
                isAnimationActive={!reducedMotion}
                shape={<Segment />}
              >
                {/* Only the latest column is labelled — a number on every column
                    goes unread, and the axis and tooltip carry the rest. */}
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

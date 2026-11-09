"use client";

import { useId, useState } from "react";

export type BalancePoint = { t: number; balance: number };

const WIDTH = 600;
const HEIGHT = 140;
const PAD_Y = 10;

function formatDate(t: number) {
  return new Date(t).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatMoney(n: number) {
  return `$${n.toFixed(2)}`;
}

/**
 * Plots the real running wallet balance (every point is a past ledger
 * entry - an admin credit or a placed investment), not a projection.
 */
export function BalanceHistoryChart({ points }: { points: BalancePoint[] }) {
  const gradientId = useId();
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (points.length < 2) return null;

  const values = points.map((p) => p.balance);
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 0);
  const range = max - min || 1;

  const coords = points.map((p, i) => {
    const x = (i / (points.length - 1)) * WIDTH;
    const y = HEIGHT - PAD_Y - ((p.balance - min) / range) * (HEIGHT - PAD_Y * 2);
    return [x, y] as const;
  });

  const path = coords
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(" ");
  const areaPath = `${path} L${WIDTH},${HEIGHT} L0,${HEIGHT} Z`;

  const first = points[0];
  const last = points[points.length - 1];
  const trendingUp = last.balance >= first.balance;
  const accentVar = trendingUp ? "var(--color-credit)" : "var(--color-debit)";

  const active = hoverIndex !== null ? points[hoverIndex] : last;
  const activeCoord = hoverIndex !== null ? coords[hoverIndex] : coords[coords.length - 1];

  function selectFromPointerX(clientX: number, rect: DOMRect) {
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const index = Math.round(ratio * (points.length - 1));
    setHoverIndex(index);
  }

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-stone">
          Wallet balance history
        </span>
        <span
          className="font-mono text-xs font-medium tabular-nums"
          style={{ color: accentVar }}
        >
          {formatMoney(active.balance)}
        </span>
      </div>

      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="mt-2 h-32 w-full cursor-crosshair touch-none"
        role="img"
        aria-label={`Wallet balance from ${formatMoney(first.balance)} on ${formatDate(
          first.t,
        )} to ${formatMoney(last.balance)} on ${formatDate(last.t)}`}
        preserveAspectRatio="none"
        tabIndex={0}
        onPointerMove={(e) => {
          selectFromPointerX(e.clientX, e.currentTarget.getBoundingClientRect());
        }}
        onPointerLeave={() => setHoverIndex(null)}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") {
            setHoverIndex((i) => Math.min(points.length - 1, (i ?? points.length - 1) + 1));
          } else if (e.key === "ArrowLeft") {
            setHoverIndex((i) => Math.max(0, (i ?? points.length - 1) - 1));
          }
        }}
      >
        <line
          x1="0"
          y1={HEIGHT / 2}
          x2={WIDTH}
          y2={HEIGHT / 2}
          stroke="currentColor"
          className="text-ink/10"
          strokeWidth="1"
        />
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accentVar} stopOpacity="0.1" />
            <stop offset="100%" stopColor={accentVar} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#${gradientId})`} />
        <path
          d={path}
          fill="none"
          stroke={accentVar}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {hoverIndex !== null && (
          <line
            x1={activeCoord[0]}
            y1="0"
            x2={activeCoord[0]}
            y2={HEIGHT}
            stroke="currentColor"
            className="text-ink/20"
            strokeWidth="1"
          />
        )}

        <circle
          cx={activeCoord[0]}
          cy={activeCoord[1]}
          r="4"
          fill="var(--color-paper)"
          stroke={accentVar}
          strokeWidth="2"
        />
      </svg>

      <div className="mt-1 flex items-baseline justify-between text-xs text-stone">
        <span>{formatDate(active.t)}</span>
        <span>{hoverIndex === null ? "Hover or focus to inspect history" : ""}</span>
      </div>
      <span className="sr-only" aria-live="polite">
        {hoverIndex !== null &&
          `${formatDate(active.t)}: ${formatMoney(active.balance)}`}
      </span>

      <details className="mt-2">
        <summary className="cursor-pointer text-xs text-stone hover:text-ink">
          View as table
        </summary>
        <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto text-xs text-ink/80">
          {points.map((p, i) => (
            <li key={i} className="flex justify-between gap-3">
              <span>{formatDate(p.t)}</span>
              <span className="font-mono font-tabular">{formatMoney(p.balance)}</span>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}

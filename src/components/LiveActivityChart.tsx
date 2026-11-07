"use client";

import { useEffect, useRef, useState } from "react";

const POINTS = 36;
const TICK_MS = 1400;

function seededWalk(base: number) {
  const points: number[] = [];
  let value = base;
  for (let i = 0; i < POINTS; i++) {
    value += (Math.sin(i * 0.7) + (((i * 9301 + 49297) % 233280) / 233280 - 0.5)) * base * 0.01;
    points.push(Math.max(value, base * 0.5));
  }
  return points;
}

export function LiveActivityChart({ base }: { base: number }) {
  const safeBase = base > 0 ? base : 100;
  const [points, setPoints] = useState(() => seededWalk(safeBase));
  const frame = useRef(0);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReducedMotion) return;

    let timer: ReturnType<typeof setInterval> | null = null;

    const start = () => {
      timer = setInterval(() => {
        frame.current += 1;
        setPoints((prev) => {
          const last = prev[prev.length - 1];
          const next =
            last +
            (Math.random() - 0.48) * safeBase * 0.025 +
            Math.sin(frame.current * 0.3) * safeBase * 0.004;
          return [...prev.slice(1), Math.max(next, safeBase * 0.4)];
        });
      }, TICK_MS);
    };
    const stop = () => {
      if (timer) clearInterval(timer);
      timer = null;
    };

    const handleVisibility = () => {
      if (document.hidden) stop();
      else start();
    };

    start();
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [safeBase]);

  const width = 600;
  const height = 140;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;

  const coords = points.map((p, i) => {
    const x = (i / (points.length - 1)) * width;
    const y = height - ((p - min) / range) * (height - 16) - 8;
    return [x, y] as const;
  });

  const path = coords
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(" ");

  const areaPath = `${path} L${width},${height} L0,${height} Z`;

  const latest = points[points.length - 1];
  const previous = points[points.length - 2] ?? latest;
  const trendingUp = latest >= previous;

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-stone">
          Live activity
        </span>
        <span
          className={`font-mono text-xs font-medium tabular-nums ${
            trendingUp ? "text-credit" : "text-debit"
          }`}
        >
          ${latest.toFixed(2)}
        </span>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="mt-2 h-32 w-full"
        role="img"
        aria-label="Illustrative live activity chart, not real market data"
        preserveAspectRatio="none"
      >
        <line
          x1="0"
          y1={height / 2}
          x2={width}
          y2={height / 2}
          stroke="currentColor"
          className="text-ink/10"
          strokeWidth="1"
        />
        <path d={areaPath} fill="var(--color-brass)" opacity="0.08" />
        <path
          d={path}
          fill="none"
          stroke="var(--color-brass)"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <circle
          cx={coords[coords.length - 1][0]}
          cy={coords[coords.length - 1][1]}
          r="4"
          fill="var(--color-paper)"
          stroke="var(--color-brass)"
          strokeWidth="2"
        />
      </svg>
      <p className="mt-1 text-xs text-stone">
        Illustrative activity for this company &mdash; not real market data.
      </p>
    </div>
  );
}

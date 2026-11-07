import { Prisma } from "@prisma/client";

const SERIES_COLORS = [
  "#C7A446", // brass — matches the brand accent
  "#0E8C76", // teal
  "#8B3F66", // plum
  "#2E5F99", // blue
  "#BF6A24", // ochre
];
const OTHER_COLOR = "#6B6456"; // stone — reserved for the folded "Other" bucket
const MAX_SLOTS = SERIES_COLORS.length;

export type AllocationSlice = {
  id: string;
  label: string;
  amount: Prisma.Decimal;
};

function toSlices(raw: AllocationSlice[]) {
  const sorted = [...raw].sort((a, b) => (a.amount.gte(b.amount) ? -1 : 1));
  if (sorted.length <= MAX_SLOTS) {
    return sorted.map((s, i) => ({ ...s, color: SERIES_COLORS[i] }));
  }
  const head = sorted.slice(0, MAX_SLOTS - 1);
  const tail = sorted.slice(MAX_SLOTS - 1);
  const otherTotal = tail.reduce(
    (sum, s) => sum.plus(s.amount),
    new Prisma.Decimal(0),
  );
  return [
    ...head.map((s, i) => ({ ...s, color: SERIES_COLORS[i] })),
    { id: "other", label: "Other", amount: otherTotal, color: OTHER_COLOR },
  ];
}

export function PortfolioAllocation({
  slices,
  total,
  heading = "Allocation by company",
  unitNoun = "company",
  unitNounPlural = "companies",
}: {
  slices: AllocationSlice[];
  total: Prisma.Decimal;
  heading?: string;
  unitNoun?: string;
  unitNounPlural?: string;
}) {
  if (slices.length === 0 || total.lessThanOrEqualTo(0)) return null;

  const colored = toSlices(slices);

  return (
    <div>
      <h3 className="text-xs font-medium uppercase tracking-wide text-stone">
        {heading}
      </h3>

      <div
        role="img"
        aria-label={`Split across ${colored.length} ${
          colored.length === 1 ? unitNoun : unitNounPlural
        }: ${colored
          .map(
            (s) =>
              `${s.label} ${total.gt(0) ? s.amount.div(total).times(100).toFixed(0) : 0}%`,
          )
          .join(", ")}`}
        className="mt-2 flex h-5 w-full gap-0.5 overflow-hidden rounded-sm"
      >
        {colored.map((slice) => {
          const pct = total.gt(0) ? slice.amount.div(total).times(100) : new Prisma.Decimal(0);
          return (
            <div
              key={slice.id}
              title={`${slice.label}: $${slice.amount.toFixed(2)} (${pct.toFixed(0)}%)`}
              style={{
                backgroundColor: slice.color,
                width: `${pct.toFixed(4)}%`,
              }}
            />
          );
        })}
      </div>

      <ul className="mt-3 space-y-1.5">
        {colored.map((slice) => {
          const pct = total.gt(0) ? slice.amount.div(total).times(100) : new Prisma.Decimal(0);
          return (
            <li
              key={slice.id}
              className="flex items-center justify-between gap-3 text-sm"
            >
              <span className="flex min-w-0 items-center gap-2">
                <span
                  aria-hidden="true"
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: slice.color }}
                />
                <span className="truncate text-ink">{slice.label}</span>
              </span>
              <span className="shrink-0 font-mono font-tabular text-ink">
                ${slice.amount.toFixed(2)}{" "}
                <span className="text-stone">({pct.toFixed(0)}%)</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

import { Prisma } from "@prisma/client";

export type LedgerRow = {
  id: string;
  primary: string;
  secondary?: string | null;
  amount: Prisma.Decimal;
  signed?: boolean;
  date: Date;
  meta?: string | null;
};

function formatAmount(amount: Prisma.Decimal, signed: boolean) {
  const abs = amount.abs().toFixed(2);
  if (!signed) return `$${abs}`;
  return amount.lessThan(0) ? `-$${abs}` : `+$${abs}`;
}

/**
 * Renders a list of money-bearing rows as ledger stubs: a signature piece
 * that also sidesteps the usual "table overflows on mobile" problem, since
 * each row stacks naturally instead of relying on columns.
 */
export function LedgerList({
  rows,
  emptyLabel,
}: {
  rows: LedgerRow[];
  emptyLabel: string;
}) {
  if (rows.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-ink/15 bg-paper px-4 py-6 text-center text-sm text-stone">
        {emptyLabel}
      </p>
    );
  }

  return (
    <ul className="divide-y divide-dashed divide-ink/15 rounded-md border border-ink/10 bg-paper">
      {rows.map((row) => {
        const isNegative = row.signed && row.amount.lessThan(0);
        const accent = !row.signed
          ? "bg-ink/10"
          : isNegative
            ? "bg-debit"
            : "bg-credit";
        const amountColor = !row.signed
          ? "text-ink"
          : isNegative
            ? "text-debit"
            : "text-credit";

        return (
          <li key={row.id} className="flex items-stretch gap-3 px-4 py-3">
            <span
              aria-hidden="true"
              className={`w-1 shrink-0 self-stretch rounded-full ${accent}`}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink">
                {row.primary}
              </p>
              {row.secondary && (
                <p className="truncate text-xs text-stone">{row.secondary}</p>
              )}
            </div>
            <div className="flex shrink-0 flex-col items-end">
              <span
                className={`font-mono font-tabular text-sm font-medium ${amountColor}`}
              >
                {formatAmount(row.amount, row.signed ?? false)}
              </span>
              <span className="text-xs text-stone">
                {row.date.toLocaleDateString()}
              </span>
              {row.meta && (
                <span className="text-xs text-stone">{row.meta}</span>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

import Link from "next/link";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getWalletBalance } from "@/lib/actions";
import { NavBar } from "@/components/NavBar";
import { LedgerList } from "@/components/LedgerList";
import { PortfolioAllocation } from "@/components/PortfolioAllocation";
import { AvatarUpload } from "@/components/AvatarUpload";

function currentValueOf(investedAmount: Prisma.Decimal, company: {
  initialValue: Prisma.Decimal;
  currentValue: Prisma.Decimal;
}) {
  if (company.initialValue.lessThanOrEqualTo(0)) return investedAmount;
  const growth = company.currentValue.div(company.initialValue);
  return investedAmount.times(growth);
}

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [user, balance, companies, transactions, investments] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    getWalletBalance(userId),
    prisma.company.findMany({
      where: { status: "OPEN" },
      orderBy: { createdAt: "desc" },
    }),
    prisma.walletTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.investment.findMany({
      where: { userId },
      include: { company: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const totalInvested = investments.reduce(
    (sum, inv) => sum.plus(inv.amount),
    new Prisma.Decimal(0),
  );

  const interestRate = user?.interestRate ?? new Prisma.Decimal(0);

  const allocationSlices = Object.values(
    investments.reduce<Record<string, { id: string; label: string; amount: Prisma.Decimal }>>(
      (acc, inv) => {
        const existing = acc[inv.companyId];
        acc[inv.companyId] = {
          id: inv.companyId,
          label: inv.company.name,
          amount: (existing?.amount ?? new Prisma.Decimal(0)).plus(inv.amount),
        };
        return acc;
      },
      {},
    ),
  );

  return (
    <div className="min-h-screen">
      <NavBar name={session!.user.name ?? ""} role="INVESTOR" />
      <main className="mx-auto max-w-4xl space-y-8 px-4 py-8 sm:space-y-10 sm:px-6 sm:py-10">
        <h1 className="sr-only">Dashboard</h1>
        <section className="rounded-lg border border-brass/15 bg-paper p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <AvatarUpload
                name={session!.user.name ?? "?"}
                avatarUrl={user?.avatarUrl}
              />
              <div className="min-w-0">
                <p className="truncate font-display text-base font-medium text-ink">
                  {session!.user.name}
                </p>
                <p className="text-xs text-stone">Investment account</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-stone">
                Wallet balance
              </p>
              <p className="mt-2 break-words font-mono text-2xl font-medium tabular-nums text-ink sm:text-3xl">
                ${balance.toFixed(2)}
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-stone">
                Interest
              </p>
              <p className="mt-2 break-words font-mono text-2xl font-medium tabular-nums text-credit sm:text-3xl">
                {interestRate.gte(0) ? "+" : ""}
                {interestRate.toFixed(2)}%
              </p>
            </div>
          </div>
          <p className="mt-3 text-xs text-stone">
            Balances are set by an admin after funds are received outside the
            platform.
          </p>

          {allocationSlices.length > 0 && (
            <div className="mt-6 border-t border-ink/10 pt-5">
              <PortfolioAllocation slices={allocationSlices} total={totalInvested} />
            </div>
          )}
        </section>

        {investments.length > 0 && (
          <section>
            <h2 className="mb-4 font-display text-lg font-medium text-paper">
              Investment holdings
            </h2>
            <ul className="divide-y divide-ink/10 rounded-lg border border-brass/15 bg-paper">
              {investments.map((inv) => {
                const current = currentValueOf(inv.amount, inv.company);
                const gain = current.minus(inv.amount);
                const gainPct = inv.amount.gt(0)
                  ? gain.div(inv.amount).times(100)
                  : new Prisma.Decimal(0);
                const up = gain.gte(0);
                return (
                  <li key={inv.id} className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <Link
                        href={`/companies/${inv.companyId}`}
                        className="truncate font-medium text-ink hover:underline"
                      >
                        {inv.company.name}
                      </Link>
                      <span className="shrink-0 break-words font-mono font-tabular text-sm font-medium text-ink">
                        ${current.toFixed(2)}
                      </span>
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-stone">
                      <span>Invested: ${inv.amount.toFixed(2)}</span>
                      <span className={up ? "text-credit" : "text-debit"}>
                        {up ? "+" : ""}
                        ${gain.toFixed(2)} ({up ? "+" : ""}
                        {gainPct.toFixed(1)}%)
                      </span>
                      <span className="text-right">
                        {inv.createdAt.toLocaleDateString()}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        <section>
          <h2 className="mb-4 font-display text-lg font-medium text-paper">
            Open companies
          </h2>
          <p className="mb-4 text-sm text-mist">
            Browse what&rsquo;s open, then request to invest on a
            company&rsquo;s page &mdash; an admin reviews and places it.
          </p>
          {companies.length === 0 ? (
            <p className="rounded-md border border-dashed border-brass/20 bg-paper px-4 py-6 text-center text-sm text-stone">
              No companies are open for investment yet.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {companies.map((company) => (
                <Link
                  key={company.id}
                  href={`/companies/${company.id}`}
                  className="flex flex-col rounded-lg border border-brass/15 bg-paper p-5 transition-colors hover:border-brass/40"
                >
                  <h3 className="font-display text-base font-medium text-ink">
                    {company.name}
                  </h3>
                  {company.sector && (
                    <span className="mt-1 inline-block w-fit rounded-full border border-ink/10 px-2 py-0.5 text-xs text-stone">
                      {company.sector}
                    </span>
                  )}
                  <p className="mt-3 flex-1 text-sm text-ink/80">
                    {company.description}
                  </p>
                  <div className="mt-4 flex items-baseline justify-between gap-2 border-t border-ink/10 pt-3">
                    <span className="shrink-0 text-xs uppercase tracking-wide text-stone">
                      Active money
                    </span>
                    <span className="min-w-0 break-words text-right font-mono font-tabular text-sm font-medium text-ink">
                      ${company.currentValue.toFixed(2)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-4 font-display text-lg font-medium text-paper">
            Recent wallet activity
          </h2>
          <LedgerList
            emptyLabel="No activity yet."
            rows={transactions.map((tx) => ({
              id: tx.id,
              primary: tx.type.replace("_", " "),
              secondary: tx.note,
              amount: tx.amount,
              signed: true,
              date: tx.createdAt,
            }))}
          />
        </section>
      </main>
    </div>
  );
}

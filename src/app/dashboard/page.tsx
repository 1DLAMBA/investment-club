import Link from "next/link";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getWalletBalance } from "@/lib/actions";
import { NavBar } from "@/components/NavBar";
import { LedgerList } from "@/components/LedgerList";
import { PortfolioAllocation } from "@/components/PortfolioAllocation";
import { Avatar } from "@/components/Avatar";

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [balance, companies, transactions, investments] = await Promise.all([
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

  const activeMoneyByCompany = await prisma.investment.groupBy({
    by: ["companyId"],
    where: { companyId: { in: companies.map((c) => c.id) } },
    _sum: { amount: true },
  });
  const activeMoney = new Map(
    activeMoneyByCompany.map((row) => [
      row.companyId,
      row._sum.amount ?? new Prisma.Decimal(0),
    ]),
  );

  const totalInvested = investments.reduce(
    (sum, inv) => sum.plus(inv.amount),
    new Prisma.Decimal(0),
  );

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
          <div className="mb-4 flex items-center gap-3">
            <Avatar name={session!.user.name ?? "?"} />
            <div className="min-w-0">
              <p className="truncate font-display text-base font-medium text-ink">
                {session!.user.name}
              </p>
              <p className="text-xs text-stone">Investment account</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-stone">
                Wallet balance
              </p>
              <p className="mt-2 font-mono text-3xl font-medium tabular-nums text-ink sm:text-4xl">
                ${balance.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-stone">
                Total invested
              </p>
              <p className="mt-2 font-mono text-3xl font-medium tabular-nums text-ink sm:text-4xl">
                ${totalInvested.toFixed(2)}
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

        <section>
          <h2 className="mb-4 font-display text-lg font-medium text-paper">
            Open companies
          </h2>
          <p className="mb-4 text-sm text-mist">
            Browse what&rsquo;s open, then tell an admin which one and how
            much &mdash; they&rsquo;ll place the investment for you.
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
                  <div className="mt-4 flex items-baseline justify-between border-t border-ink/10 pt-3">
                    <span className="text-xs uppercase tracking-wide text-stone">
                      Active money
                    </span>
                    <span className="font-mono font-tabular text-sm font-medium text-ink">
                      ${(activeMoney.get(company.id) ?? new Prisma.Decimal(0)).toFixed(2)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-4 font-display text-lg font-medium text-paper">
            Your investments
          </h2>
          <LedgerList
            emptyLabel="No investments yet."
            rows={investments.map((inv) => ({
              id: inv.id,
              primary: inv.company.name,
              amount: inv.amount,
              date: inv.createdAt,
            }))}
          />
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

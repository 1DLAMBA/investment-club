import Link from "next/link";
import { notFound } from "next/navigation";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NavBar } from "@/components/NavBar";
import { LiveActivityChart } from "@/components/LiveActivityChart";
import { PortfolioAllocation } from "@/components/PortfolioAllocation";

export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const isAdmin = session!.user.role === "ADMIN";

  const company = await prisma.company.findUnique({
    where: { id },
    include: {
      investments: { include: { user: true } },
    },
  });

  if (!company) notFound();

  const investments = company.investments;
  const activeMoney = investments.reduce(
    (sum, inv) => sum.plus(inv.amount),
    new Prisma.Decimal(0),
  );

  const allocationSlices = Object.values(
    investments.reduce<
      Record<string, { id: string; label: string; amount: Prisma.Decimal }>
    >((acc, inv) => {
      const existing = acc[inv.userId];
      acc[inv.userId] = {
        id: inv.userId,
        label: inv.user.name,
        amount: (existing?.amount ?? new Prisma.Decimal(0)).plus(inv.amount),
      };
      return acc;
    }, {}),
  );

  return (
    <div className="min-h-screen">
      <NavBar
        name={session!.user.name ?? ""}
        role={session!.user.role}
      />
      <main className="mx-auto max-w-2xl space-y-8 px-4 py-8 sm:space-y-10 sm:px-6 sm:py-10">
        <section className="rounded-lg border border-brass/15 bg-paper p-5 sm:p-6">
          <h1 className="font-display text-xl font-medium text-ink">
            {company.name}
          </h1>
          {company.sector && (
            <span className="mt-1 inline-block w-fit rounded-full border border-ink/10 px-2 py-0.5 text-xs text-stone">
              {company.sector}
            </span>
          )}
          <p className="mt-3 text-sm text-ink/80">{company.description}</p>

          <div className="mt-4 flex items-baseline justify-between border-t border-ink/10 pt-4">
            <span className="text-xs font-medium uppercase tracking-wide text-stone">
              Active money
            </span>
            <span className="font-mono text-2xl font-medium tabular-nums text-ink">
              ${activeMoney.toFixed(2)}
            </span>
          </div>

          <div className="mt-5 border-t border-ink/10 pt-5">
            <LiveActivityChart
              base={activeMoney.toNumber() || 100}
              historicalData={company.historicalData as number[]}
              currentValue={company.currentValue.toNumber()}
            />
          </div>

          {isAdmin && allocationSlices.length > 0 && (
            <div className="mt-6 border-t border-ink/10 pt-5">
              <PortfolioAllocation
                slices={allocationSlices}
                total={activeMoney}
                heading="Allocation by member"
                unitNoun="member"
                unitNounPlural="members"
              />
            </div>
          )}

          {isAdmin && (
            <Link
              href={`/admin/companies/${company.id}`}
              className="mt-6 inline-block text-sm font-medium text-ink underline"
            >
              Edit company
            </Link>
          )}
        </section>
      </main>
    </div>
  );
}

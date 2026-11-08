import Link from "next/link";
import { notFound } from "next/navigation";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { requestInvestment } from "@/lib/actions";
import { NavBar } from "@/components/NavBar";
import { LiveActivityChart } from "@/components/LiveActivityChart";
import { PortfolioAllocation } from "@/components/PortfolioAllocation";
import { LedgerList } from "@/components/LedgerList";
import { TextField } from "@/components/Field";
import { SubmitButton } from "@/components/SubmitButton";
import { ActionForm } from "@/components/ActionForm";
import { BackButton } from "@/components/BackButton";

export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const isAdmin = session!.user.role === "ADMIN";

  const [company, myRequests] = await Promise.all([
    prisma.company.findUnique({
      where: { id },
      include: { investments: { include: { user: true } } },
    }),
    prisma.investmentRequest.findMany({
      where: { userId: session!.user.id, companyId: id },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  if (!company) notFound();

  const investments = company.investments;
  const memberInvestments = investments.reduce(
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

  const requestInvestmentWithId = requestInvestment.bind(null, company.id);

  return (
    <div className="min-h-screen">
      <NavBar
        name={session!.user.name ?? ""}
        role={session!.user.role}
      />
      <main className="mx-auto max-w-2xl space-y-8 px-4 py-8 sm:space-y-10 sm:px-6 sm:py-10">
        <BackButton fallbackHref={isAdmin ? "/admin" : "/dashboard"} />
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

          <div className="mt-4 flex items-baseline justify-between gap-3 border-t border-ink/10 pt-4">
            <span className="shrink-0 text-xs font-medium uppercase tracking-wide text-stone">
              Active money
            </span>
            <span className="min-w-0 break-words text-right font-mono text-xl font-medium tabular-nums text-ink sm:text-2xl">
              ${company.currentValue.toFixed(2)}
            </span>
          </div>

          <div className="mt-5 border-t border-ink/10 pt-5">
            <LiveActivityChart
              base={company.currentValue.toNumber() || 100}
              historicalData={company.historicalData as number[]}
              currentValue={company.currentValue.toNumber()}
            />
          </div>

          {isAdmin && allocationSlices.length > 0 && (
            <div className="mt-6 border-t border-ink/10 pt-5">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-stone">
                Member investments: ${memberInvestments.toFixed(2)}
              </p>
              <PortfolioAllocation
                slices={allocationSlices}
                total={memberInvestments}
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

        {!isAdmin && (
          <section>
            <h2 className="mb-4 font-display text-lg font-medium text-paper">
              Request to invest
            </h2>
            {company.status !== "OPEN" ? (
              <p className="rounded-md border border-dashed border-brass/20 bg-paper px-4 py-6 text-center text-sm text-stone">
                This company isn&rsquo;t open for investment right now.
              </p>
            ) : (
              <>
                <p className="mb-4 text-sm text-mist">
                  Send a request with how much you&rsquo;d like to put in
                  &mdash; an admin reviews it and places the investment once
                  approved.
                </p>
                <ActionForm
                  action={requestInvestmentWithId}
                  className="grid gap-4 rounded-lg border border-brass/15 bg-paper p-5 sm:grid-cols-[auto_1fr] sm:items-end sm:p-6"
                >
                  <TextField
                    label="Amount"
                    type="number"
                    name="amount"
                    inputMode="decimal"
                    step="0.01"
                    min="0.01"
                    required
                    mono
                    className="sm:w-32"
                  />
                  <TextField
                    label="Note"
                    type="text"
                    name="note"
                    placeholder="Optional"
                  />
                  <SubmitButton className="sm:col-span-2">
                    Send request
                  </SubmitButton>
                </ActionForm>
              </>
            )}

            {myRequests.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-stone">
                  Your recent requests here
                </p>
                <LedgerList
                  emptyLabel=""
                  rows={myRequests.map((r) => ({
                    id: r.id,
                    primary: r.status,
                    secondary: r.note,
                    amount: r.amount,
                    date: r.createdAt,
                  }))}
                />
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

import { notFound } from "next/navigation";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { creditWallet, getWalletBalance, investForUser } from "@/lib/actions";
import { NavBar } from "@/components/NavBar";
import { SubmitButton } from "@/components/SubmitButton";
import { TextField, SelectField } from "@/components/Field";
import { LedgerList } from "@/components/LedgerList";
import { PortfolioAllocation } from "@/components/PortfolioAllocation";
import { Avatar } from "@/components/Avatar";
import { ActionForm } from "@/components/ActionForm";
import { BackButton } from "@/components/BackButton";
import { DeleteUserButton } from "@/components/DeleteUserButton";

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) notFound();

  const [balance, transactions, investments, openCompanies] = await Promise.all([
    getWalletBalance(id),
    prisma.walletTransaction.findMany({
      where: { userId: id },
      include: { createdBy: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.investment.findMany({
      where: { userId: id },
      include: { company: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.company.findMany({
      where: { status: "OPEN" },
      orderBy: { name: "asc" },
    }),
  ]);

  const creditWalletWithId = creditWallet.bind(null, id);
  const investForUserWithId = investForUser.bind(null, id);

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
      <NavBar name={session!.user.name ?? ""} role="ADMIN" />
      <main className="mx-auto max-w-2xl space-y-8 px-4 py-8 sm:space-y-10 sm:px-6 sm:py-10">
        <BackButton fallbackHref="/admin" />
        <section className="rounded-lg border border-brass/15 bg-paper p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <Avatar name={user.name} avatarUrl={user.avatarUrl} />
            <div className="min-w-0">
              <h1 className="truncate font-display text-lg font-medium text-ink">
                {user.name}
              </h1>
              <p className="truncate text-sm text-stone">{user.email}</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="min-w-0">
              <p className="break-words font-mono text-2xl font-medium tabular-nums text-ink sm:text-3xl">
                ${balance.toFixed(2)}
              </p>
              <p className="text-xs text-stone">Wallet balance</p>
            </div>
            <div className="min-w-0">
              <p className="break-words font-mono text-2xl font-medium tabular-nums text-ink sm:text-3xl">
                ${totalInvested.toFixed(2)}
              </p>
              <p className="text-xs text-stone">Total invested</p>
            </div>
          </div>

          {allocationSlices.length > 0 && (
            <div className="mt-6 border-t border-ink/10 pt-5">
              <PortfolioAllocation slices={allocationSlices} total={totalInvested} />
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-4 font-display text-lg font-medium text-paper">
            Credit wallet
          </h2>
          <ActionForm
            action={creditWalletWithId}
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
              placeholder="e.g. Received $500 via bank transfer"
            />
            <SubmitButton className="sm:col-span-2">Add funds</SubmitButton>
          </ActionForm>
        </section>

        <section>
          <h2 className="mb-4 font-display text-lg font-medium text-paper">
            Invest on their behalf
          </h2>
          <p className="mb-4 text-sm text-mist">
            {user.name} can see companies but can&rsquo;t invest directly —
            when they tell you where to put their money, enter it here.
          </p>
          {openCompanies.length === 0 ? (
            <p className="rounded-md border border-dashed border-brass/20 bg-paper px-4 py-6 text-center text-sm text-stone">
              No companies are open for investment yet.
            </p>
          ) : (
            <ActionForm
              action={investForUserWithId}
              className="grid gap-4 rounded-lg border border-brass/15 bg-paper p-5 sm:grid-cols-[1fr_auto] sm:items-end sm:p-6"
            >
              <SelectField label="Company" name="companyId" required>
                {openCompanies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </SelectField>
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
              <SubmitButton className="sm:col-span-2">
                Place investment
              </SubmitButton>
            </ActionForm>
          )}
        </section>

        <section>
          <h2 className="mb-4 font-display text-lg font-medium text-paper">
            Investments
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
            Transaction history
          </h2>
          <LedgerList
            emptyLabel="No transactions yet."
            rows={transactions.map((tx) => ({
              id: tx.id,
              primary: tx.type.replace("_", " "),
              secondary: tx.note,
              amount: tx.amount,
              signed: true,
              date: tx.createdAt,
              meta: `by ${tx.createdBy.name}`,
            }))}
          />
        </section>

        {user.role === "INVESTOR" && (
          <section className="rounded-lg border border-debit/30 bg-paper p-5 sm:p-6">
            <h2 className="mb-1 font-display text-lg font-medium text-debit">
              Danger zone
            </h2>
            <p className="mb-4 text-sm text-stone">
              Deletes {user.name}&rsquo;s account, wallet history, and
              investments for good. There&rsquo;s no undo.
            </p>
            <DeleteUserButton userId={user.id} userName={user.name} />
          </section>
        )}
      </main>
    </div>
  );
}

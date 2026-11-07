import { notFound } from "next/navigation";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { updateCompany } from "@/lib/actions";
import { NavBar } from "@/components/NavBar";
import { SubmitButton } from "@/components/SubmitButton";
import { TextField, TextAreaField, SelectField } from "@/components/Field";
import { LedgerList } from "@/components/LedgerList";
import { PortfolioAllocation } from "@/components/PortfolioAllocation";
import { LiveActivityChart } from "@/components/LiveActivityChart";
import { ActionForm } from "@/components/ActionForm";

export default async function EditCompanyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  const company = await prisma.company.findUnique({
    where: { id },
    include: {
      investments: { include: { user: true }, orderBy: { createdAt: "desc" } },
    },
  });

  if (!company) notFound();

  const updateCompanyWithId = updateCompany.bind(null, company.id);

  const activeMoney = company.investments.reduce(
    (sum, inv) => sum.plus(inv.amount),
    new Prisma.Decimal(0),
  );

  const allocationSlices = Object.values(
    company.investments.reduce<
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
      <NavBar name={session!.user.name ?? ""} role="ADMIN" />
      <main className="mx-auto max-w-2xl space-y-8 px-4 py-8 sm:space-y-10 sm:px-6 sm:py-10">
        <section className="rounded-lg border border-brass/15 bg-paper p-5 sm:p-6">
          <p className="text-xs font-medium uppercase tracking-wide text-stone">
            Active money
          </p>
          <p className="mt-2 font-mono text-3xl font-medium tabular-nums text-ink sm:text-4xl">
            ${activeMoney.toFixed(2)}
          </p>
          <p className="mt-2 text-xs text-stone">
            Total currently invested in {company.name} across all members.
          </p>

          <div className="mt-6 border-t border-ink/10 pt-5">
            <LiveActivityChart base={activeMoney.toNumber() || 100} />
          </div>

          {allocationSlices.length > 0 && (
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
        </section>

        <section>
          <h1 className="mb-4 font-display text-lg font-medium text-paper">
            Edit company
          </h1>
          <ActionForm
            action={updateCompanyWithId}
            className="grid gap-4 rounded-lg border border-brass/15 bg-paper p-5 sm:p-6"
          >
            <TextField
              label="Company name"
              type="text"
              name="name"
              defaultValue={company.name}
              required
            />
            <TextField
              label="Sector"
              type="text"
              name="sector"
              defaultValue={company.sector ?? ""}
              hint="Optional"
            />
            <TextAreaField
              label="Description"
              name="description"
              defaultValue={company.description}
              required
              rows={3}
            />
            <SelectField
              label="Status"
              name="status"
              defaultValue={company.status}
            >
              <option value="OPEN">Open for investment</option>
              <option value="CLOSED">Closed</option>
            </SelectField>
            <SubmitButton>Save changes</SubmitButton>
          </ActionForm>
        </section>

        <section>
          <h2 className="mb-4 font-display text-lg font-medium text-paper">
            Investments
          </h2>
          <LedgerList
            emptyLabel="No investments yet."
            rows={company.investments.map((inv) => ({
              id: inv.id,
              primary: inv.user.name,
              amount: inv.amount,
              date: inv.createdAt,
            }))}
          />
        </section>
      </main>
    </div>
  );
}

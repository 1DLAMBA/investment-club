import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createCompany } from "@/lib/actions";
import { NavBar } from "@/components/NavBar";
import { SubmitButton } from "@/components/SubmitButton";
import { TextField, TextAreaField } from "@/components/Field";
import { ActionForm } from "@/components/ActionForm";

export default async function AdminPage() {
  const session = await auth();

  const [companies, users] = await Promise.all([
    prisma.company.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { investments: true } } },
    }),
    prisma.user.findMany({
      where: { role: "INVESTOR" },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="min-h-screen">
      <NavBar name={session!.user.name ?? ""} role="ADMIN" />
      <main className="mx-auto max-w-4xl space-y-8 px-4 py-8 sm:space-y-10 sm:px-6 sm:py-10">
        <h1 className="sr-only">Admin console</h1>
        <section>
          <h2 className="mb-4 font-display text-lg font-medium text-paper">
            Add a company
          </h2>
          <ActionForm
            action={createCompany}
            className="grid gap-4 rounded-lg border border-brass/15 bg-paper p-5 sm:grid-cols-2 sm:p-6"
          >
            <TextField
              label="Company name"
              type="text"
              name="name"
              required
              className="sm:col-span-2"
            />
            <TextField
              label="Sector"
              type="text"
              name="sector"
              hint="Optional"
              className="sm:col-span-2"
            />
            <TextAreaField
              label="Description"
              name="description"
              required
              rows={3}
              className="sm:col-span-2"
            />
            <div className="sm:col-span-2">
              <SubmitButton>Create company</SubmitButton>
            </div>
          </ActionForm>
        </section>

        <section>
          <h2 className="mb-4 font-display text-lg font-medium text-paper">
            Companies
          </h2>
          <div className="divide-y divide-ink/10 rounded-lg border border-brass/15 bg-paper">
            {companies.map((company) => (
              <Link
                key={company.id}
                href={`/admin/companies/${company.id}`}
                className="flex min-h-14 items-center justify-between gap-3 px-4 py-3 hover:bg-ink/5"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink">
                    {company.name}
                  </p>
                  <p className="text-xs text-stone">
                    {company._count.investments} investment(s)
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${
                    company.status === "OPEN"
                      ? "border-credit/30 text-credit"
                      : "border-ink/15 text-stone"
                  }`}
                >
                  {company.status}
                </span>
              </Link>
            ))}
            {companies.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-stone">
                No companies yet.
              </p>
            )}
          </div>
        </section>

        <section>
          <h2 className="mb-4 font-display text-lg font-medium text-paper">
            Users
          </h2>
          <div className="divide-y divide-ink/10 rounded-lg border border-brass/15 bg-paper">
            {users.map((user) => (
              <Link
                key={user.id}
                href={`/admin/users/${user.id}`}
                className="flex min-h-14 items-center justify-between gap-3 px-4 py-3 hover:bg-ink/5"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink">{user.name}</p>
                  <p className="truncate text-xs text-stone">{user.email}</p>
                </div>
                <span className="shrink-0 text-sm text-stone">View →</span>
              </Link>
            ))}
            {users.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-stone">
                No investors registered yet.
              </p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

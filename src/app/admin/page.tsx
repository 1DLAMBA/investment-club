import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isOwnerAdmin } from "@/lib/admin";
import {
  createCompany,
  createAdmin,
  approveInvestmentRequest,
  rejectInvestmentRequest,
} from "@/lib/actions";
import { NavBar } from "@/components/NavBar";
import { SubmitButton } from "@/components/SubmitButton";
import { TextField, TextAreaField } from "@/components/Field";
import { ActionForm } from "@/components/ActionForm";
import { Avatar } from "@/components/Avatar";

export default async function AdminPage() {
  const session = await auth();
  const isOwner = isOwnerAdmin(session!.user.email ?? "");

  const [companies, users, pendingRequests] = await Promise.all([
    prisma.company.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { investments: true } } },
    }),
    prisma.user.findMany({
      where: { role: "INVESTOR" },
      orderBy: { createdAt: "desc" },
    }),
    prisma.investmentRequest.findMany({
      where: { status: "PENDING" },
      include: { user: true, company: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return (
    <div className="min-h-screen">
      <NavBar name={session!.user.name ?? ""} role="ADMIN" />
      <main className="mx-auto max-w-4xl space-y-8 px-4 py-8 sm:space-y-10 sm:px-6 sm:py-10">
        <h1 className="sr-only">Admin console</h1>

        {pendingRequests.length > 0 && (
          <section>
            <h2 className="mb-4 font-display text-lg font-medium text-paper">
              Investment requests
            </h2>
            <ul className="divide-y divide-ink/10 rounded-lg border border-brass/15 bg-paper">
              {pendingRequests.map((req) => {
                const approve = approveInvestmentRequest.bind(null, req.id);
                const reject = rejectInvestmentRequest.bind(null, req.id);
                return (
                  <li key={req.id} className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm">
                          <Link
                            href={`/admin/users/${req.userId}`}
                            className="font-medium text-ink hover:underline"
                          >
                            {req.user.name}
                          </Link>{" "}
                          wants to invest in{" "}
                          <Link
                            href={`/admin/companies/${req.companyId}`}
                            className="font-medium text-ink hover:underline"
                          >
                            {req.company.name}
                          </Link>
                        </p>
                        {req.note && (
                          <p className="mt-0.5 truncate text-xs text-stone">
                            &ldquo;{req.note}&rdquo;
                          </p>
                        )}
                      </div>
                      <span className="shrink-0 font-mono font-tabular text-sm font-medium text-ink">
                        ${req.amount.toFixed(2)}
                      </span>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <ActionForm action={approve}>
                        <SubmitButton>Approve</SubmitButton>
                      </ActionForm>
                      <ActionForm action={reject}>
                        <SubmitButton variant="secondary">Reject</SubmitButton>
                      </ActionForm>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

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
                    {company._count.investments} investment(s) &middot; active
                    money ${company.currentValue.toFixed(2)}
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
                className="flex min-h-14 items-center gap-3 px-4 py-3 hover:bg-ink/5"
              >
                <Avatar name={user.name} avatarUrl={user.avatarUrl} className="h-9 w-9 text-sm" />
                <div className="min-w-0 flex-1">
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

        {isOwner && (
          <section>
            <h2 className="mb-4 font-display text-lg font-medium text-paper">
              Add an admin
            </h2>
            <p className="mb-4 text-sm text-mist">
              Only the primary admin account can create other admins.
            </p>
            <ActionForm
              action={createAdmin}
              className="grid gap-4 rounded-lg border border-brass/15 bg-paper p-5 sm:grid-cols-2 sm:p-6"
            >
              <TextField
                label="Full name"
                type="text"
                name="name"
                required
                className="sm:col-span-2"
              />
              <TextField
                label="Email"
                type="email"
                name="email"
                required
                className="sm:col-span-2"
              />
              <TextField
                label="Password"
                type="password"
                name="password"
                required
                minLength={8}
                hint="At least 8 characters."
                className="sm:col-span-2"
              />
              <div className="sm:col-span-2">
                <SubmitButton>Create admin account</SubmitButton>
              </div>
            </ActionForm>
          </section>
        )}
      </main>
    </div>
  );
}

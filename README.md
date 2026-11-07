# Investment Club

An internal tool for a closed investment club: an admin creates companies,
members register and invest, and the admin credits members' wallets after
receiving funds outside the platform (no real payment processing, no
withdrawals).

## Stack

- **Next.js** (App Router) — one framework for both the UI and the backend
  (server actions, API routes)
- **Vercel Postgres** (Neon) — free-tier Postgres, zero-config on Vercel
- **Prisma** — schema, migrations, type-safe queries
- **Auth.js (NextAuth v5)** — email/password login with `ADMIN` / `INVESTOR`
  roles

## How money works here

There is **no withdrawal button** anywhere in the app, and no payment
processor integration. Wallet balances are never edited as a raw number —
every change is a row in `WalletTransaction` (type, amount, note, who did it,
when), and a user's balance is just the sum of their rows. This gives a full
audit trail: an admin "adds funds" by recording that a transaction happened
(e.g. "received $500 via bank transfer"), and investing debits the wallet and
creates an `Investment` record, atomically.

## Local development

1. **Get a Postgres database.** Easiest: create a free one at
   [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres) or
   [neon.tech](https://neon.tech), and copy the connection strings it gives
   you.
2. Copy `.env.example` to `.env` and fill in `DATABASE_URL` / `DIRECT_URL`
   with that connection string (use the same value for both for Neon/Vercel
   Postgres — they don't require a separate direct connection). Generate
   `AUTH_SECRET` with:
   ```bash
   openssl rand -base64 32
   ```
3. Install dependencies and push the schema:
   ```bash
   npm install
   npm run db:push
   ```
4. Seed the first admin account (reads `SEED_ADMIN_*` from `.env`):
   ```bash
   npm run db:seed
   ```
5. Run the dev server:
   ```bash
   npm run dev
   ```
   Sign in at `/login` with the seeded admin credentials. Anyone else who
   registers at `/register` gets the `INVESTOR` role.

## Deploying to Vercel

1. Push this repo to GitHub.
2. Import the repo into [Vercel](https://vercel.com/new).
3. In the project's **Storage** tab, add the **Postgres** integration
   (powered by Neon). This automatically sets `DATABASE_URL` and
   `DIRECT_URL` for you.
4. Add the remaining environment variables in **Settings → Environment
   Variables**: `AUTH_SECRET` (generate with `openssl rand -base64 32`),
   and optionally `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` /
   `SEED_ADMIN_NAME` if you plan to run the seed script against production.
5. Deploy. Then run the schema push and seed against production once,
   either via `vercel env pull` + `npm run db:push && npm run db:seed`
   locally, or from the Vercel project's own shell/CLI.

## Project structure

- `prisma/schema.prisma` — data model (`User`, `Company`, `Investment`,
  `WalletTransaction`)
- `prisma/seed.ts` — creates the first admin account
- `src/auth.ts` — Auth.js config (credentials login, JWT sessions, roles)
- `src/proxy.ts` — route protection (redirects based on auth/role)
- `src/lib/actions.ts` — all server actions (register, login, create/update
  company, credit wallet, invest)
- `src/app/(login|register)` — public auth pages
- `src/app/dashboard` — investor view (balance, open companies, invest,
  history)
- `src/app/admin` — admin views (create/edit companies, list users, per-user
  profile with credit-wallet form and transaction history)

## Known gaps / next steps

- Form errors currently surface via Next.js's error boundary
  (`src/app/error.tsx`) rather than inline validation — fine for an internal
  tool, worth upgrading to `useActionState` if this grows.
- No email verification or password reset flow.
- No pagination on transaction/investment tables — fine at club scale, would
  need it at real volume.

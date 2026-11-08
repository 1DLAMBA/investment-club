# Integration Notes

This file tracks all external services, APIs, and databases integrated into the investment-club project.

---

## Database

### Supabase (Primary Database)
- **Status**: ✅ Active
- **Project ID**: `obpkvdbqxxdnqxkxeyfa`
- **Dashboard**: https://supabase.com/dashboard/project/obpkvdbqxxdnqxkxeyfa
- **Region**: us-east-1
- **Database**: PostgreSQL 17.11.0.018
- **Cost**: Free tier (500MB storage, persistent connections)

### Connection Strings
- **Transaction mode** (for Vercel/serverless):
  ```
  postgresql://postgres.obpkvdbqxxdnqxkxeyfa:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
  ```
- **Direct connection** (for local dev/migrations):
  ```
  postgresql://postgres.obpkvdbqxxdnqxkxeyfa:[PASSWORD]@db.obpkvdbqxxdnqxkxeyfa.supabase.co:5432/postgres
  ```
- **Password**: `Alambata15!`

⚠️ **SECURITY NOTE**: Never commit INTEGRATIONS.md to public repositories. This file contains credentials.

### Environment Variables Required
- `DATABASE_URL`
- `DIRECT_URL`

### ORM
- **Prisma** - Used for schema management and type-safe queries
- Schema file: `prisma/schema.prisma`
- Migrations: `npm run db:push`

---

## Authentication

### NextAuth v5
- **Purpose**: User authentication (email/password)
- **Strategy**: JWT sessions
- **Config**: `src/auth.ts`
- **Providers**: Credentials (custom email/password)

### Environment Variables Required
- `AUTH_SECRET` - Critical for JWT token signing
  - Current value: `QEOYE+BfhiY6r3iWp3RD7J/Pr1OgPjN8c4/6g1/Gxbg=`
  - Generate new with: `openssl rand -base64 32`

### Seed Admin Credentials
- **Email**: `admin@example.com`
- **Password**: `changeme123`
- **Name**: Admin
- **Role**: ADMIN

---

## Deployment

### Vercel
- **Status**: ✅ Active
- **Project**: https://vercel.com/hms-projects-e61060e2/investment-club
- **Production URL**: https://investment-coin-chi.vercel.app
- **GitHub**: https://github.com/1DLAMBA/investment-club

### Environment Variables Required in Vercel
- `DATABASE_URL` - Supabase transaction mode connection string
- `DIRECT_URL` - Supabase direct connection string
- `AUTH_SECRET` - NextAuth secret
- `SEED_ADMIN_EMAIL` - Admin email (optional)
- `SEED_ADMIN_PASSWORD` - Admin password (optional)
- `SEED_ADMIN_NAME` - Admin name (optional)

### Automatic Deployment
- Triggers on push to `main` branch
- No manual seeding needed after initial setup
- First login automatically seeds database

---

## API Services

### None currently integrated

---

## Third-Party Libraries

### Next.js 16.4.5
- Breaking changes from standard Next.js
- Docs: `node_modules/next/dist/docs/`
- Turbopack enabled

### NextAuth v5 (beta)
- Breaking changes from v4
- Config: `src/auth.ts`
- API route: `src/app/api/auth/[...nextauth]/route.ts`

### Prisma 6.19.3
- Client: `@prisma/client`
- CLI: `prisma`
- Database: PostgreSQL

### React 19.3.0
- Latest version with new features

---

## Development

### Local Database
- Currently configured for Supabase (not local)
- To use local Postgres, update `.env` with local connection string

### Seed Script
- **Location**: `prisma/seed.ts`
- **Run with**: `npm run db:seed`
- **Update script**: `prisma/update-companies.ts`
- **Auto-seed on first login** via `/api/seed` endpoint

### Test Framework
- **Playwright** - E2E testing
- Config: `playwright.config.ts`
- Tests: `tests/` directory
- Run tests: `npx playwright test`

---

## Important Notes

### Why Supabase over Vercel Postgres
- Supabase free tier doesn't auto-pause (Vercel Postgres does)
- More reliable persistent connections
- Better for serverless deployments

### Authentication Flow
1. User visits `/login` or `/register`
2. `/api/seed` is called to ensure admin user exists
3. NextAuth validates credentials against Supabase
4. JWT session created with role information
5. Middleware redirects based on role (ADMIN → /admin, INVESTOR → /dashboard)

### Seeding Strategy
- Automatic seeding on first login via `/api/seed` endpoint
- Checks if admin user exists before creating
- Creates 11 companies with fictional value data
- Idempotent - safe to run multiple times

### Wallet System
- All balance changes are rows in `WalletTransaction`
- User balance = sum of all their transactions
- Full audit trail maintained
- No raw number editing allowed

---

## Last Updated
- Date: 2026-11-08
- Changes: Switched from Vercel Postgres to Supabase, created this tracking file

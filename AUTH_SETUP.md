# CRITICAL: Authentication Setup Required

The application is not working because `AUTH_SECRET` is missing in Vercel production environment.

## What You Need to Do (2 minutes)

### Step 1: Add AUTH_SECRET to Vercel

1. Go to your Vercel project: https://vercel.com/hms-projects-e61060e2/investment-club
2. Click **Settings** → **Environment Variables**
3. Click **Add New**
4. Fill in:
   - **Name**: `AUTH_SECRET`
   - **Value**: `QEOYE+BfhiY6r3iWp3RD7J/Pr1OgPjN8c4/6g1/Gxbg=`
   - **Environment**: Select **Production**, **Preview**, and **Development** (all three)
5. Click **Save**

### Step 2: Add Seed Admin Variables (Optional but recommended)

Add these environment variables as well:

- **SEED_ADMIN_EMAIL**: `admin@example.com`
- **SEED_ADMIN_PASSWORD**: `changeme123`
- **SEED_ADMIN_NAME**: `Admin`

Select **Production**, **Preview**, and **Development** for each.

### Step 3: Redeploy

1. Go to **Deployments** tab
2. Click **Redeploy** on the latest deployment

### Step 4: Test

Visit https://investment-club-chi.vercel.app/login and login with:
- Email: `admin@example.com`
- Password: `changeme123`

## Why This is Needed

NextAuth requires `AUTH_SECRET` to sign and encrypt JWT tokens. Without it, authentication will fail with a "Configuration" error. The automatic seeding also won't work without the database connection.

## What I've Already Done

✅ Created automatic seeding system (runs on first login)
✅ Added fallback AUTH_SECRET generation (but it changes on each build)
✅ Fixed redirect handling in NextAuth
✅ Updated Playwright tests for client-side auth
✅ Deployed all changes to GitHub and Vercel

The only missing piece is the `AUTH_SECRET` environment variable in Vercel.

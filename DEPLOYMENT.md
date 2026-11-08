# Vercel Deployment Guide

## Prerequisites
- GitHub account (already connected)
- Vercel account (free)
- Supabase account (free)
- Supabase project created: `investment-club` (ID: obpkvdbqxxdnqxkxeyfa)

## Step 1: Deploy to Vercel (Web Interface)

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click "Add GitHub Organization or Account" and authorize Vercel to access your GitHub
3. Find the `investment-club` repository in the list and click **Import**
4. Configure the project:
   - **Project Name**: `investment-club` (or any name you prefer)
   - **Framework Preset**: Next.js (should be auto-detected)
   - **Root Directory**: `./` (leave as default)
5. Click **Deploy**

## Step 2: Add Environment Variables (CRITICAL)

1. Go to your project's **Settings → Environment Variables**
2. Add the following variables:

   **DATABASE_URL** (required - Supabase Transaction mode):
   ```
   postgresql://postgres.obpkvdbqxxdnqxkxeyfa:Alambata15!@aws-0-us-east-1.pooler.supabase.com:6543/postgres
   ```

   **DIRECT_URL** (required - Supabase Direct connection):
   ```
   postgresql://postgres.obpkvdbqxxdnqxkxeyfa:Alambata15!@db.obpkvdbqxxdnqxkxeyfa.supabase.co:5432/postgres
   ```

   **AUTH_SECRET** (required):
   ```
   QEOYE+BfhiY6r3iWp3RD7J/Pr1OgPjN8c4/6g1/Gxbg=
   ```

   **SEED_ADMIN_EMAIL** (optional):
   ```
   admin@example.com
   ```

   **SEED_ADMIN_PASSWORD** (optional):
   ```
   changeme123
   ```

   **SEED_ADMIN_NAME** (optional):
   ```
   Admin
   ```

3. Click **Save** and then **Redeploy** to apply the variables

## Step 3: Run Database Schema and Seed

### Option A: Via Vercel CLI (Recommended)

1. Install Vercel CLI locally if not already installed:
   ```bash
   npm i -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Pull environment variables:
   ```bash
   cd ~/Documents/Projects/investment-club
   vercel env pull .env
   ```

4. Push schema and seed:
   ```bash
   npm run db:push
   npm run db:seed
   npm run db:update-companies
   ```

### Option B: Via Vercel Web Shell

1. Go to your Vercel project
2. Click **Deployments** tab
3. Click the three dots next to the latest deployment
4. Select **Open Shell**
5. Run the following commands:
   ```bash
   npm run db:push
   npm run db:seed
   npm run db:update-companies
   ```

## Step 4: Verify Deployment

1. Visit your deployed URL (e.g., `https://investment-club.vercel.app`)
2. Navigate to `/login`
3. Sign in with the seeded admin credentials:
   - Email: `admin@example.com` (or your SEED_ADMIN_EMAIL)
   - Password: `changeme123` (or your SEED_ADMIN_PASSWORD)

## Automatic Deployments

After the initial setup:
- Every push to the `main` branch will trigger an automatic deployment
- You don't need to run `db:push` again unless you change the schema
- You don't need to reseed unless you want to reset the data

## Important Notes

- **Supabase Database**: Free tier includes 500MB storage with persistent connections (doesn't auto-pause like Vercel Postgres)
- **Seeding**: The seed script is idempotent - running it multiple times won't create duplicate data
- **Environment Variables**: Never commit `.env` to git (it's already in `.gitignore`)
- **Authentication**: Make sure to set a strong `AUTH_SECRET` in production

## Troubleshooting

### Database Connection Errors
- Ensure `DATABASE_URL` and `DIRECT_URL` are set in environment variables
- Verify the Supabase project is active (https://supabase.com/dashboard/project/obpkvdbqxxdnqxkxeyfa)
- Check that the database is not paused

### Seed Not Working
- Make sure all `SEED_ADMIN_*` variables are set
- Check the deployment logs for errors
- Try running the seed command via the Vercel web shell

### Build Errors
- Ensure all dependencies are installed locally (`npm install`)
- Check that `package.json` has the correct scripts
- Review the deployment logs in Vercel

# Vercel Deployment Guide

## Prerequisites
- GitHub account (already connected)
- Vercel account (free)

## Step 1: Deploy to Vercel (Web Interface)

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click "Add GitHub Organization or Account" and authorize Vercel to access your GitHub
3. Find the `investment-club` repository in the list and click **Import**
4. Configure the project:
   - **Project Name**: `investment-club` (or any name you prefer)
   - **Framework Preset**: Next.js (should be auto-detected)
   - **Root Directory**: `./` (leave as default)
5. Click **Deploy**

## Step 2: Add Vercel Postgres Database

1. After the initial deployment, go to your project's **Storage** tab
2. Click **Create Database**
3. Select **Postgres** (powered by Neon)
4. Choose the **Hobby** plan (free tier)
5. Click **Create**
6. Vercel will automatically set `DATABASE_URL` and `DIRECT_URL` environment variables

## Step 3: Add Environment Variables (CRITICAL)

1. Go to your project's **Settings → Environment Variables**
2. Add the following variables:

   **AUTH_SECRET** (REQUIRED - Authentication will fail without this):
   ```bash
   openssl rand -base64 32
   ```
   Generate this locally and paste the value. This is used by NextAuth.js to sign JWT tokens.

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

⚠️ **IMPORTANT**: You MUST add `AUTH_SECRET` before authentication will work. Without it, you'll get a "Server Action not found" error when trying to log in.

## Step 4: Run Database Schema and Seed

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

1. Go to your project on Vercel
2. Click **Deployments** tab
3. Click the three dots next to the latest deployment
4. Select **Open Shell**
5. Run the following commands:
   ```bash
   npm run db:push
   npm run db:seed
   npm run db:update-companies
   ```

## Step 5: Verify Deployment

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

- **Postgres Database**: The free tier (Hobby) includes 512MB storage and 60 hours of compute per month
- **Seeding**: The seed script is idempotent - running it multiple times won't create duplicate data
- **Environment Variables**: Never commit `.env` to git (it's already in `.gitignore`)
- **Authentication**: Make sure to set a strong `AUTH_SECRET` in production

## Troubleshooting

### Database Connection Errors
- Ensure Vercel Postgres is properly linked
- Check that `DATABASE_URL` and `DIRECT_URL` are set in environment variables
- Verify the database is not paused (Vercel Postgres auto-pauses after inactivity)

### Seed Not Working
- Make sure all `SEED_ADMIN_*` variables are set
- Check the deployment logs for errors
- Try running the seed command via the Vercel web shell

### Build Errors
- Ensure all dependencies are installed locally (`npm install`)
- Check that `package.json` has the correct scripts
- Review the deployment logs in Vercel

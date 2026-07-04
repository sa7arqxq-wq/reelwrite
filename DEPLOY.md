# ReelWrite — Deploy to Production Guide

This guide walks you through deploying ReelWrite to a permanent, secure, scalable hosting environment so you can share it with real writers.

**Total time: ~25 minutes.** All services used have free tiers — you don't need to pay anything to launch.

---

## What you'll have at the end

- A permanent URL like `reelwrite.vercel.app` (or your custom domain like `reelwrite.app`)
- A cloud database that survives forever (Postgres on Neon)
- Secure authentication (real `NEXTAUTH_SECRET`, can't be forged)
- Automatic HTTPS
- Auto-scaling (handles traffic spikes)
- Automatic deploys when you push code to GitHub

---

## Prerequisites

You need:
- A GitHub account (free) — [github.com](https://github.com)
- An email address for signing up for Vercel and Neon

That's it. No credit card required for the free tiers.

---

## Step 1: Push your code to GitHub (5 min)

1. Create a new GitHub repository:
   - Go to [github.com/new](https://github.com/new)
   - Name it `reelwrite` (or whatever you want)
   - Set it to **Private** (recommended — this is proprietary code)
   - Check "Add a README file"
   - Click **Create repository**

2. Download your code from this sandbox:
   - In your sandbox file browser, select all files in `/home/z/my-project/`
   - Download them as a ZIP (or use git — see below)

3. Push the code to GitHub:
   ```bash
   # If you have git installed locally:
   cd reelwrite
   git init
   git add .
   git commit -m "Initial commit — ReelWrite"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/reelwrite.git
   git push -u origin main
   ```

   **Important:** Before pushing, verify `.gitignore` includes `.env*` so your secrets don't get uploaded. (It already does — I checked.)

---

## Step 2: Create a free Postgres database on Neon (5 min)

Neon gives you a free Postgres database with 0.5 GB storage — plenty for launch.

1. Go to [neon.tech](https://neon.tech) → click **Sign Up** → sign up with GitHub
2. Click **Create a new project**
3. Name it `reelwrite`
4. Select a region close to you (e.g. `US East` or `EU West`)
5. Click **Create project**

6. **Copy the connection string** — Neon shows it on the dashboard:
   ```
   postgresql://neondb_owner:password@ep-xxx-xxx.us-east-2.aws.neon.tech/reelwrite?sslmode=require
   ```
   Save this somewhere safe. You'll paste it into Vercel in Step 4.

---

## Step 3: Deploy to Vercel (10 min)

Vercel is the company that makes Next.js — they host Next.js apps for free.

1. Go to [vercel.com](https://vercel.com) → click **Sign Up** → **Continue with GitHub**

2. Click **Import Project** → select your `reelwrite` GitHub repo

3. Vercel auto-detects Next.js. **Don't click Deploy yet** — first configure environment variables:

4. Expand the **Environment Variables** section and add these one by one:

   | Name | Value | Environments |
   |------|-------|--------------|
   | `DATABASE_URL` | *(paste your Neon connection string from Step 2)* | Production, Preview, Development |
   | `NEXTAUTH_SECRET` | `sX4NkvybjcEaO78rRsJo4mEHNvM6Cs+LDj5xQ1TjiHo=` | Production, Preview, Development |
   | `NEXTAUTH_URL` | `https://YOUR_PROJECT_NAME.vercel.app` | Production |

   **Note:** For `NEXTAUTH_URL`, use the URL Vercel shows you (it'll be something like `reelwrite-xxx.vercel.app`). You can update this later after you add a custom domain.

   **Want a different secret?** Generate a new one:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```

5. **IMPORTANT:** Before deploying, you need to switch the database provider from SQLite to Postgres:

   **Option A — Do it in the sandbox before pushing to GitHub (recommended):**
   - Edit `prisma/schema.prisma`
   - Change `provider = "sqlite"` to `provider = "postgresql"`
   - Commit and push to GitHub
   - Vercel will pick up the change automatically

   **Option B — Do it on GitHub:**
   - Go to your GitHub repo → `prisma/schema.prisma` → click the pencil icon
   - Change `provider = "sqlite"` to `provider = "postgresql"`
   - Commit the change

6. Click **Deploy**

7. Wait 2-3 minutes for the build to complete. Vercel will show you a success screen with your live URL.

---

## Step 4: Create the database tables (2 min)

Your Postgres database exists but is empty. You need to create the tables and seed demo data.

### Option A — Using Vercel's terminal (easiest):

1. In your Vercel project dashboard → **Storage** tab
2. Connect your Neon database (Vercel has a Neon integration — click Connect)
3. Go to your project → **Settings** → **Functions** → scroll down
4. Or use Vercel CLI:
   ```bash
   npm i -g vercel
   vercel login
   vercel link   # link to your reelwrite project
   vercel env pull .env.local   # pulls your env vars locally
   bun run db:push    # creates all tables in Postgres
   bun run scripts/seed.ts   # adds demo writers + reels
   ```

### Option B — Using Neon's SQL editor:

1. In your Neon dashboard → **SQL Editor**
2. You'll need to run the Prisma migration manually. The easiest way is Option A above.

---

## Step 5: Test your live app (2 min)

1. Open your Vercel URL (`https://reelwrite-xxx.vercel.app`)
2. You should see the landing page
3. Click **Enter ReelWrite**
4. Click **Sign in / Sign up** → **Sign Up** tab
5. Create an account with your real email
6. Sign in — you should see the feed with demo reels
7. Create a reel, like a reel, open the admin console (if you promoted yourself)

**If something's broken:** Check Vercel → your project → **Logs** to see error messages.

---

## Step 6 (optional): Add a custom domain (10 min, ~$12/year)

1. Buy a domain at [Namecheap](https://namecheap.com), [Cloudflare](https://cloudflare.com), or [Google Domains](https://domains.google)
   - `.com` domains are ~$12/year, `.app` is ~$14/year

2. In Vercel → your project → **Settings** → **Domains**
3. Type your domain (e.g. `reelwrite.app`) → click **Add**
4. Vercel gives you DNS records to add:
   - Go to your domain registrar's DNS settings
   - Add an `A` record pointing to `76.76.21.21` (Vercel's IP)
   - Or add a `CNAME` record pointing to `cname.vercel-dns.com`
5. Wait 5-30 minutes for DNS to propagate
6. Vercel automatically provisions HTTPS (Let's Encrypt)

7. **Update `NEXTAUTH_URL`** in Vercel → Settings → Environment Variables:
   - Change from `https://reelwrite-xxx.vercel.app` to `https://reelwrite.app`
   - Redeploy (Vercel → Deployments → click the 3 dots → Redeploy)

---

## Step 7: Enable Google OAuth (optional, 10 min)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project → **APIs & Services** → **Credentials**
3. **Create Credentials** → **OAuth client ID**
4. Application type: **Web application**
5. **Authorized redirect URIs** — add BOTH:
   - `https://YOUR_DOMAIN/api/auth/callback/google`
   - `https://reelwrite-xxx.vercel.app/api/auth/callback/google` (your Vercel URL)
6. Copy the **Client ID** and **Client Secret**
7. In Vercel → Settings → Environment Variables, add:
   - `GOOGLE_CLIENT_ID` = your client ID
   - `GOOGLE_CLIENT_SECRET` = your client secret
8. Redeploy

Users will now see a "Sign in with Google" option.

---

## Promoting yourself to admin

After you deploy and create your account:

1. Sign up with your real email via the app
2. Open Neon's SQL editor (or use `vercel env pull` + local Prisma Studio)
3. Run this SQL to make yourself an admin:
   ```sql
   UPDATE User SET role = 'ADMIN' WHERE email = 'your-real-email@example.com';
   ```
4. Sign out and sign back in — you'll see the Admin tab in the bottom nav

---

## Troubleshooting

### "Database connection failed"
- Verify `DATABASE_URL` is set correctly in Vercel
- Make sure it includes `?sslmode=require` at the end (Neon requires SSL)
- Check that you changed `provider = "postgresql"` in `prisma/schema.prisma`

### "NEXTAUTH_SECRET is undefined"
- Make sure you added `NEXTAUTH_SECRET` to Vercel env vars
- Make sure it's set for the **Production** environment
- Redeploy after adding env vars

### "Sign in doesn't work"
- Check `NEXTAUTH_URL` matches your actual domain (including `https://`)
- Check Vercel Logs for the specific error

### "The feed is empty"
- You forgot to run the seed script. See Step 4.

### "Build failed on Vercel"
- Check the build logs — usually it's a missing env var
- Make sure `DATABASE_URL` is set before the first build (Prisma needs it to generate the client)

---

## Security checklist before you share the link

- [ ] `NEXTAUTH_SECRET` is set to a random 32+ char string (not the default)
- [ ] `DATABASE_URL` points to Postgres (not SQLite)
- [ ] `.env` is in `.gitignore` (already done — verify)
- [ ] Your GitHub repo is Private
- [ ] You've tested signup + signin on the live URL
- [ ] You've promoted yourself to admin
- [ ] You've tested creating a reel on the live URL

Once all boxes are checked, share your URL with real writers. 🎉

---

## Cost summary

| Service | Free tier limit | When you'd outgrow it |
|---------|----------------|----------------------|
| Vercel (Hobby) | 100GB bandwidth/month, unlimited deploys | ~10K+ daily visitors |
| Neon (Free) | 0.5GB storage, 1 always-on compute | ~50K+ reels + users |
| GitHub (Free) | Unlimited private repos | Never (for a single repo) |
| Domain | ~$12/year | N/A |

You can run ReelWrite for free until you have thousands of users. At that point you'll want to upgrade Vercel to Pro ($20/mo) for more bandwidth and Neon to Scale-out for more storage.

---

## Need help?

- Vercel docs: [vercel.com/docs](https://vercel.com/docs)
- Neon docs: [neon.tech/docs](https://neon.tech/docs)
- NextAuth docs: [next-auth.js.org](https://next-auth.js.org)

If something breaks during deploy, check the **Logs** tab in Vercel — it shows the exact error message. 90% of deploy issues are missing or misconfigured environment variables.

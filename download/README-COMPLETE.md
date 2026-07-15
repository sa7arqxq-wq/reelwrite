# ReelWrite — Complete App Package

## What's in this ZIP (227 files)

### Source Code (src/)
- `src/app/` — Next.js app router (pages + 30+ API routes)
- `src/components/` — 20+ React components (feed, reels, profiles, stories, DMs, admin, video trimmer)
- `src/lib/` — Database, auth, validation, security, subscription helpers
- `src/proxy.ts` — Security middleware (honeypots, rate limiting, attack detection)

### Database (prisma/)
- `schema.prisma` — 10 models (User, Book, Reel, Comment, Like, Follow, Story, SavedReel, Conversation, DirectMessage, SecurityEvent, BlockedIp)

### Public Assets (public/)
- PWA icons, manifest.json, robots.txt, sitemap.xml, OG image

### Scripts (scripts/)
- `seed.ts` — Seeds demo writers, books, and reels
- `gen-icons.js` — Generates PWA icons from SVG
- `gen-og-image.js` — Generates social sharing image
- `switch-db.sh` — Switches between SQLite and PostgreSQL
- `add-headers.js` — Adds copyright headers to all source files

### Config Files
- `package.json` — Dependencies and scripts
- `next.config.ts` — Next.js configuration
- `tsconfig.json` — TypeScript configuration
- `tailwind.config.ts` — Tailwind CSS configuration
- `eslint.config.mjs` — ESLint configuration
- `vercel.json` — Vercel deployment configuration

### Documentation
- `DEPLOY.md` — Step-by-step deploy guide
- `DOMAIN_SETUP.md` — Custom domain setup guide
- `IP_PROTECTION.md` — Intellectual property protection guide
- `LICENSE` — Proprietary copyright license
- `.env.example` — Environment variable template

## How to Run Locally

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env
# Edit .env with your database URL and auth secret

# 3. Create database tables
npx prisma db push

# 4. Seed demo data
npx tsx scripts/seed.ts

# 5. Run the app
npm run dev
```
Open http://localhost:3000

## How to Deploy

### Option 1: Vercel (if account is not blocked)
1. Push code to GitHub
2. Import repo on Vercel
3. Add env vars (DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL)
4. Deploy

### Option 2: Render (free, needs card for verification)
1. Push code to GitHub
2. Create Web Service on Render
3. Build: `npm install && npx prisma generate && npm run build`
4. Start: `npm run start`
5. Add env vars
6. Deploy

### Option 3: Any Node.js host
1. Push code to any Git host
2. Install deps: `npm install`
3. Generate Prisma: `npx prisma generate`
4. Build: `npm run build`
5. Start: `npm run start`

## Environment Variables

| Key | Value |
|-----|-------|
| `DATABASE_URL` | `postgresql://user:pass@host/db?sslmode=require` |
| `NEXTAUTH_SECRET` | Any random 32+ character string |
| `NEXTAUTH_URL` | `https://your-domain.com` |

## Features (20+)

1. TikTok-style vertical snap-scroll feed
2. 7-second kinetic typography reels
3. 4 background modes (mood, book cover, image, video)
4. Video trimmer (upload any video, app trims to 7 seconds)
5. AI hook extraction from book pitches
6. Creative hook rewriting engine
7. Comment threading with replies + author badges
8. Instagram-style stories (24-hour expiry)
9. Direct messages (DMs)
10. Social sharing (8 platforms)
11. QR code + downloadable shareable card
12. Writer profiles with books catalog
13. Reel management (edit, delete, archive)
14. Saved reels library
15. Private/public account toggle
16. Free/Pro subscription system ($5/month)
17. Admin console (moderation, security monitoring)
18. Security system (honeypots, attack detection, rate limiting, IP blocking)
19. "Made on ReelWrite" watermark
20. PWA-ready (installable on mobile)
21. Copyright protection (LICENSE, headers)
22. Desktop layout (centered phone column)

## Demo Accounts
All password: `demo1234`
- marina@reelwrite.demo (admin)
- theodore@reelwrite.demo
- kael@reelwrite.demo
- sasha@reelwrite.demo
- fenwick@reelwrite.demo
- opal@reelwrite.demo

## Tech Stack
- Next.js 16, React, TypeScript
- Tailwind CSS 4, shadcn/ui, Framer Motion
- Prisma ORM, PostgreSQL
- NextAuth.js v4
- 15,000+ lines of code

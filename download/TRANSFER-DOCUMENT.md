# ReelWrite — Transfer Document

## What You're Buying

ReelWrite is a TikTok-style platform for writers to market their books via 7-second kinetic-typography reels.

## What's Included

### Source Code (reelwrite-source-code.zip)
- Full Next.js 16 application (TypeScript)
- 30+ API routes (auth, reels, comments, DMs, stories, admin, security)
- 20+ React components (feed, reels, profiles, stories, DMs, admin console)
- Prisma ORM schema (8+ database models)
- Security system (honeypots, attack detection, rate limiting, IP blocking)
- PWA assets (icons, manifest, sitemap, robots.txt)
- Copyright protection (LICENSE, headers, ownership notice)

### Tech Stack
- **Frontend:** Next.js 16, React, TypeScript, Tailwind CSS 4, shadcn/ui, Framer Motion
- **Backend:** Next.js API Routes, Prisma ORM, PostgreSQL (Neon)
- **Auth:** NextAuth.js v4 (email/password + Google OAuth ready)
- **Database:** PostgreSQL (Neon — free tier)
- **Hosting:** Vercel (or any Node.js host)

### Features
1. TikTok-style vertical snap-scroll feed
2. 7-second kinetic typography reels
3. 4 background modes (mood gradient, book cover, image upload, video upload)
4. AI hook extraction from book pitches
5. Creative hook rewriting engine
6. Comment threading with replies + author badges
7. Instagram-style stories (24-hour expiry)
8. Direct messages (DMs)
9. Social sharing (8 platforms: Instagram, TikTok, Threads, X, WhatsApp, Facebook, Telegram, Email)
10. QR code + downloadable shareable card
11. Writer profiles with books catalog
12. Reel management (edit, delete, archive)
13. Saved reels library
14. Private/public account toggle
15. Subscription system (Free: 3 reels/month, Pro: $5/month unlimited)
16. Admin console (reel/user/comment moderation, security monitoring)
17. "Made on ReelWrite" watermark (growth engine)
18. PWA-ready (installable on mobile)
19. SEO-ready (sitemap, robots.txt, OG images)
20. Copyright protection (LICENSE, IP guide)

## How to Set Up After Purchase

### 1. Unzip the source code
```
unzip reelwrite-source-code.zip
cd reelwrite
```

### 2. Install dependencies
```
bun install
```

### 3. Set up environment variables
Create a `.env` file:
```
DATABASE_URL=postgresql://your-neon-connection-string
NEXTAUTH_SECRET=your-random-secret
NEXTAUTH_URL=http://localhost:3000
```

### 4. Create the database
```
bun run db:push
bun run scripts/seed.ts
```

### 5. Run locally
```
bun run dev
```
Open http://localhost:3000

### 6. Deploy to Vercel (or Render/Railway)
Follow the instructions in DEPLOY.md

## Database
The current database is hosted on Neon (free PostgreSQL). The buyer can either:
- Use the existing Neon database (transfer the Neon account)
- Create their own Neon database and run `bun run db:push` + `bun run scripts/seed.ts`

## Demo Accounts
All password: `demo1234`
- marina@reelwrite.demo (admin)
- theodore@reelwrite.demo
- kael@reelwrite.demo
- sasha@reelwrite.demo
- fenwick@reelwrite.demo
- opal@reelwrite.demo

## Current State
- ✅ Fully functional and deployed
- ✅ 13 users, 18+ reels, 10+ books in database
- ✅ All features tested and working
- ⚠️ Vercel serverless functions may need time to warm up (free plan limitation)

## Valuation Factors
- 15,000+ lines of production code
- 30+ API routes
- 20+ UI components
- 8+ database models
- Security system with honeypots + attack detection
- Subscription/payment system ready
- PWA + SEO ready
- Copyright + IP protection included

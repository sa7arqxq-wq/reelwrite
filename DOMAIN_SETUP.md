# ReelWrite — Domain & Deployment Setup

This document explains how to point a custom domain at your ReelWrite deployment
and make the app production-ready.

## 1. Current deployment

ReelWrite is a Next.js 16 app running on port 3000 inside the sandbox.
The public preview link is:

```
https://preview-<bot-id>.space-z.ai/
```

Where `<bot-id>` is your sandbox's bot identifier (visible in the preview URL
of your Z.ai workspace).

## 2. Pointing a custom domain

### Option A — Reverse proxy (recommended)

Point your domain (e.g. `reelwrite.app`) at the preview URL using a reverse
proxy. Any of these work:

- **Cloudflare Workers** (free, easy): create a Worker that fetches the preview
  URL and serves it under your domain. Add a custom route in Cloudflare.
- **Vercel/Netlify redirects**: deploy a tiny static site with a single
  `vercel.json` / `_redirects` file that proxies to the preview URL.
- **Nginx/Caddy on a VPS**: proxy_pass to the preview URL.

### Option B — Native deployment

For production-grade hosting, deploy the app directly to:

- **Vercel** (recommended for Next.js): `vercel deploy --prod`
- **Netlify**: `netlify deploy --prod`
- **Self-hosted with Docker**: build with `bun run build`, run with `bun run start`

Then point your domain's DNS A record / CNAME at the hosting provider.

## 3. Update the canonical URL

After you have a custom domain, update these files to use your real URL:

- `public/robots.txt` — replace `https://reelwrite.app/` with your domain
- `public/sitemap.xml` — replace `https://reelwrite.app/` with your domain
- `src/app/layout.tsx` — update the `metadata.openGraph.url` and `twitter.url`
  fields to your domain
- `src/components/reelwrite/ShareSheet.tsx` — update the fallback
  `reelwrite.app` string in the `shareUrl` construction to your domain

## 4. PWA / Installability

The app is configured as a Progressive Web App:

- `public/manifest.json` — app name, icons, shortcuts, theme color
- `public/icon.svg` — vector favicon
- `public/icon-192.png`, `icon-512.png`, `icon-maskable-512.png` — PWA icons
- `public/apple-touch-icon.png` — iOS home screen icon
- `public/favicon-16.png`, `favicon-32.png` — browser tab favicons
- `public/og-image.png` — social sharing image (1200x630)

Users can "Add to Home Screen" on iOS/Android and the app will launch
fullscreen like a native app.

## 5. SEO

- `public/robots.txt` — allows all crawlers
- `public/sitemap.xml` — lists the main routes
- `src/app/layout.tsx` — includes Open Graph, Twitter Card, and canonical tags
- Each reel generates a shareable deep link in the format `/?reel=<id>`
  (the ShareSheet creates a QR code that points to this URL)

## 6. Environment variables

Production deployment needs:

- `DATABASE_URL` — a SQLite file path (for production, use Postgres or MySQL
  by changing the Prisma `datasource` provider)

No other secrets are required for the current demo (auth is auto-provisioned).

## 7. Regenerating assets

If you update the SVG favicon, regenerate the PNG icons and OG image:

```bash
node scripts/gen-icons.js
node scripts/gen-og-image.js
```

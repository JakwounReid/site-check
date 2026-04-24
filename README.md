# SiteCheck

Free, instant website audit tool — speed, SEO, and mobile performance. Built by [Jakwoun Reid](https://jakwoun.me).

**Live:** [site-check.jakwounreid.workers.dev](https://site-check.jakwounreid.workers.dev)

## What it does

Paste a URL and get an instant audit powered by the Google PageSpeed Insights API:

- **Performance, SEO, and Mobile scores** (0–100)
- **Core Web Vitals** — LCP, CLS, INP with pass/fail benchmarks
- **SEO checks** — meta title, description, viewport, sitemap.xml, robots.txt
- **Top 3 issues** — biggest opportunities with estimated savings
- **Email report** — sends a clean HTML summary via Resend

## Architecture

```
Browser → Cloudflare Worker (Hono)
            ├── /* → Static assets (Next.js export, served from CF edge)
            ├── /api/audit → PageSpeed Insights API + KV rate limiter
            └── /api/send-report → Resend REST API
```

The frontend is a Next.js static export (`out/`). The API runs as a single Hono worker with Cloudflare KV for rate limiting (5 req/IP/hour).

## Stack

- **Frontend:** Next.js 14 (App Router) · TypeScript · Tailwind CSS
- **Backend:** Cloudflare Workers · Hono · Workers KV
- **APIs:** Google PageSpeed Insights v5 · Resend (direct REST)
- **Deploy:** Wrangler 4

## Running locally

```bash
git clone https://github.com/JakwounReid/site-check.git
cd site-check
npm install
```

**Option A — full stack (worker + frontend together):**

```bash
npm run build:export   # build Next.js static export → out/
npm run dev:worker     # wrangler dev on http://localhost:8787
```

**Option B — frontend only (hot reload, no worker needed):**

```bash
npm run dev            # next dev on http://localhost:3000
                       # /api/* requests proxy to :8787
```

For Option B you still need the worker running in a separate terminal.

## Secrets

Secrets are stored in Cloudflare (never in `.env` or committed). Set them once:

```bash
npx wrangler secret put PAGESPEED_API_KEY
npx wrangler secret put RESEND_API_KEY
```

| Secret | Required | Notes |
|---|---|---|
| `PAGESPEED_API_KEY` | No | Free at [console.cloud.google.com](https://console.cloud.google.com). Without it: ~2 req/min quota. |
| `RESEND_API_KEY` | Yes | Free at [resend.com](https://resend.com) — 3,000 emails/month. |

`SITE_URL` is a plain var in `worker/wrangler.toml`, not a secret.

## KV namespaces

The rate limiter needs two KV namespaces (prod + preview). Create them once:

```bash
npx wrangler kv:namespace create RATE_LIMIT
npx wrangler kv:namespace create RATE_LIMIT --preview
```

Paste the returned IDs into `worker/wrangler.toml` under `[[kv_namespaces]]`.

## Deploying

```bash
npm run deploy:worker   # build:export + wrangler deploy
```

This builds the Next.js static export, then deploys worker + assets together. Wrangler uploads changed assets only (content-hashed diffing).

## Planned paid features (v2+)

- Audit history with account/auth
- PDF report download
- Scheduled recurring audits with email alerts
- White-label for agencies
- Stripe payments

## Part of

[jakwoun.me](https://jakwoun.me) · Built by [Jakwoun Reid](https://jakwoun.me), full-stack engineer and independent web developer out of Milwaukee, WI.

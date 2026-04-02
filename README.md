# SiteCheck

Free, instant website audit tool — speed, SEO, and mobile performance. Built by [Jakwoun Reid](https://jakwoun.me).

**Live:** [sitecheck.jakwoun.me](https://sitecheck.jakwoun.me) *(coming soon)*

## What it does

Paste a URL and get an instant audit powered by the Google PageSpeed Insights API:

- **Performance, SEO, and Mobile scores** (0–100)
- **Core Web Vitals** — LCP, CLS, INP with pass/fail benchmarks
- **SEO checks** — meta title, description, viewport, sitemap.xml, robots.txt
- **Top 3 issues** — biggest opportunities with estimated savings
- **Email report** — sends a clean HTML summary via Resend

## Stack

- Next.js 14 (App Router) · TypeScript · Tailwind CSS
- Google PageSpeed Insights API (free, no billing required)
- Resend for email delivery
- Deployed on Vercel

## Running locally

```bash
git clone https://github.com/JakwounReid/site-check.git
cd site-check
npm install
cp .env.local.example .env.local
# Fill in your API keys
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `PAGESPEED_API_KEY` | No | Google PageSpeed API key — free at [console.cloud.google.com](https://console.cloud.google.com). Without it you get ~2 req/min. |
| `RESEND_API_KEY` | Yes | Get a free key at [resend.com](https://resend.com) (3,000 emails/month free) |
| `NEXT_PUBLIC_SITE_URL` | No | Your site URL for email CTA links (default: https://jakwoun.me) |

## Deploying to Vercel

1. Push to GitHub
2. Import project in [vercel.com](https://vercel.com)
3. Add environment variables in Vercel project settings
4. Deploy — done

## Planned paid features (v2+)

- Audit history with account/auth
- PDF report download
- Scheduled recurring audits with email alerts
- White-label for agencies
- Stripe payments

## Part of

[jakwoun.me](https://jakwoun.me) · Built by [Jakwoun Reid](https://jakwoun.me), full-stack engineer and independent web developer out of Milwaukee, WI.

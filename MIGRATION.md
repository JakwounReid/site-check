# Vercel → Cloudflare Workers migration

This document covers what changed, why, and the one remaining upgrade path for the rate limiter.

## Why migrate?

The original stack was a Next.js app deployed on Vercel with API routes for the audit and email endpoints. Three things pushed toward Cloudflare Workers:

1. **Rate limiter was broken.** The in-memory map in `app/api/audit/route.ts` reset on every cold start and was never shared across Vercel function instances. Every new deployment wiped the limit state — effectively no rate limiting in production.

2. **Static assets + API in one place.** Workers Static Assets lets you serve a Next.js static export and API routes from the same Cloudflare PoP, in a single deploy artifact. No separate backend service.

3. **Persistent, distributed state without a database.** Workers KV provides a key/value store available globally with no extra infrastructure. For a simple IP counter that's all we need.

## What changed

### Rate limiter: in-memory map → Workers KV

**Before (`app/api/audit/route.ts`):**
```ts
const rateLimit = new Map<string, { count: number; resetAt: number }>();
```
This map lives in the Node.js process. It resets on cold start and is never shared between concurrent instances. On Vercel, where each request can land on a different serverless instance, this provides zero protection.

**After (`worker/src/lib/rate-limit.ts`):**
```ts
await env.RATE_LIMIT.get<RateLimitEntry>(key, "json");
await env.RATE_LIMIT.put(key, JSON.stringify({ count, resetAt }), { expiration: resetAt });
```
KV is globally distributed and persists across restarts. Each IP gets 5 audits per hour; the entry auto-expires at `resetAt` so no cleanup job is needed.

**Known trade-off:** KV is eventually consistent. Two simultaneous first-requests from the same IP can both read `null` and both create a new window — letting one extra request through at window boundaries. For a free audit tool this is an acceptable race. See "Durable Objects upgrade" below if you need hard limits.

### Email: Resend SDK → direct fetch

**Before:**
```ts
import { Resend } from "resend";
const resend = new Resend(process.env.RESEND_API_KEY);
await resend.emails.send({ ... });
```

**After:**
```ts
await fetch("https://api.resend.com/emails", {
  method: "POST",
  headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
  body: JSON.stringify({ ... }),
});
```
The Resend SDK pulls in Node.js-specific dependencies that don't run in the Workers runtime. Direct `fetch` against the Resend REST API works everywhere and removes the dependency entirely.

### Routing: Next.js API routes → Hono

**Before:** `app/api/audit/route.ts`, `app/api/send-report/route.ts` — Next.js route handlers using the Web Request/Response API.

**After:** `worker/src/index.ts` mounts two Hono sub-routers. The logic is identical; only the framework wrapper changed.

```
/health          → inline handler
/api/audit       → worker/src/routes/audit.ts
/api/send-report → worker/src/routes/report.ts
```

### Environment variables: `.env.local` → Wrangler secrets

**Before:** API keys in `.env.local` or Vercel project settings.

**After:** `npx wrangler secret put PAGESPEED_API_KEY` — stored encrypted in Cloudflare, injected into `env` at runtime. Never committed. `SITE_URL` is a plain `[vars]` entry in `wrangler.toml` since it's not sensitive.

### Static frontend: Vercel SSR → Next.js static export + Workers Static Assets

**Before:** Vercel ran Next.js in SSR mode, handling server-side rendering per request.

**After:** `next build` with `output: "export"` produces a static `out/` directory. Wrangler uploads these files to Cloudflare's asset pipeline, which serves them from the nearest PoP with no Worker invocation (and no Worker billing) for cache hits.

The trade-off: no server-side rendering, no `getServerSideProps`, no Next.js API routes — but SiteCheck has no SSR requirements.

## Durable Objects upgrade path

The current KV rate limiter has the eventual-consistency race described above. If you add paid tiers or need hard per-IP quotas, replace it with a Durable Object:

```toml
# wrangler.toml
[[durable_objects.bindings]]
name = "RATE_LIMITER"
class_name = "RateLimiterDO"

[[migrations]]
tag = "v1"
new_classes = ["RateLimiterDO"]
```

```ts
// worker/src/lib/rate-limiter-do.ts
export class RateLimiterDO {
  private count = 0;
  private resetAt = 0;

  async fetch(request: Request): Promise<Response> {
    const now = Math.floor(Date.now() / 1000);
    if (now >= this.resetAt) {
      this.count = 0;
      this.resetAt = now + 3600;
    }
    if (this.count >= 5) return new Response("rate limited", { status: 429 });
    this.count++;
    return new Response("ok");
  }
}
```

Each IP gets its own DO instance. `fetch()` is atomic — no race. Call it from the audit route:

```ts
const id = env.RATE_LIMITER.idFromName(ip);
const stub = env.RATE_LIMITER.get(id);
const res = await stub.fetch(request);
if (res.status === 429) return c.json({ error: "Rate limit exceeded" }, 429);
```

Cost difference: DOs bill per GB-month of storage and per million requests (~$0.15/M vs KV's $0.50/M reads). For low traffic the difference is negligible; DOs become cheaper at scale.

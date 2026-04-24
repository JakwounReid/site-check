import { Hono } from "hono";
import { runAudit } from "../lib/pagespeed";
import { checkRateLimit } from "../lib/rate-limit";

const audit = new Hono<{ Bindings: Env }>();

function isValidUrl(input: string): boolean {
  try {
    const url = new URL(input);
    return (
      ["http:", "https:"].includes(url.protocol) &&
      !["localhost", "127.0.0.1", "::1"].includes(url.hostname)
    );
  } catch {
    return false;
  }
}

audit.post("/", async (c) => {
  // cf-connecting-ip is the verified client IP set by Cloudflare's edge;
  // fall back to x-forwarded-for for local wrangler dev.
  const ip =
    c.req.header("cf-connecting-ip") ??
    c.req.header("x-forwarded-for")?.split(",")[0] ??
    "unknown";

  const allowed = await checkRateLimit(ip, c.env);
  if (!allowed) {
    return c.json(
      { error: "Rate limit exceeded. Max 5 audits per hour." },
      429
    );
  }

  const body = await c.req.json<{ url?: string }>().catch(() => null);
  const url = body?.url?.trim() ?? "";

  if (!url || !isValidUrl(url)) {
    return c.json(
      { error: "Please enter a valid public URL (https://example.com)." },
      400
    );
  }

  try {
    const result = await runAudit(url, c.env);
    return c.json(result);
  } catch (err) {
    console.error("Audit error:", err);
    return c.json(
      { error: "Could not audit this URL. Make sure it's publicly accessible." },
      500
    );
  }
});

export default audit;
